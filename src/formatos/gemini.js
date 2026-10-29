// ============================================================================
// CHATBOT ROAM PLUGIN - FORMATO GEMINI
// Exportaciones de Gemini: turnos "## User:" / "## Gemini:" (antes "## Prompt:" /
// "## Response:"), con el razonamiento en una cita "> **Thinking steps**"
// ============================================================================

const ChatbotRoamFormatoGemini = {
    id: 'gemini',
    nombre: 'Gemini',

    MARCADOR_PROMPT: /^## (?:User|Prompt):/gm,
    MARCADOR_RESPUESTA: /^## (?:Gemini|Response):/gm,

    detectar(contenido) {
        return /^## Gemini:/m.test(contenido) ||
            /^>\s*(?:\*\*Thinking steps\*\*|Thinking:)/m.test(contenido) ||
            contenido.includes('Gemini Exporter');
    },

    opciones: [
        {
            id: 'eliminar_thinking_gemini',
            label: 'Bloques Thinking (Gemini)',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoGemini.eliminarThinking(texto); }
        },
        {
            id: 'limpiar_etiquetas_codigo_gemini',
            label: 'Limpiar parámetros en código (?code_...)',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoGemini.limpiarEtiquetasCodigo(texto); }
        },
        {
            id: 'eliminar_footer_gemini',
            label: 'Footer Gemini Exporter',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoGemini.limpiarMetadata(texto); }
        },
        {
            id: 'eliminar_adjuntos_gemini',
            label: 'Adjuntos Gemini',
            defaultActivo: true,
            aplicarA: 'ambos',
            cleaner: function (texto) { return ChatbotRoamFormatoGemini.eliminarAdjuntos(texto); }
        }
    ],

    /**
     * Elimina bloques de 'Thinking:' y 'Thinking steps'.
     * Soporta variaciones de formato y saltos de linea dentro del bloque de pensamiento.
     */
    eliminarThinking(texto) {
        if (!texto) return '';
        const lineas = texto.split('\n');
        const lineasLimpias = [];
        let enBloqueThinking = false;

        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            const lineaStripped = linea.trim();

            const isThinkingStart = /^>\s*(?:\*{1,2})?Thinking(?:\s+steps|\s+process)?:?(?:\*{1,2})?/i.test(lineaStripped);
            if (isThinkingStart) {
                enBloqueThinking = true;
                continue;
            }

            if (enBloqueThinking) {
                if (lineaStripped.startsWith('>')) {
                    continue;
                } else if (lineaStripped === '') {
                    // Si es linea vacia pero la siguiente linea todavia es blockquote, seguir en thinking
                    let sigueQuote = false;
                    for (let k = i + 1; k < lineas.length; k++) {
                        const nextTrim = lineas[k].trim();
                        if (nextTrim === '') continue;
                        if (nextTrim.startsWith('>')) {
                            sigueQuote = true;
                        }
                        break;
                    }
                    if (sigueQuote) {
                        continue;
                    } else {
                        enBloqueThinking = false;
                    }
                } else {
                    enBloqueThinking = false;
                }
            }

            if (!enBloqueThinking) {
                lineasLimpias.push(linea);
            }
        }

        return lineasLimpias.join('\n');
    },

    /**
     * Elimina el símbolo '>' de líneas de adjuntos.
     */
    eliminarAdjuntos(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];
        const extensiones = ['DOCX', 'PDF', 'PNG', 'JPG', 'JPEG', 'TXT', 'MD', 'CSV', 'XLSX', 'XLS', 'PPT', 'PPTX'];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();

            if (lineaStripped.startsWith('>') && !lineaStripped.startsWith('> Thinking:') && !lineaStripped.startsWith('> **Thinking steps**')) {
                const textoDespuesMayor = lineaStripped.substring(1).trim();
                const tieneExtension = extensiones.some(ext => textoDespuesMayor.toUpperCase().includes(ext));

                if (tieneExtension || textoDespuesMayor.includes('_')) {
                    lineasLimpias.push(textoDespuesMayor);
                    continue;
                }
            }

            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    },

    /**
     * Limpia parametros y tags de ejecucion en fences de codigo (?code_reference, ?code_stdout, etc.)
     * preservando el bloque de codigo y su lenguaje limpio para Roam.
     */
    limpiarEtiquetasCodigo(texto) {
        if (!texto) return '';
        const BT3 = ChatbotRoamComun.BT3;
        const BT4 = ChatbotRoamComun.BT4;
        // Limpiar parametros tipo ?code_reference&... dejando solo el lenguaje (ej: BT3+python?code_... -> BT3+python)
        texto = texto.replace(new RegExp('(' + BT4 + '|' + BT3 + ')([a-zA-Z0-9_-]+)\\?[^\\n\\r\\x60]*', 'g'), '$1$2');
        // Si no tenia nombre de lenguaje: BT3+?code_... -> BT3
        texto = texto.replace(new RegExp('(' + BT4 + '|' + BT3 + ')\\?[^\\n\\r\\x60]*', 'g'), '$1');
        return texto;
    },

    /**
     * Elimina metadata del exportador (footers, separadores y timestamps).
     */
    limpiarMetadata(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();

            if (lineaStripped.startsWith('> ') && lineaStripped.includes(' - MD')) continue;
            if (linea.includes('Powered by') && (linea.includes('Gemini Exporter') || linea.includes('ai-chat-exporter'))) continue;
            if (lineaStripped === '---' || lineaStripped === '***' || lineaStripped === '___') continue;
            if (ChatbotRoamComun.TIMESTAMP_BLOCKQUOTE.test(lineaStripped)) continue;
            if (ChatbotRoamComun.TIMESTAMP_COMPLETO.test(lineaStripped)) continue;

            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    }
};
