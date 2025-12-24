// ============================================================================
// CHATBOT ROAM PLUGIN - CLEANERS
// Cleaning functions ported from Python chatbotRoam/cleaners.py
// ============================================================================

const ChatbotRoamCleaners = {
    // ========================================================================
    // FUNCIONES DE LIMPIEZA GENÉRICAS
    // ========================================================================

    /**
     * Elimina las líneas de Markdown que contienen imágenes Base64.
     */
    eliminarImagenesEmbedidas(texto) {
        // Patrón 1: Imágenes completas con paréntesis de cierre
        texto = texto.replace(ChatbotRoamPatterns.IMAGEN_COMPLETA, '');

        // Patrón 2: Imágenes truncadas
        texto = texto.replace(ChatbotRoamPatterns.IMAGEN_TRUNCADA, '');

        // Patrón 3: Limpiar líneas que solo contienen restos de Base64
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            if (linea.length > 100) {
                let charsBase64 = 0;
                for (const c of linea) {
                    if (/[a-zA-Z0-9+/=]/.test(c)) charsBase64++;
                }
                const ratio = charsBase64 / linea.length;
                if (ratio > 0.9) continue;
            }
            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    },

    /**
     * Limpia líneas vacías excesivas y espacios al inicio/fin.
     */
    limpiarContenido(texto) {
        texto = texto.replace(ChatbotRoamPatterns.LINEAS_VACIAS_EXCESIVAS, '\n\n');
        return texto.trim();
    },

    /**
     * Limpia etiquetas de lenguaje de bloques de código pero PRESERVA los delimitadores.
     */
    limpiarFormatoMarkdownBasico(texto) {
        texto = texto.replace(ChatbotRoamPatterns.CODIGO_CUATRO_BACKTICKS, ChatbotRoamPatterns.BT4);
        texto = texto.replace(ChatbotRoamPatterns.CODIGO_TRES_BACKTICKS, ChatbotRoamPatterns.BT3);
        return texto;
    },

    // ========================================================================
    // LIMPIEZA GENÉRICA / CHATGPT
    // ========================================================================

    /**
     * Elimina los logs de herramientas de búsqueda como 'project_knowledge_search'.
     */
    eliminarToolLogsGenerico(texto) {
        if (!texto.includes('**project_knowledge_search**')) {
            return texto;
        }

        const partes = texto.split('**project_knowledge_search**');
        const antesDelLog = partes[0];
        const logYPosibleRespuesta = partes[1];

        let posUltFence = logYPosibleRespuesta.lastIndexOf(ChatbotRoamPatterns.BT4);
        if (posUltFence === -1) {
            posUltFence = logYPosibleRespuesta.lastIndexOf(ChatbotRoamPatterns.BT3);
        }

        if (posUltFence !== -1) {
            const longitudFence = logYPosibleRespuesta.substring(posUltFence, posUltFence + 4) === ChatbotRoamPatterns.BT4 ? 4 : 3;
            const finDelLog = posUltFence + longitudFence;
            const respuestaReal = logYPosibleRespuesta.substring(finDelLog);
            return antesDelLog + respuestaReal;
        } else {
            return antesDelLog;
        }
    },

    /**
     * Elimina bloques de razonamiento del modelo (ChatGPT).
     */
    eliminarThoughtProcessGenerico(texto) {
        return texto.replace(ChatbotRoamPatterns.THOUGHT_PROCESS_GENERICO, '');
    },

    /**
     * Elimina líneas de metadata como fechas y '> File:'.
     */
    limpiarMetadataGenerico(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();
            if (lineaStripped.startsWith('> File:')) continue;
            if (ChatbotRoamPatterns.TIMESTAMP_COMPLETO.test(lineaStripped)) continue;
            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    },

    // ========================================================================
    // LIMPIEZA CLAUDE
    // ========================================================================

    /**
     * Elimina TODOS los bloques de metadata interna de Claude (plaintext blocks).
     */
    eliminarThoughtProcessClaude(texto) {
        return texto.replace(ChatbotRoamPatterns.PLAINTEXT_BLOCKS_CLAUDE, '');
    },

    /**
     * Elimina los bloques completos de herramientas de Claude.
     */
    eliminarToolCallsClaude(texto) {
        // Patrón completo
        texto = texto.replace(ChatbotRoamPatterns.TOOL_CALLS_COMPLETO, '');
        // Patrón simple
        texto = texto.replace(ChatbotRoamPatterns.TOOL_CALLS_SIMPLE, '');
        return texto;
    },

    /**
     * Elimina líneas que comienzan con 'Thought:'.
     */
    eliminarThoughtLinesClaude(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            if (linea.trim().startsWith('Thought:')) continue;
            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    },

    /**
     * Elimina bloques completos de MCP tool calls de Claude.
     */
    eliminarMcpToolCallsClaude(texto) {
        // Paso 1: Eliminar bloques completos de MCP tool calls
        texto = texto.replace(ChatbotRoamPatterns.MCP_TOOL_CALLS, '');

        // Paso 2: Limpiar líneas residuales (nombres de herramientas sueltos)
        const patronNombresResiduales = /^\*\*[\w-]+:[\w_]+\*\*\s*$/gm;
        texto = texto.replace(patronNombresResiduales, '');

        // Paso 3: Limpiar *Request* y *Response* huérfanos
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();
            if (lineaStripped === '*Request*' || lineaStripped === '*Response*') continue;
            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    },

    /**
     * Elimina metadata específica de Claude.
     */
    limpiarMetadataClaude(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();
            if (lineaStripped.startsWith('> File:')) continue;
            if (ChatbotRoamPatterns.TIMESTAMP_COMPLETO.test(lineaStripped)) continue;
            if (lineaStripped === '*Request*' || lineaStripped === '*Response*') continue;
            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    },

    // ========================================================================
    // LIMPIEZA GEMINI
    // ========================================================================

    /**
     * Elimina bloques de 'Thinking:' específicos de Gemini.
     */
    eliminarThinkingGemini(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];
        let enBloqueThinking = false;

        for (const linea of lineas) {
            const lineaStripped = linea.trim();

            if (lineaStripped.startsWith('> Thinking:')) {
                enBloqueThinking = true;
                continue;
            }

            if (enBloqueThinking) {
                if (lineaStripped.startsWith('>')) {
                    continue;
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
     * Elimina el símbolo '>' de líneas de adjuntos de Gemini.
     */
    eliminarAdjuntosGemini(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];
        const extensiones = ['DOCX', 'PDF', 'PNG', 'JPG', 'JPEG', 'TXT', 'MD', 'CSV', 'XLSX', 'XLS', 'PPT', 'PPTX'];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();

            if (lineaStripped.startsWith('>') && !lineaStripped.startsWith('> Thinking:')) {
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
     * Elimina metadata específica de Gemini.
     */
    limpiarMetadataGemini(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();

            if (lineaStripped.startsWith('> ') && lineaStripped.includes(' - MD')) continue;
            if (linea.includes('Powered by') && linea.includes('Gemini Exporter')) continue;
            if (lineaStripped === '---') continue;

            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    }
};
