// CHATBOT ROAM PLUGIN v1.5.5
// Importador de conversaciones de chatbots (Claude, Gemini, NotebookLM) a Roam
// Uso: Ctrl+Shift+I o Command Palette
// Generated: 2026-10-29 13:08:48


// --- patterns.js ---
// CHATBOT ROAM PLUGIN - PATTERNS
// Regex patterns ported from Python chatbotRoam/patterns.py
// NOTE: Using RegExp constructor to avoid backtick issues in Roam

// Helper: backtick constants (char code 96)
const BT3 = String.fromCharCode(96, 96, 96);
const BT4 = String.fromCharCode(96, 96, 96, 96);

// Helper: NotebookLM markers (generated at runtime to avoid encoding issues)
// Person emoji: U+1F9D1, Robot emoji: U+1F916
// Chinese: 用户 (user) = U+7528 U+6237, 助手 (assistant) = U+52A9 U+624B
const NOTEBOOKLM_PERSON = String.fromCodePoint(0x1F9D1);
const NOTEBOOKLM_ROBOT = String.fromCodePoint(0x1F916);
const NOTEBOOKLM_USER = String.fromCharCode(0x7528, 0x6237);
const NOTEBOOKLM_ASSISTANT = String.fromCharCode(0x52A9, 0x624B);

const ChatbotRoamPatterns = {
    // Version info
    VERSION: "1.5.5",

    // IMAGENES BASE64
    IMAGEN_COMPLETA: /!\[[^\]]*\]\(data:image\/[^)]*\)/g,
    IMAGEN_TRUNCADA: /!\[[^\]]*\]\(data:image\/[^\n)]*(?=\n|$)/g,

    // FORMATO MARKDOWN
    LINEAS_VACIAS_EXCESIVAS: /\n{3,}/g,
    CODIGO_CUATRO_BACKTICKS: new RegExp(BT4 + "[^\\n\\r\\x60]+", "g"),
    CODIGO_TRES_BACKTICKS: new RegExp(BT3 + "[^\\n\\r\\x60]+", "g"),

    // TIMESTAMPS
    TIMESTAMP_COMPLETO: /^\d{1,2}\/\d{1,2}\/\d{4},\s+\d{1,2}:\d{2}:\d{2}\s+[ap]\.m\.$/,
    TIMESTAMP_FECHA: /^\d{1,2}\/\d{1,2}\/\d{4}/,
    // Timestamp en formato blockquote (nuevo formato Claude): > 5/20/2026 22:35:00
    TIMESTAMP_BLOCKQUOTE: /^>\s*\d{1,2}\/\d{1,2}\/\d{4},?\s+\d{1,2}:\d{2}(:\d{2})?/,

    // MARCADORES DE CONVERSACION
    // Formato clásico: ## Prompt: / ## Response:
    PROMPT_MARKER: /^## Prompt:/gm,
    RESPONSE_MARKER: /^## Response:/gm,
    // Formato Claude V2 (actualización del exportador): ## User: / ## Assistant:
    PROMPT_MARKER_V2: /^## User:/gm,
    RESPONSE_MARKER_V2: /^## Assistant:/gm,
    // Formato Gemini Exporter: ## User: / ## Gemini:
    RESPONSE_MARKER_GEMINI: /^## Gemini:/gm,

    // NOTEBOOKLM FORMAT
    NOTEBOOKLM_PROMPT_MARKER: /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?(?:User|Usuario|\u7528\u6237|Prompt)(?:\*\*)?\s*$/gmi,
    NOTEBOOKLM_RESPONSE_MARKER: /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?(?:NotebookLM|Assistant|Asistente|\u52A9\u624B|Response)(?:\*\*)?\s*$/gmi,
    NOTEBOOKLM_PROMPT_STR: null,       // For backwards compatibility string matching
    NOTEBOOKLM_RESPONSE_STR: null,     // For backwards compatibility string matching

    // DETECCION DE TIPO DE CHATBOT
    DETECT_GEMINI_THINKING: /^>\s*(?:\*\*Thinking steps\*\*|Thinking:)/m,

    // Helper getters for backtick strings
    get BT3() { return BT3; },
    get BT4() { return BT4; },

    // Helper for NotebookLM detection
    isNotebookLM(content) {
        if (!content) return false;
        if (/source:\s*NotebookLM/i.test(content)) return true;
        if (this.NOTEBOOKLM_PROMPT_MARKER &&
            new RegExp(this.NOTEBOOKLM_PROMPT_MARKER.source, 'mi').test(content) &&
            this.NOTEBOOKLM_RESPONSE_MARKER &&
            new RegExp(this.NOTEBOOKLM_RESPONSE_MARKER.source, 'mi').test(content)) {
            return true;
        }
        if (/^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?NotebookLM(?:\*\*)?\s*$/mi.test(content)) {
            return true;
        }
        return (this.NOTEBOOKLM_PROMPT_STR && content.includes(this.NOTEBOOKLM_PROMPT_STR)) ||
            (this.NOTEBOOKLM_RESPONSE_STR && content.includes(this.NOTEBOOKLM_RESPONSE_STR));
    }
};

// Initialize NotebookLM legacy string patterns after object creation
ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR = '### ' + NOTEBOOKLM_PERSON + ' **' + NOTEBOOKLM_USER + '**';
ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_STR = '### ' + NOTEBOOKLM_ROBOT + ' **' + NOTEBOOKLM_ASSISTANT + '**';


// --- cleaners.js ---
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

        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            const len = linea.length;
            if (len > 100) {
                // Contar caracteres que NO son de base64
                const nonBase64Count = (linea.match(/[^a-zA-Z0-9+/=]/g) || []).length;
                const ratio = (len - nonBase64Count) / len;
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

    /**
     * Neutraliza la sintaxis especial de Roam (::, [[, ]]) para evitar que se creen 
     * atributos y referencias a páginas accidentalmente al importar texto de IA,
     * preservando intactos los bloques de código.
     */
    neutralizarSintaxisRoam(texto) {
        if (!texto) return '';
        // Separar en segmentos: texto normal vs bloques de codigo
        const B3 = String.fromCharCode(96, 96, 96);
        const partes = texto.split(new RegExp('(' + B3 + '+[\\s\\S]*?' + B3 + '+)', 'g'));

        for (let i = 0; i < partes.length; i++) {
            // Los índices pares son texto normal; los impares son bloques de código protegidos
            if (i % 2 === 0) {
                let limpio = partes[i].replace(/::/g, ': :');
                // Múltiples corchetes como [[[[ se transforman usando lookahead para separar cada uno
                limpio = limpio.replace(/\[(?=\[)/g, '[ ');
                limpio = limpio.replace(/\](?=\])/g, '] ');
                partes[i] = limpio;
            }
        }
        return partes.join('');
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
     * Elimina los bloques de pensamiento de Claude V2 que se presentan en formato blockquote
     * (líneas consecutivas que empiezan con '>'). Solo los elimina si el bloque contiene
     * la firma de finalización de pensamiento '- **Done**'.
     */
    eliminarThinkingBlockquotesClaude(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];
        let bloqueActual = [];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();

            if (lineaStripped.startsWith('>')) {
                bloqueActual.push(linea);
            } else {
                if (bloqueActual.length > 0) {
                    const esThinkingBlock = bloqueActual.some(line => /- \*\*Done\*\*/i.test(line));
                    if (!esThinkingBlock) {
                        for (let k = 0; k < bloqueActual.length; k++) {
                            lineasLimpias.push(bloqueActual[k]);
                        }
                    }
                    bloqueActual = [];
                }
                lineasLimpias.push(linea);
            }
        }

        if (bloqueActual.length > 0) {
            const esThinkingBlock = bloqueActual.some(line => /- \*\*Done\*\*/i.test(line));
            if (!esThinkingBlock) {
                for (let k = 0; k < bloqueActual.length; k++) {
                    lineasLimpias.push(bloqueActual[k]);
                }
            }
        }

        return lineasLimpias.join('\n');
    },

    // ========================================================================
    // LIMPIEZA GEMINI
    // ========================================================================

    /**
     * Elimina bloques de 'Thinking:' y 'Thinking steps' específicos de Gemini.
     * Soporta variaciones de formato y saltos de linea dentro del bloque de pensamiento.
     */
    eliminarThinkingGemini(texto) {
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
     * Elimina el símbolo '>' de líneas de adjuntos de Gemini.
     */
    eliminarAdjuntosGemini(texto) {
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
     * Limpia parametros y tags de ejecucion en fences de codigo de Gemini (?code_reference, ?code_stdout, etc.)
     * preservando el bloque de codigo y su lenguaje limpio para Roam.
     */
    limpiarEtiquetasCodigoGemini(texto) {
        if (!texto) return '';
        const BT3 = ChatbotRoamPatterns.BT3;
        const BT4 = ChatbotRoamPatterns.BT4;
        // Limpiar parametros tipo ?code_reference&... dejando solo el lenguaje (ej: BT3+python?code_... -> BT3+python)
        texto = texto.replace(new RegExp('(' + BT4 + '|' + BT3 + ')([a-zA-Z0-9_-]+)\\?[^\\n\\r\\x60]*', 'g'), '$1$2');
        // Si no tenia nombre de lenguaje: BT3+?code_... -> BT3
        texto = texto.replace(new RegExp('(' + BT4 + '|' + BT3 + ')\\?[^\\n\\r\\x60]*', 'g'), '$1');
        return texto;
    },

    /**
     * Elimina metadata específica de Gemini (footers de exportador, separadores y timestamps).
     */
    limpiarMetadataGemini(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();

            if (lineaStripped.startsWith('> ') && lineaStripped.includes(' - MD')) continue;
            if (linea.includes('Powered by') && (linea.includes('Gemini Exporter') || linea.includes('ai-chat-exporter'))) continue;
            if (lineaStripped === '---' || lineaStripped === '***' || lineaStripped === '___') continue;
            if (ChatbotRoamPatterns.TIMESTAMP_BLOCKQUOTE.test(lineaStripped)) continue;
            if (ChatbotRoamPatterns.TIMESTAMP_COMPLETO.test(lineaStripped)) continue;

            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    },

    // ========================================================================
    // LIMPIEZA NOTEBOOKLM
    // ========================================================================

    /**
     * Limpia escapes innecesarios de NotebookLM, como "1\." que debería ser "1.",
     * y elimina el prefijo "Thoughts" aislado al inicio de respuestas.
     */
    limpiarEscapesNotebookLM(texto) {
        // Eliminar línea aislada "Thoughts" al inicio de respuesta
        texto = texto.replace(/^Thoughts\s*\n+/i, '');
        // Reemplazar "numero\." por "numero."
        texto = texto.replace(/(\d+)\\\./g, '$1.');
        // Reemplazar "\-" por "-" (por si acaso)
        texto = texto.replace(/\\-/g, '-');
        return texto;
    },

    /**
     * Elimina el bloque de fuentes citado por NotebookLM al final de la respuesta.
     * Ejemplo:
     * > **Sources:**
     * > [1] archivo.pdf
     */
    eliminarFuentesNotebookLM(texto) {
        return texto.replace(/> \*\*(?:来源[:：]|Sources[:：]|Fuentes[:：])\*\*(?:\r?\n> \[\d+\].*)*/gi, '');
    },

    // ========================================================================
    // CONVERSIÓN DE TABLAS MARKDOWN A ROAM
    // ========================================================================

    /**
     * Convierte tablas Markdown a formato de tablas Roam.
     * 
     * Input Markdown:
     * | Header1 | Header2 | Header3 |
     * |---------|---------|---------|
     * | Cell1   | Cell2   | Cell3   |
     * 
     * Output Roam:
     * {{[[table]]}}
     *     - Header1
     *         - Header2
     *             - Header3
     *     - Cell1
     *         - Cell2
     *             - Cell3
     */
    convertirTablasMarkdownARoam(texto) {
        const lineas = texto.split('\n');
        const resultado = [];
        let i = 0;

        while (i < lineas.length) {
            const linea = lineas[i];
            const lineaStripped = linea.trim();

            // Detectar posible inicio de tabla (línea que empieza y termina con |)
            if (this._esLineaTablaMarkdown(lineaStripped)) {
                // Verificar si la siguiente línea es un separador de tabla
                const siguienteLinea = i + 1 < lineas.length ? lineas[i + 1].trim() : '';

                if (this._esSeparadorTabla(siguienteLinea)) {
                    // Es una tabla válida - extraer todas las líneas de la tabla
                    const tablaLineas = [];
                    tablaLineas.push(lineaStripped); // Header

                    // Saltar el separador (no lo incluimos en la salida)
                    let j = i + 2;

                    // Recolectar filas de datos
                    while (j < lineas.length && this._esLineaTablaMarkdown(lineas[j].trim())) {
                        tablaLineas.push(lineas[j].trim());
                        j++;
                    }

                    // Convertir a formato Roam
                    const tablaRoam = this._convertirTablaARoam(tablaLineas);
                    for (let k = 0; k < tablaRoam.length; k++) {
                        resultado.push(tablaRoam[k]);
                    }

                    i = j; // Saltar las líneas procesadas
                    continue;
                }
            }

            // No es una tabla - mantener la línea original
            resultado.push(linea);
            i++;
        }

        return resultado.join('\n');
    },

    /**
     * Detecta si una línea es parte de una tabla Markdown (empieza y termina con |)
     * @private
     */
    _esLineaTablaMarkdown(lineaStripped) {
        return lineaStripped.startsWith('|') && lineaStripped.endsWith('|') && lineaStripped.length > 2;
    },

    /**
     * Detecta si una línea es un separador de tabla Markdown (|---|---|)
     * @private
     */
    _esSeparadorTabla(lineaStripped) {
        if (!lineaStripped.startsWith('|') || !lineaStripped.endsWith('|')) return false;
        // Separador tiene formato: |---|---| o |:---|:---:| etc.
        const sinPipes = lineaStripped.slice(1, -1);
        // Cada celda debe ser solo guiones, dos puntos opcionales, y espacios
        const celdas = sinPipes.split('|');
        return celdas.every(celda => /^[\s:-]+$/.test(celda) && celda.includes('-'));
    },

    /**
     * Extrae las celdas de una línea de tabla Markdown
     * @private
     */
    _extraerCeldasTabla(lineaStripped) {
        // Quitar pipes inicial y final, luego split por |
        const sinPipes = lineaStripped.slice(1, -1);
        return sinPipes.split('|').map(celda => celda.trim());
    },

    /**
     * Convierte un array de líneas de tabla Markdown a formato Roam
     * @private
     */
    _convertirTablaARoam(tablaLineas) {
        if (tablaLineas.length === 0) return [];

        const resultado = [];
        const INDENT = '    '; // 4 espacios por nivel

        // Primera línea: marcador de tabla Roam
        resultado.push('{{[[table]]}}');

        // Procesar cada fila (la primera es headers, las demás son datos)
        for (const linea of tablaLineas) {
            const celdas = this._extraerCeldasTabla(linea);

            if (celdas.length === 0) continue;

            // Generar la estructura anidada para esta fila
            // Cada columna se anida un nivel más profundo
            for (let col = 0; col < celdas.length; col++) {
                const indent = INDENT.repeat(col + 1); // +1 porque el primer nivel es hijo de {{[[table]]}}
                const celda = celdas[col] || ''; // Celda vacía si no hay contenido
                resultado.push(indent + '- ' + celda);
            }
        }

        return resultado;
    },
    /**
     * Separa el texto colisionado tras un cierre de negritas en exportaciones de NotebookLM
     * Asegura que el patrón **Texto**Descripción se convierta en **Texto**\nDescripción
     */
    separarHeadersColisionadosNotebookLM(texto) {
        return texto.replace(/(\S)\*\*([A-ZÁÉÍÓÚÑ¿¡])/g, '$1**\n$2');
    },

    /**
     * Normaliza las viñetas de NotebookLM (\u2022, \u25E6) para asegurar saltos de línea y formato correcto.
     */
    normalizarVinetasNotebookLM(texto) {
        // 1. Reemplazar viñeta sólida "\u2022 " por salto + guión "- "
        // Se usa \n- para garantizar que quede en su propia línea
        texto = texto.replace(/\u2022 /g, '\n- ');

        // 2. Reemplazar viñeta hueca "\u25E6 " por salto + indentación + guión
        // Se asume nivel 1 de indentación (4 espacios)
        texto = texto.replace(/\u25E6 /g, '\n    - ');

        // Limpieza de posibles saltos dobles introducidos si ya había saltos
        texto = texto.replace(/\n\n- /g, '\n- ');
        texto = texto.replace(/\n\n    - /g, '\n    - ');

        return texto;
    },
};


// --- opciones-limpieza.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - OPCIONES DE LIMPIEZA
// Registro centralizado de todas las opciones de limpieza
// ============================================================================

/**
 * Definición centralizada de opciones de limpieza.
 * Para añadir una nueva opción:
 * 1. Agregar un objeto a este array
 * 2. Ejecutar build.ps1
 * 3. Listo - el UI y la lógica lo detectan automáticamente
 */
const OPCIONES_LIMPIEZA = [
    // ========================================================================
    // OPCIONES GENÉRICAS (todos los chatbots)
    // ========================================================================
    {
        id: 'eliminar_imagenes',
        label: 'Imagenes Base64',
        chatbots: ['claude', 'gemini', 'notebooklm'],
        defaultActivo: true,
        aplicarA: 'none', // Se ejecuta una sola vez en el preproceso global
        cleaner: function (texto) { return texto; }
    },
    {
        id: 'eliminar_metadata',
        label: 'Timestamps y referencias',
        chatbots: ['claude', 'gemini', 'notebooklm'],
        defaultActivo: false,
        aplicarA: 'ambos',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarMetadataGenerico(texto); }
    },
    {
        id: 'neutralizar_sintaxis',
        label: 'Neutralizar sintaxis Roam (::, [[ ]]) en la IA',
        chatbots: ['claude', 'gemini', 'notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.neutralizarSintaxisRoam(texto); }
    },

    // ========================================================================
    // OPCIONES CLAUDE
    // ========================================================================
    {
        id: 'eliminar_thinking_blockquotes_claude',
        label: 'Bloques de pensamiento (Claude V2)',
        chatbots: ['claude'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarThinkingBlockquotesClaude(texto); }
    },

    // ========================================================================
    // OPCIONES GEMINI
    // ========================================================================
    {
        id: 'eliminar_thinking_gemini',
        label: 'Bloques Thinking (Gemini)',
        chatbots: ['gemini'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarThinkingGemini(texto); }
    },
    {
        id: 'limpiar_etiquetas_codigo_gemini',
        label: 'Limpiar par\u00e1metros en c\u00f3digo (?code_...)',
        chatbots: ['gemini'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarEtiquetasCodigoGemini(texto); }
    },
    {
        id: 'eliminar_footer_gemini',
        label: 'Footer Gemini Exporter',
        chatbots: ['gemini'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarMetadataGemini(texto); }
    },
    {
        id: 'eliminar_adjuntos_gemini',
        label: 'Adjuntos Gemini',
        chatbots: ['gemini'],
        defaultActivo: true,
        aplicarA: 'ambos',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarAdjuntosGemini(texto); }
    },

    // ========================================================================
    // OPCIONES NOTEBOOKLM
    // ========================================================================
    {
        id: 'separar_headers_colisionados_notebooklm',
        label: 'Separar t\u00edtulos colisionados',
        chatbots: ['notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.separarHeadersColisionadosNotebookLM(texto); }
    },
    {
        id: 'normalizar_vinetas_notebooklm',
        label: 'Normalizar vi\u00f1etas (\u2022, \u25e6)',
        chatbots: ['notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.normalizarVinetasNotebookLM(texto); }
    },
    {
        id: 'eliminar_fuentes_notebooklm',
        label: 'Eliminar fuentes/sources (NotebookLM)',
        chatbots: ['notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarFuentesNotebookLM(texto); }
    },

    // ========================================================================
    // CONVERSIÓN DE FORMATO
    // ========================================================================
    {
        id: 'convertir_tablas_roam',
        label: 'Convertir tablas a Roam',
        chatbots: ['claude', 'gemini', 'notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.convertirTablasMarkdownARoam(texto); }
    }
];

// ============================================================================
// OBJETO PRINCIPAL - Helpers para consumir las opciones
// ============================================================================

const ChatbotRoamOpciones = {
    /**
     * Devuelve todas las opciones definidas
     */
    getAll: function () {
        return OPCIONES_LIMPIEZA;
    },

    /**
     * Genera el objeto de preset para un tipo de chatbot
     * @param {string} tipo - 'claude', 'gemini', 'notebooklm', 'generico'
     * @returns {Object} - Objeto con todas las opciones y sus valores default
     */
    getPreset: function (tipo) {
        const preset = {};

        for (var i = 0; i < OPCIONES_LIMPIEZA.length; i++) {
            var opcion = OPCIONES_LIMPIEZA[i];
            // La opcion esta activa si el chatbot esta en su lista
            var estaEnChatbot = opcion.chatbots.indexOf(tipo) !== -1;
            preset[opcion.id] = estaEnChatbot && opcion.defaultActivo;
        }

        return preset;
    },

    /**
     * Aplica los cleaners activos a un texto
     * @param {string} texto - Texto a limpiar
     * @param {Object} opcionesActivas - Objeto con opciones activas (true/false)
     * @param {string} destino - 'prompt' o 'respuesta'
     * @returns {string} - Texto limpio
     */
    aplicarLimpieza: function (texto, opcionesActivas, destino) {
        for (var i = 0; i < OPCIONES_LIMPIEZA.length; i++) {
            var opcion = OPCIONES_LIMPIEZA[i];

            // Verificar si la opcion esta activa
            if (!opcionesActivas[opcion.id]) continue;

            // Verificar si aplica a este destino
            var aplica = opcion.aplicarA === 'ambos' || opcion.aplicarA === destino;
            if (!aplica) continue;

            // Aplicar el cleaner
            texto = opcion.cleaner(texto);
        }

        return texto;
    },

    /**
     * Genera el HTML de los checkboxes para el modal
     * @returns {string} - HTML de los checkboxes
     */
    generarCheckboxesHTML: function () {
        var html = '';

        for (var i = 0; i < OPCIONES_LIMPIEZA.length; i++) {
            var opcion = OPCIONES_LIMPIEZA[i];
            html += '<label class="chatbot-roam-option">' +
                '<input type="checkbox" data-option="' + opcion.id + '">' +
                opcion.label +
                '</label>';
        }

        return html;
    }
};


// --- formatter.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - FORMATTER
// Formats cleaned responses for Roam block structure
// ============================================================================

const ChatbotRoamFormatter = {
    // Constantes de indentacion
    INDENT_BASE: '    ',      // 4 espacios - respuestas nivel 1
    INDENT_HEADING: '        ', // 8 espacios - contenido bajo headings

    /**
     * Formatea una respuesta limpia para estructura de bloques Roam
     * Maneja headings markdown (h1 a h6), listas anidadas, bloques de codigo, tablas Roam y texto normal
     * 
     * @param {string} responseLimpio - Texto de respuesta ya limpiado
     * @returns {Array<string>} - Lineas formateadas con indentacion correcta
     */
    formatResponseLines(responseLimpio) {
        if (!responseLimpio) return [];

        var resultado = [];
        var lineasResponse = responseLimpio.split('\n');
        var enBloqueCodigo = false;
        var codigoBuffer = [];
        var enTablaRoam = false;
        var indentTablaActual = 0;

        // Pila para rastrear la profundidad de headings (#, ##, ###, etc.)
        // Cada elemento es { hLevel: number, indentSpaces: number }
        var headingStack = [];

        // Definir backtick directamente para evitar problemas de resolucion
        var BACKTICK = String.fromCharCode(96);

        for (var j = 0; j < lineasResponse.length; j++) {
            var linea = lineasResponse[j];
            var lineaStripped = linea.trim();

            // ================================================================
            // DETECCIÓN DE TABLA ROAM
            // ================================================================
            if (lineaStripped === '{{[[table]]}}') {
                enTablaRoam = true;
                var currentIndent = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;
                indentTablaActual = currentIndent;
                resultado.push(' '.repeat(currentIndent) + lineaStripped);
                continue;
            }

            // Si estamos dentro de una tabla Roam
            if (enTablaRoam) {
                // Línea vacía = fin de tabla
                if (!lineaStripped) {
                    enTablaRoam = false;
                    resultado.push('');
                    continue;
                }

                // Línea de tabla (tiene indentación y empieza con "- ")
                if (linea.match(/^\s+- /)) {
                    var espaciosTabla = 0;
                    while (espaciosTabla < linea.length && linea[espaciosTabla] === ' ') espaciosTabla++;
                    resultado.push(' '.repeat(indentTablaActual + espaciosTabla) + linea.trim());
                    continue;
                } else {
                    enTablaRoam = false;
                }
            }

            // ================================================================
            // DETECCIÓN DE BLOQUE DE CÓDIGO
            // ================================================================
            var esLineaCodigo = this._isCodeBlockDelimiter(lineaStripped, BACKTICK);

            if (esLineaCodigo) {
                if (!enBloqueCodigo) {
                    // Inicio de bloque de codigo
                    enBloqueCodigo = true;
                    codigoBuffer = [lineaStripped];
                } else {
                    // Fin de bloque de codigo - unir todo en un solo item
                    codigoBuffer.push(lineaStripped);
                    var currentIndent = headingStack.length > 0
                        ? headingStack[headingStack.length - 1].indentSpaces + 4
                        : 4;
                    resultado.push(' '.repeat(currentIndent) + '[CODE]' + codigoBuffer.join('{{NL}}'));
                    codigoBuffer = [];
                    enBloqueCodigo = false;
                }
                continue;
            }

            if (enBloqueCodigo) {
                // Acumular lineas de codigo
                codigoBuffer.push(linea);
                continue;
            }

            // ================================================================
            // PROCESAMIENTO NORMAL
            // ================================================================

            // Linea vacia
            if (!lineaStripped) {
                resultado.push('');
                continue;
            }

            // Headings markdown (#, ##, ###, ####, etc.)
            var matchHeading = lineaStripped.match(/^(#{1,6})\s+(.*)$/);
            var esNegritaCompleta = lineaStripped.startsWith('**') && lineaStripped.endsWith('**') && lineaStripped.length > 4 && !lineaStripped.substring(2, lineaStripped.length - 2).includes('**');

            if (matchHeading) {
                var hLevel = matchHeading[1].length;

                // Desapilar headings de nivel igual o mayor
                while (headingStack.length > 0 && headingStack[headingStack.length - 1].hLevel >= hLevel) {
                    headingStack.pop();
                }

                var indent = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;

                headingStack.push({ hLevel: hLevel, indentSpaces: indent });
                resultado.push(' '.repeat(indent) + lineaStripped);
            }
            else if (esNegritaCompleta) {
                // Linea completamente en negrita tratada como encabezado
                // Desapilar negritas previas o encabezados de igual/mayor nivel para mantener nivel entre pares
                while (headingStack.length > 0 && headingStack[headingStack.length - 1].hLevel >= 99) {
                    headingStack.pop();
                }

                var indent = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;
                headingStack.push({ hLevel: 99, indentSpaces: indent });
                resultado.push(' '.repeat(indent) + lineaStripped);
            }
            // Listas (*, -, o numeradas)
            else if (lineaStripped.startsWith('* ') || lineaStripped.startsWith('- ') || /^\d+\.\s+/.test(lineaStripped)) {
                var espaciosOriginales = 0;
                while (espaciosOriginales < linea.length && linea[espaciosOriginales] === ' ') espaciosOriginales++;
                var nivelListaExtra = Math.floor(espaciosOriginales / 2) * 4;

                var indentBase = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;

                var itemText = lineaStripped.replace(/^[\*\-]\s+/, '');
                resultado.push(' '.repeat(indentBase + nivelListaExtra) + '* ' + itemText);
            }
            // Texto normal
            else {
                var indent = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;
                resultado.push(' '.repeat(indent) + '* ' + lineaStripped);
            }
        }

        // Si quedo codigo sin cerrar, agregarlo
        if (codigoBuffer.length > 0) {
            var currentIndent = headingStack.length > 0
                ? headingStack[headingStack.length - 1].indentSpaces + 4
                : 4;
            resultado.push(' '.repeat(currentIndent) + '[CODE]' + codigoBuffer.join('{{NL}}'));
        }

        return resultado;
    },

    /**
     * Detecta si una linea es un delimitador de bloque de codigo (3+ backticks)
     * @private
     */
    _isCodeBlockDelimiter(lineaStripped, backtick) {
        return lineaStripped.length >= 3 &&
            lineaStripped.charAt(0) === backtick &&
            lineaStripped.charAt(1) === backtick &&
            lineaStripped.charAt(2) === backtick;
    },

    /**
     * Formatea un par prompt/respuesta completo para Roam
     * @param {string} promptLimpio - Prompt ya limpiado (una linea)
     * @param {string} responseLimpio - Respuesta ya limpiada
     * @returns {Array<string>} - Lineas formateadas para el intercambio completo
     */
    formatExchange(promptLimpio, responseLimpio) {
        var resultado = [];

        if (!promptLimpio && !responseLimpio) return resultado;
        if (!promptLimpio) promptLimpio = '[sin texto]';

        // Agregar prompt como bullet principal
        resultado.push('* ' + promptLimpio);

        // Agregar lineas de respuesta formateadas
        if (responseLimpio) {
            var lineasFormateadas = this.formatResponseLines(responseLimpio);
            resultado = resultado.concat(lineasFormateadas);
        }

        // Linea vacia al final del intercambio
        resultado.push('');

        return resultado;
    }
};


// --- processing.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - PROCESSING
// Processing logic ported from Python chatbotRoam/processing.py
// ============================================================================

const ChatbotRoamProcessing = {
    // ========================================================================
    // FUNCIÓN UNIFICADA DE EXTRACCIÓN
    // ========================================================================

    /**
     * Extrae los bloques de texto RAW de prompts y respuestas, sin limpiarlos.
     */
    extraerConversacionRaw(contenido, skipTimestamp = true) {
        const marcadores = [];

        // Detectar formato especial
        const esNotebookLM = ChatbotRoamPatterns.isNotebookLM(contenido);
        // Detectar formato Claude V2 (## User: / ## Assistant:)
        const esClaudeV2 = contenido.includes('## User:') && contenido.includes('## Assistant:');
        // Detectar formato Gemini Exporter (## User: / ## Gemini:)
        const esGeminiV2 = (contenido.includes('## User:') || contenido.includes('## Prompt:')) && contenido.includes('## Gemini:');

        // Usar marcadores segun formato
        let promptPattern, responsePattern;
        if (esNotebookLM) {
            promptPattern = ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_MARKER;
            responsePattern = ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_MARKER;
        } else if (esClaudeV2) {
            promptPattern = ChatbotRoamPatterns.PROMPT_MARKER_V2;
            responsePattern = ChatbotRoamPatterns.RESPONSE_MARKER_V2;
        } else if (esGeminiV2 || contenido.includes('## Gemini:')) {
            promptPattern = contenido.includes('## User:') ? ChatbotRoamPatterns.PROMPT_MARKER_V2 : ChatbotRoamPatterns.PROMPT_MARKER;
            responsePattern = ChatbotRoamPatterns.RESPONSE_MARKER_GEMINI;
        } else {
            promptPattern = ChatbotRoamPatterns.PROMPT_MARKER;
            responsePattern = ChatbotRoamPatterns.RESPONSE_MARKER;
        }

        // Encontrar todos los prompts
        let match;
        const promptRegex = new RegExp(promptPattern.source, promptPattern.flags || 'gm');
        while ((match = promptRegex.exec(contenido)) !== null) {
            marcadores.push({ tipo: 'PROMPT', pos: match.index });
        }

        // Encontrar todas las respuestas
        const responseRegex = new RegExp(responsePattern.source, responsePattern.flags || 'gm');
        while ((match = responseRegex.exec(contenido)) !== null) {
            marcadores.push({ tipo: 'RESPONSE', pos: match.index });
        }

        // Encontrar boundaries de archivo
        const boundaryRegex = /:::FILE_BOUNDARY:(.*?):::/g;
        while ((match = boundaryRegex.exec(contenido)) !== null) {
            marcadores.push({ tipo: 'BOUNDARY', pos: match.index, filename: match[1] });
        }

        // Ordenar por posición
        marcadores.sort((a, b) => a.pos - b.pos);

        // Emparejar prompts con responses (concatenando respuestas consecutivas)
        const pares = [];

        // Recorrer marcadores y agrupar
        let i = 0;
        while (i < marcadores.length) {
            const item = marcadores[i];
            const tipo = item.tipo;
            const pos = item.pos;

            if (tipo === 'BOUNDARY') {
                pares.push({ isBoundary: true, filename: item.filename });
                i++;
                continue;
            }

            if (tipo === 'PROMPT') {
                // Helper para saltar timestamps y lineas vacias iniciales
                const calcularInicioContenido = (inicioPos) => {
                    if (!skipTimestamp) return inicioPos;
                    const restoLimitado = contenido.substring(inicioPos, inicioPos + 1000);
                    const lineasResto = restoLimitado.split('\n');
                    let lineasSaltadas = 0;
                    while (lineasSaltadas < lineasResto.length && lineasResto[lineasSaltadas].trim() === '') {
                        lineasSaltadas++;
                    }
                    const lineaCandidata = lineasSaltadas < lineasResto.length ? lineasResto[lineasSaltadas].trim() : '';
                    const lineaCandidataSinQuote = lineaCandidata.replace(/^>\s*/, '');
                    if (ChatbotRoamPatterns.TIMESTAMP_FECHA.test(lineaCandidataSinQuote) ||
                        ChatbotRoamPatterns.TIMESTAMP_BLOCKQUOTE.test(lineaCandidata)) {
                        let bytesASaltar = 0;
                        for (let k = 0; k <= lineasSaltadas; k++) {
                            bytesASaltar += lineasResto[k].length + 1;
                        }
                        return inicioPos + bytesASaltar;
                    }
                    return inicioPos;
                };

                // Extraer contenido del prompt
                const nextNewLine = contenido.indexOf('\n', pos);
                const lineLength = nextNewLine === -1 ? contenido.length - pos : nextNewLine - pos;
                const siguienteLineaPos = pos + lineLength + 1;
                const inicioContenido = calcularInicioContenido(siguienteLineaPos);

                const finPrompt = i + 1 < marcadores.length ? marcadores[i + 1].pos : contenido.length;
                const promptBloque = contenido.substring(inicioContenido, finPrompt).trim();

                // Buscar y concatenar todas las respuestas consecutivas
                const responseParts = [];
                let j = i + 1;

                while (j < marcadores.length && marcadores[j].tipo === 'RESPONSE') {
                    const respPos = marcadores[j].pos;
                    const respNextNewLine = contenido.indexOf('\n', respPos);
                    const respLineLength = respNextNewLine === -1 ? contenido.length - respPos : respNextNewLine - respPos;
                    const respSiguienteLineaPos = respPos + respLineLength + 1;
                    const inicioRespContenido = calcularInicioContenido(respSiguienteLineaPos);
                    const finResp = j + 1 < marcadores.length ? marcadores[j + 1].pos : contenido.length;
                    const respBloque = contenido.substring(inicioRespContenido, finResp).trim();

                    if (respBloque) {
                        responseParts.push(respBloque);
                    }
                    j++;
                }

                // Solo crear par si hay al menos una respuesta
                if (responseParts.length > 0) {
                    pares.push({
                        prompt: promptBloque,
                        response: responseParts.join('\n\n')
                    });
                }

                // Saltar al siguiente prompt (o al final)
                i = j;
            } else {
                // Si encontramos una respuesta sin prompt previo, saltarla
                i++;
            }
        }

        return pares;
    },

    // ========================================================================
    // LÓGICA DE PROCESAMIENTO PRINCIPAL
    // ========================================================================

    /**
     * Procesa el archivo aplicando las opciones de limpieza seleccionadas individualmente.
     * Async para evitar congelar el UI en archivos grandes.
     * @param {string} contenido - El contenido del archivo .md
     * @param {Object} opciones - Objeto con las opciones de limpieza
     * @returns {Promise<Object>} - { resultado: string, numIntercambios: number }
     */
    async procesarConOpcionesIndividuales(contenido, opciones) {
        // Eliminar imágenes ANTES de extraer (si está marcado)
        if (opciones.eliminar_imagenes) {
            contenido = ChatbotRoamCleaners.eliminarImagenesEmbedidas(contenido);
        }

        // Detectar si es NotebookLM (para aplicar limpieza específica en el loop)
        const esNotebookLM = ChatbotRoamPatterns.isNotebookLM(contenido);

        // Extraer conversación
        const conversacionRaw = this.extraerConversacionRaw(contenido);

        if (conversacionRaw.length === 0) {
            return { resultado: null, numIntercambios: 0 };
        }

        // Procesar cada par de prompt/respuesta
        const resultado = [];
        let lastYield = performance.now();

        for (let i = 0; i < conversacionRaw.length; i++) {
            // Yield al main thread cada ~16ms para mantener UI fluida a 60fps
            if (performance.now() - lastYield > 16) {
                await new Promise(resolve => setTimeout(resolve, 0));
                lastYield = performance.now();
            }

            const item = conversacionRaw[i];
            if (item.isBoundary) {
                resultado.push('* 📁 ' + item.filename);
                continue;
            }

            const rawPrompt = item.prompt;
            const rawResponse = item.response;

            // --- LIMPIAR PROMPT ---
            let promptLimpio = this._limpiarPrompt(rawPrompt, opciones);

            // --- LIMPIAR RESPUESTA ---
            let responseLimpio = this._limpiarRespuesta(rawResponse, opciones, esNotebookLM);

            // --- FORMATEAR PARA ROAM (usa modulo Formatter) ---
            const lineasFormateadas = ChatbotRoamFormatter.formatExchange(promptLimpio, responseLimpio);
            for (let k = 0; k < lineasFormateadas.length; k++) {
                resultado.push(lineasFormateadas[k]);
            }
        }

        return {
            resultado: resultado.join('\n'),
            numIntercambios: conversacionRaw.length
        };
    },

    /**
     * Limpia un prompt aplicando las opciones seleccionadas
     * @private
     */
    _limpiarPrompt(rawPrompt, opciones) {
        let promptTemp = rawPrompt;

        // Aplicar cleaners del registro centralizado
        promptTemp = ChatbotRoamOpciones.aplicarLimpieza(promptTemp, opciones, 'prompt');

        // Neutralizar sintaxis especial de Roam de manera obligatoria en todas las intervenciones del usuario
        promptTemp = ChatbotRoamCleaners.neutralizarSintaxisRoam(promptTemp);

        promptTemp = ChatbotRoamCleaners.limpiarFormatoMarkdownBasico(promptTemp);
        return promptTemp.split('\n').join(' ').trim();
    },

    /**
     * Limpia una respuesta aplicando las opciones seleccionadas
     * @private
     */
    _limpiarRespuesta(rawResponse, opciones, esNotebookLM = false) {
        let responseTemp = rawResponse;

        // Aplicar cleaners del registro centralizado
        responseTemp = ChatbotRoamOpciones.aplicarLimpieza(responseTemp, opciones, 'respuesta');

        // Limpiar formato básico
        responseTemp = ChatbotRoamCleaners.limpiarFormatoMarkdownBasico(responseTemp);

        // Limpieza específica para NotebookLM (escapes)
        if (esNotebookLM) {
            responseTemp = ChatbotRoamCleaners.limpiarEscapesNotebookLM(responseTemp);
        }

        return ChatbotRoamCleaners.limpiarContenido(responseTemp);
    },

    /**
     * Detecta automáticamente el tipo de chatbot basándose en marcadores característicos.
     */
    detectarTipoChatbot(contenido) {
        // Detectar NotebookLM PRIMERO
        if (ChatbotRoamPatterns.isNotebookLM(contenido)) {
            return 'notebooklm';
        }

        // Detectar Claude V2 (formato actualizado del exportador: ## User: / ## Assistant:)
        const esClaudeV2 = contenido.includes('## User:') && contenido.includes('## Assistant:');
        if (esClaudeV2) {
            return 'claude';
        }

        const tieneThinkingGemini = ChatbotRoamPatterns.DETECT_GEMINI_THINKING.test(contenido);
        const tieneGeminiFooter = contenido.includes('Gemini Exporter');
        const esGeminiV2 = contenido.includes('## Gemini:');

        if (tieneThinkingGemini || tieneGeminiFooter || esGeminiV2) {
            return 'gemini';
        }

        return 'generico';
    },

    /**
     * Devuelve las opciones preconfiguradas según el tipo de chatbot.
     * Delega al registro centralizado en ChatbotRoamOpciones.
     */
    getPresetOpciones(tipo) {
        return ChatbotRoamOpciones.getPreset(tipo);
    }
};


// --- styles.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - STYLES
// CSS styles for the modal interface
// ============================================================================

const ChatbotRoamStyles = {
    getStyles() {
        return [
            '            .chatbot-roam-overlay {',
            '                position: fixed;',
            '                top: 0;',
            '                left: 0;',
            '                width: 100%;',
            '                height: 100%;',
            '                background: rgba(0, 0, 0, 0.6);',
            '                z-index: 10000;',
            '                display: flex;',
            '                align-items: center;',
            '                justify-content: center;',
            '            }',
            '',
            '            .chatbot-roam-modal {',
            '                background: #002b36;',
            '                border-radius: 8px;',
            '                width: 900px;',
            '                max-width: 90vw;',
            '                max-height: 90vh;',
            '                overflow: hidden;',
            '                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(88, 110, 117, 0.3);',
            '                display: flex;',
            '                flex-direction: column;',
            '            }',
            '',
            '            .chatbot-roam-header {',
            '                display: flex;',
            '                justify-content: space-between;',
            '                align-items: center;',
            '                padding: 14px 20px;',
            '                background: #073642;',
            '                border-bottom: 1px solid #586e75;',
            '            }',
            '',
            '            .chatbot-roam-title {',
            '                color: #b58900;',
            '                font-size: 16px;',
            '                font-weight: 600;',
            '                margin: 0;',
            '                letter-spacing: 0.3px;',
            '            }',
            '',
            '            .chatbot-roam-close {',
            '                background: transparent;',
            '                border: none;',
            '                color: #657b83;',
            '                font-size: 22px;',
            '                cursor: pointer;',
            '                padding: 0;',
            '                line-height: 1;',
            '                transition: color 0.15s;',
            '            }',
            '',
            '            .chatbot-roam-close:hover {',
            '                color: #cb4b16;',
            '            }',
            '',
            '            .chatbot-roam-body {',
            '                padding: 20px;',
            '                overflow-y: auto;',
            '                flex: 1;',
            '            }',
            '',
            '            .chatbot-roam-dropzone {',
            '                border: 2px dashed #586e75;',
            '                border-radius: 6px;',
            '                padding: 40px 20px;',
            '                text-align: center;',
            '                cursor: pointer;',
            '                transition: border-color 0.2s ease, background-color 0.2s ease;',
            '                background: #073642;',
            '            }',
            '',
            '            .chatbot-roam-dropzone:hover,',
            '            .chatbot-roam-dropzone.dragover {',
            '                border-color: #2aa198;',
            '                background: rgba(42, 161, 152, 0.08);',
            '            }',
            '',
            '            .chatbot-roam-dropzone-icon {',
            '                font-size: 42px;',
            '                margin-bottom: 12px;',
            '                color: #657b83;',
            '            }',
            '',
            '            .chatbot-roam-dropzone-text {',
            '                color: #93a1a1;',
            '                font-size: 14px;',
            '            }',
            '',
            '            .chatbot-roam-dropzone-text strong {',
            '                color: #2aa198;',
            '            }',
            '',
            '            .chatbot-roam-file-loaded {',
            '                background: rgba(42, 161, 152, 0.1);',
            '                border-color: #2aa198;',
            '            }',
            '',
            '            .chatbot-roam-file-loaded .chatbot-roam-dropzone-icon {',
            '                color: #2aa198;',
            '            }',
            '',
            '            .chatbot-roam-file-error {',
            '                background: rgba(203, 75, 22, 0.1);',
            '                border-color: #cb4b16;',
            '            }',
            '',
            '            .chatbot-roam-file-error .chatbot-roam-dropzone-icon {',
            '                color: #cb4b16;',
            '                font-size: 36px;',
            '                font-weight: bold;',
            '            }',
            '',
            '            .chatbot-roam-section-title {',
            '                color: #b58900;',
            '                font-size: 13px;',
            '                font-weight: 600;',
            '                margin: 20px 0 12px 0;',
            '                text-transform: uppercase;',
            '                letter-spacing: 0.5px;',
            '            }',
            '',
            '            .chatbot-roam-options {',
            '                display: grid;',
            '                grid-template-columns: 1fr 1fr;',
            '                gap: 8px 20px;',
            '            }',
            '',
            '            .chatbot-roam-option {',
            '                display: flex;',
            '                align-items: center;',
            '                gap: 8px;',
            '                color: #93a1a1;',
            '                font-size: 13px;',
            '            }',
            '',
            '            .chatbot-roam-option input[type="checkbox"] {',
            '                accent-color: #2aa198;',
            '            }',
            '',
            '            .chatbot-roam-presets {',
            '                display: flex;',
            '                gap: 8px;',
            '                margin-top: 12px;',
            '                flex-wrap: wrap;',
            '            }',
            '',
            '            .chatbot-roam-preset-btn {',
            '                background: transparent;',
            '                border: 1px solid #586e75;',
            '                color: #93a1a1;',
            '                padding: 6px 14px;',
            '                border-radius: 4px;',
            '                font-size: 12px;',
            '                cursor: pointer;',
            '                transition: background-color 0.15s, color 0.15s, border-color 0.15s;',
            '            }',
            '',
            '            .chatbot-roam-preset-btn:hover {',
            '                background: #b58900;',
            '                color: #002b36;',
            '                border-color: #b58900;',
            '            }',
            '',
            '            .chatbot-roam-preview {',
            '                background: #073642;',
            '                border: 1px solid #586e75;',
            '                border-radius: 6px;',
            '                padding: 12px;',
            '                max-height: 250px;',
            '                overflow-y: auto;',
            '                contain: content;',
            '                font-family: \'SF Mono\', \'Consolas\', \'Monaco\', monospace;',
            '                font-size: 12px;',
            '                color: #839496;',
            '                white-space: pre-wrap;',
            '                line-height: 1.5;',
            '            }',
            '',
            '            .chatbot-roam-preview-info {',
            '                color: #657b83;',
            '                font-size: 11px;',
            '                margin-top: 8px;',
            '                font-style: italic;',
            '            }',
            '',
            '            .chatbot-roam-footer {',
            '                display: flex;',
            '                justify-content: space-between;',
            '                align-items: center;',
            '                padding: 14px 20px;',
            '                background: #073642;',
            '                border-top: 1px solid #586e75;',
            '            }',
            '',
            '            .chatbot-roam-info {',
            '                color: #657b83;',
            '                font-size: 12px;',
            '            }',
            '',
            '            .chatbot-roam-info strong {',
            '                color: #b58900;',
            '            }',
            '',
            '            .chatbot-roam-buttons {',
            '                display: flex;',
            '                gap: 10px;',
            '            }',
            '',
            '            .chatbot-roam-btn {',
            '                padding: 10px 20px;',
            '                border-radius: 4px;',
            '                font-size: 13px;',
            '                cursor: pointer;',
            '                transition: background-color 0.15s, color 0.15s;',
            '            }',
            '',
            '            .chatbot-roam-btn-cancel {',
            '                background: transparent;',
            '                border: 1px solid #586e75;',
            '                color: #93a1a1;',
            '            }',
            '',
            '            .chatbot-roam-btn-cancel:hover {',
            '                border-color: #839496;',
            '                color: #eee8d5;',
            '            }',
            '',
            '            .chatbot-roam-btn-insert {',
            '                background: #b58900;',
            '                border: none;',
            '                color: #002b36;',
            '                font-weight: 600;',
            '            }',
            '',
            '            .chatbot-roam-btn-insert:hover {',
            '                background: #d4a000;',
            '            }',
            '',
            '            .chatbot-roam-btn-insert:disabled {',
            '                background: #586e75;',
            '                color: #839496;',
            '                cursor: not-allowed;',
            '            }',
            '',
            '            .chatbot-roam-hidden-input {',
            '                display: none;',
            '            }',
            '',
            '            /* Busqueda incremental */',
            '            .chatbot-roam-search-section {',
            '                background: #073642;',
            '                border: 1px solid #586e75;',
            '                border-radius: 6px;',
            '                padding: 12px;',
            '                margin-bottom: 16px;',
            '            }',
            '',
            '            .chatbot-roam-search-row {',
            '                display: flex;',
            '                gap: 8px;',
            '                align-items: center;',
            '            }',
            '',
            '            .chatbot-roam-search-input {',
            '                flex: 1;',
            '                background: #002b36;',
            '                border: 1px solid #586e75;',
            '                border-radius: 4px;',
            '                padding: 8px 12px;',
            '                color: #93a1a1;',
            '                font-size: 13px;',
            '            }',
            '',
            '            .chatbot-roam-search-input:focus {',
            '                outline: none;',
            '                border-color: #2aa198;',
            '            }',
            '',
            '            .chatbot-roam-search-input::placeholder {',
            '                color: #586e75;',
            '            }',
            '',
            '            .chatbot-roam-search-nav {',
            '                display: flex;',
            '                align-items: center;',
            '                gap: 4px;',
            '            }',
            '',
            '            .chatbot-roam-search-btn {',
            '                background: transparent;',
            '                border: 1px solid #586e75;',
            '                color: #93a1a1;',
            '                width: 28px;',
            '                height: 28px;',
            '                border-radius: 4px;',
            '                cursor: pointer;',
            '                font-size: 14px;',
            '                display: flex;',
            '                align-items: center;',
            '                justify-content: center;',
            '                transition: background-color 0.15s, color 0.15s;',
            '            }',
            '',
            '            .chatbot-roam-search-btn:hover:not(:disabled) {',
            '                background: #2aa198;',
            '                color: #002b36;',
            '                border-color: #2aa198;',
            '            }',
            '',
            '            .chatbot-roam-search-btn:disabled {',
            '                opacity: 0.4;',
            '                cursor: not-allowed;',
            '            }',
            '',
            '            .chatbot-roam-search-count {',
            '                color: #657b83;',
            '                font-size: 12px;',
            '                min-width: 40px;',
            '                text-align: center;',
            '            }',
            '',
            '            .chatbot-roam-cut-btn {',
            '                background: #b58900;',
            '                border: none;',
            '                color: #002b36;',
            '                padding: 6px 12px;',
            '                border-radius: 4px;',
            '                cursor: pointer;',
            '                font-size: 12px;',
            '                font-weight: 600;',
            '            }',
            '',
            '            .chatbot-roam-cut-btn:hover {',
            '                background: #d4a000;',
            '            }',
            '',
            '            .chatbot-roam-cut-btn:disabled {',
            '                background: #586e75;',
            '                color: #839496;',
            '                cursor: not-allowed;',
            '            }',
            '',
            '            .chatbot-roam-cut-indicator {',
            '                color: #2aa198;',
            '                font-size: 12px;',
            '                margin-left: 8px;',
            '            }',
            '',
            '            /* Preview con highlights */',
            '            .chatbot-roam-preview mark {',
            '                background: rgba(181, 137, 0, 0.35);',
            '                color: inherit;',
            '                padding: 1px 2px;',
            '                border-radius: 2px;',
            '            }',
            '',
            '            .chatbot-roam-preview mark.current {',
            '                background: #b58900;',
            '                color: #002b36;',
            '            }',
            '',
            '            /* Editor de clasificación manual v2 */',
            '            .chatbot-roam-editor-swap-btn,',
        ].join('\n');
    }
};


// --- roam/parser.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM PARSER
// Converts lines into hierarchical block structure for Roam
// ============================================================================

const ChatbotRoamParser = {
    /**
     * Convierte lineas en estructura jerarquica de bloques
     * Maneja bloques de codigo marcados con [CODE]
     * Maneja tablas Roam con anidacion profunda
     * Soporta multiples niveles: prompt -> respuesta/headings (h1..h6) -> listas/contenido anidado
     */
    parseToBlockStructure(lineas) {
        var result = [];
        var currentPrompt = null;
        var responseBuffer = [];

        var flushPrompt = function () {
            if (currentPrompt) {
                if (responseBuffer.length > 0) {
                    currentPrompt.children = ChatbotRoamParser._parseIndentedBlocks(responseBuffer, 4);
                    responseBuffer = [];
                }
                result.push(currentPrompt);
            }
        };

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (!linea || !linea.trim()) continue;

            // Detectar prompts (nivel 0, empiezan con "* ")
            if (linea.startsWith('* ')) {
                flushPrompt();
                currentPrompt = {
                    text: linea.substring(2).trim(),
                    children: []
                };
                continue;
            }

            // Si es linea de respuesta (indentada), acumular en buffer
            if (currentPrompt) {
                responseBuffer.push(linea);
            }
        }

        flushPrompt();
        return result;
    },

    /**
     * Convierte líneas indentadas en estructura anidada de bloques
     * Usado para parsear tablas Roam, headings con sub-headings y listas anidadas
     * 
     * @param {string[]} lineas - Líneas con formato indentado ("    texto", "        texto", etc.)
     * @param {number} baseIndent - Nivel base de indentación (espacios)
     * @returns {Object[]} - Estructura de bloques anidados
     */
    _parseIndentedBlocks(lineas, baseIndent) {
        if (!lineas || lineas.length === 0) return [];

        var result = [];
        var stack = [{ indent: baseIndent - 4, children: result }];  // Nivel virtual padre

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (!linea || !linea.trim()) continue;

            // Contar espacios de indentación
            var indent = 0;
            while (indent < linea.length && linea[indent] === ' ') indent++;

            var rawText = linea.substring(indent);
            var texto = '';

            // Detectar bloque de codigo combinado
            if (rawText.startsWith('[CODE]')) {
                texto = rawText.substring(6).replace(/\{\{NL\}\}/g, '\n');
            } else {
                // Quitar viñetas "* " o "- " al inicio
                texto = rawText;
                if (texto.startsWith('* ') || texto.startsWith('- ')) {
                    texto = texto.substring(2);
                }
                texto = texto.trim();
            }

            if (!texto) continue;

            var nuevoBloque = { text: texto, children: [] };

            // Encontrar el padre correcto basándose en la indentación
            while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }

            // Agregar como hijo del padre actual
            stack[stack.length - 1].children.push(nuevoBloque);

            // Agregar a la pila para posibles hijos
            stack.push({ indent: indent, children: nuevoBloque.children });
        }

        return result;
    }
};


// --- roam/inserter.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM INSERTER
// Handles block insertion into Roam using the Roam Alpha API
// Includes rollback capability for error recovery
// ============================================================================

const ChatbotRoamInserter = {
    // Configuración de batching con respeto al rate limit de Roam
    // Rate limit de Roam: 1500 mutaciones por 60000ms
    // Con BATCH_SIZE=50 y target de ~1200/min (80% del límite para margen de seguridad):
    // delay = 60000 / (1200/50) = 2500ms entre lotes
    BATCH_SIZE: 50,
    ROAM_RATE_LIMIT: 1500,        // mutaciones máximas por ventana
    ROAM_RATE_WINDOW_MS: 60000,   // ventana del rate limit (60s)
    RATE_LIMIT_SAFETY: 0.80,      // usar 80% del límite para dejar margen
    BASE_DELAY_MS: 250,           // delay base ágil para lotes ordinarios

    // Flag para detectar disponibilidad del batch API (se evalúa una sola vez)
    _batchApiChecked: false,
    _hasBatchApi: false,
    _batchApiType: 'none', // 'actions', 'function', o 'none'

    /**
     * Calcula el delay necesario entre lotes para respetar el rate limit
     * @param {number} batchSize - Tamaño del lote enviado
     * @param {number} totalActions - Total de acciones a procesar
     * @returns {number} - Milisegundos de espera
     * @private
     */
    _calculateDelay(batchSize, totalActions = 0) {
        // Para importaciones estándar (<1000 bloques), usar delay base de 250ms para inserción rápida
        if (totalActions <= 1000) {
            return this.BASE_DELAY_MS;
        }
        // Para importaciones muy masivas (>1000 bloques), espaciar para respetar el rate limit
        const effectiveLimit = this.ROAM_RATE_LIMIT * this.RATE_LIMIT_SAFETY;
        const batchesPerWindow = effectiveLimit / batchSize;
        return Math.max(this.BASE_DELAY_MS, Math.ceil(this.ROAM_RATE_WINDOW_MS / batchesPerWindow));
    },

    /**
     * Detecta si la batch API está disponible (una sola vez, cachea resultado)
     * @returns {boolean}
     * @private
     */
    _checkBatchApi() {
        if (!this._batchApiChecked) {
            try {
                const api = window.roamAlphaAPI;
                const hasApi = !!api;
                const hasData = !!(api && api.data);
                const hasBatch = !!(api && api.data && api.data.batch);
                const hasActions = !!(hasBatch && typeof api.data.batch.actions === 'function');
                const isBatchFunction = !!(hasBatch && typeof api.data.batch === 'function');

                console.log('ChatbotRoamInserter API Check:', {
                    hasApi,
                    hasData,
                    hasBatch,
                    hasActions,
                    isBatchFunction
                });

                if (hasActions) {
                    this._hasBatchApi = true;
                    this._batchApiType = 'actions';
                } else if (isBatchFunction) {
                    this._hasBatchApi = true;
                    this._batchApiType = 'function';
                } else {
                    this._hasBatchApi = false;
                    this._batchApiType = 'none';
                }
            } catch (e) {
                console.error('Error checking Roam Batch API:', e);
                this._hasBatchApi = false;
                this._batchApiType = 'none';
            }
            this._batchApiChecked = true;
            if (!this._hasBatchApi) {
                console.warn('ChatbotRoamInserter: batch API no disponible, usando fallback individual (más lento).');
            } else {
                console.log('ChatbotRoamInserter: batch API disponible usando método "' + this._batchApiType + '".');
            }
        }
        return this._hasBatchApi;
    },

    /**
     * Ejecuta un lote de acciones, con fallback a ejecución individual
     * @param {Array} actions - Array de acciones batch
     * @param {Array} [createdUids] - Array donde registrar UIDs creados (mutado in-place)
     * @returns {Promise<void>}
     * @private
     */
    async _executeBatch(actions, createdUids) {
        if (this._checkBatchApi()) {
            try {
                if (this._batchApiType === 'actions') {
                    await window.roamAlphaAPI.data.batch.actions({
                        action: "batch-actions",
                        actions: actions
                    });
                } else if (this._batchApiType === 'function') {
                    await window.roamAlphaAPI.data.batch(actions);
                }
                // Batch exitoso — registrar todos los UIDs de creates
                if (createdUids) {
                    for (const action of actions) {
                        if (action.action === 'create-block') {
                            createdUids.push(action.block.uid);
                        }
                    }
                }
                return; // Batch exitoso, salir
            } catch (batchError) {
                // Si es rate limit, NO invalidar la API — solo propagar el error
                const errMsg = String(batchError?.message || batchError || '').toLowerCase();
                if (errMsg.includes('rate limit') || errMsg.includes('ratelimit')) {
                    throw batchError;
                }
                // Batch API falló por otra razón — invalidar cache y usar fallback
                console.warn('ChatbotRoamInserter: batch.actions falló en runtime, cambiando a fallback individual.', batchError);
                this._hasBatchApi = false;
                this._batchApiChecked = true;
                this._batchApiType = 'none';
            }
        }
        // Fallback: ejecutar cada acción individualmente
        for (const action of actions) {
            if (action.action === 'create-block') {
                await window.roamAlphaAPI.createBlock({
                    location: action.location,
                    block: action.block
                });
                // Registrar UID inmediatamente después de creación exitosa
                if (createdUids) createdUids.push(action.block.uid);
            } else if (action.action === 'delete-block') {
                await window.roamAlphaAPI.deleteBlock({
                    block: action.block
                });
            }
        }
    },

    /**
     * Elimina bloques por sus UIDs (para rollback en caso de error)
     * Utiliza batch.actions para velocidad, respetando rate limit
     * @param {Array<string>} uids - Array de UIDs a eliminar
     * @returns {Promise<number>} - Numero de bloques eliminados exitosamente
     * @private
     */
    async _rollbackBlocks(uids) {
        let deleted = 0;
        console.warn('Rollback: Iniciando eliminacion de ' + uids.length + ' bloques...');

        const rollbackBatchSize = this.BATCH_SIZE;
        const rollbackDelay = this._calculateDelay(rollbackBatchSize);

        // Eliminar en orden inverso (de abajo hacia arriba)
        for (let i = uids.length; i > 0; i -= rollbackBatchSize) {
            const start = Math.max(0, i - rollbackBatchSize);
            const batchUids = uids.slice(start, i).reverse();

            const actions = batchUids.map(uid => ({
                action: "delete-block",
                block: { uid: uid }
            }));

            try {
                await this._executeBatch(actions);
                deleted += actions.length;
            } catch (e) {
                // Si es rate limit durante rollback, esperar más y reintentar
                const errMsg = String(e?.message || e || '').toLowerCase();
                if (errMsg.includes('rate limit') || errMsg.includes('ratelimit')) {
                    console.warn('Rollback: rate limit alcanzado, esperando 10s antes de reintentar...');
                    await this._delay(10000);
                    try {
                        await this._executeBatch(actions);
                        deleted += actions.length;
                    } catch (retryError) {
                        console.warn('Rollback: reintento fallido, saltando lote', retryError);
                    }
                } else {
                    console.warn('Rollback: No se pudo eliminar el lote de bloques', e);
                }
            }
            // Respetar rate limit entre lotes de rollback
            if (start > 0) {
                await this._delay(rollbackDelay);
            }
        }
        return deleted;
    },

    /**
     * Utilidad para esperar (promisified timeout)
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Aplana un árbol de bloques en un array de acciones de creación
     * @private
     */
    _flattenBlocks(parentUid, bloques, startOrder, actions) {
        if (!actions) actions = [];
        for (let i = 0; i < bloques.length; i++) {
            const bloque = bloques[i];
            const blockUid = window.roamAlphaAPI.util.generateUID();

            let texto = bloque.text;
            let headingLevel = 0;

            if (texto.startsWith('###### ')) {
                headingLevel = 3;
                texto = texto.substring(7).trim();
            } else if (texto.startsWith('##### ')) {
                headingLevel = 3;
                texto = texto.substring(6).trim();
            } else if (texto.startsWith('#### ')) {
                headingLevel = 3;
                texto = texto.substring(5).trim();
            } else if (texto.startsWith('### ')) {
                headingLevel = 3;
                texto = texto.substring(4).trim();
            } else if (texto.startsWith('## ')) {
                headingLevel = 2;
                texto = texto.substring(3).trim();
            } else if (texto.startsWith('# ')) {
                headingLevel = 1;
                texto = texto.substring(2).trim();
            }

            const action = {
                action: "create-block",
                location: { "parent-uid": parentUid, order: startOrder + i },
                block: { uid: blockUid, string: texto }
            };

            if (headingLevel > 0) {
                action.block.heading = headingLevel;
            }

            actions.push(action);

            if (bloque.children && bloque.children.length > 0) {
                this._flattenBlocks(blockUid, bloque.children, 0, actions);
            }
        }
        return actions;
    },

    /**
     * Inserta bloques recursivamente en Roam con soporte de rollback, batching y cancelacion
     * Respeta el rate limit de Roam (1500 mutaciones / 60s)
     * Si ocurre un error o se cancela, automaticamente elimina los bloques ya insertados
     * 
     * @param {string} parentUid - UID del bloque padre
     * @param {Array} bloques - Array de bloques en formato de árbol
     * @param {number} startOrder - Orden inicial para los bloques de nivel superior
     * @param {Object} cancelToken - Objeto { cancelled: boolean } compartido con UI
     * @param {Function} onProgress - Callback opcional (insertedCount, total) => void
     * @returns {Promise<Object>} - { success, insertedBlocks, insertedCount, error, rolledBackCount }
     */
    async insertBlocksRecursively(parentUid, bloques, startOrder, cancelToken, onProgress) {
        const actions = this._flattenBlocks(parentUid, bloques, startOrder);
        const totalOpsEstimate = actions.length;
        const allInsertedUids = [];

        // Calcular delay basado en rate limit
        const batchDelay = this._calculateDelay(this.BATCH_SIZE, actions.length);
        const totalBatches = Math.ceil(actions.length / this.BATCH_SIZE);
        const estimatedSeconds = Math.ceil((totalBatches * batchDelay) / 1000);
        console.log('ChatbotRoamInserter: ' + actions.length + ' bloques en ' + totalBatches + ' lotes de ' + this.BATCH_SIZE + ', delay ' + batchDelay + 'ms (~' + estimatedSeconds + 's estimados)');

        try {
            for (let i = 0; i < actions.length; i += this.BATCH_SIZE) {
                if (cancelToken && cancelToken.cancelled) {
                    throw new Error('OPERACION_CANCELADA_POR_USUARIO');
                }

                const batchActions = actions.slice(i, i + this.BATCH_SIZE);

                await this._executeBatch(batchActions, allInsertedUids);

                if (onProgress) {
                    onProgress(allInsertedUids.length, totalOpsEstimate);
                }

                // Respetar rate limit entre lotes
                if (i + this.BATCH_SIZE < actions.length) {
                    await this._delay(batchDelay);
                }
            }

            return {
                success: true,
                insertedBlocks: allInsertedUids,
                insertedCount: allInsertedUids.length,
                error: null,
                rolledBackCount: 0
            };
        } catch (error) {
            console.error('Error durante insercion, iniciando rollback de ' + allInsertedUids.length + ' bloques...');
            if (error.message === 'OPERACION_CANCELADA_POR_USUARIO') {
                console.info('Causa: Cancelacion por usuario');
            }

            const rolledBack = await this._rollbackBlocks(allInsertedUids);
            console.log('Rollback completado: ' + rolledBack + '/' + allInsertedUids.length + ' bloques eliminados');

            return {
                success: false,
                insertedBlocks: [],
                insertedCount: allInsertedUids.length,
                error: error.message,
                rolledBackCount: rolledBack
            };
        }
    }
};


// --- ui.js ---
// CHATBOT ROAM PLUGIN - UI
// Modal interface with drag and drop and preview

const ChatbotRoamUI = {
    // Estado del modal
    _modalContainer: null,
    _fileContent: null,
    _processedContent: null,
    _originalProcessedContent: null,  // Para restaurar después de cortar
    _currentOpciones: null,
    _savedBlockUid: null,  // Guardar UID del bloque ANTES de abrir modal

    // Estado de búsqueda incremental
    _searchMatches: [],      // Posiciones de coincidencias
    _currentMatchIndex: -1,  // Índice actual
    _isCut: false,           // Si ya se cortó
    _boundEscHandler: null,  // Referencia al handler de ESC para cleanup
    _activeCancelToken: null, // Token para cancelar insercion en curso


    // CREAR MODAL
    openModal() {
        if (this._modalContainer) {
            this.closeModal();
        }

        // IMPORTANTE: Capturar el bloque seleccionado ANTES de crear el modal
        const focusedBlock = window.roamAlphaAPI.ui.getFocusedBlock();
        this._savedBlockUid = focusedBlock ? focusedBlock['block-uid'] : null;

        // Inyectar estilos (usa modulo ChatbotRoamStyles)
        const styleId = 'chatbot-roam-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = ChatbotRoamStyles.getStyles();
            document.head.appendChild(style);
        }

        // Inicializar opciones por defecto
        this._currentOpciones = ChatbotRoamProcessing.getPresetOpciones('claude');
        this._fileContent = null;
        this._processedContent = null;
        this._originalProcessedContent = null;
        this._searchMatches = [];
        this._currentMatchIndex = -1;
        this._isCut = false;
        this._activeCancelToken = null;

        // Crear modal
        this._modalContainer = document.createElement('div');
        this._modalContainer.className = 'chatbot-roam-overlay';
        this._modalContainer.innerHTML = this._getModalHTML();

        document.body.appendChild(this._modalContainer);
        this._attachEventListeners();
    },

    _getModalHTML() {
        return '<div class="chatbot-roam-modal">' +
            '<div class="chatbot-roam-header">' +
            '<h2 class="chatbot-roam-title">Importar Conversacion de Chatbot</h2>' +
            '<button class="chatbot-roam-close" data-action="close">&times;</button>' +
            '</div>' +
            '<div class="chatbot-roam-body">' +
            '<div class="chatbot-roam-dropzone" data-action="dropzone">' +
            '<div class="chatbot-roam-dropzone-icon">+</div>' +
            '<div class="chatbot-roam-dropzone-text">' +
            '<strong>Arrastra uno o mas archivos .md aqui</strong><br>' +
            'o haz clic para seleccionar' +
            '</div>' +
            '</div>' +
            '<input type="file" class="chatbot-roam-hidden-input" accept=".md,.txt" multiple data-action="file-input">' +
            '<div class="chatbot-roam-section-title">OPCIONES DE LIMPIEZA</div>' +
            '<div class="chatbot-roam-options">' +
            ChatbotRoamOpciones.generarCheckboxesHTML() +
            '</div>' +
            '<div class="chatbot-roam-presets">' +
            '<button class="chatbot-roam-preset-btn" data-preset="claude">Claude</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="gemini">Gemini</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="notebooklm">NotebookLM</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="limpiar">Limpiar todo</button>' +
            '</div>' +
            '<div class="chatbot-roam-section-title">IMPORTACION INCREMENTAL</div>' +
            '<div class="chatbot-roam-search-section">' +
            '<div class="chatbot-roam-search-row">' +
            '<input type="text" class="chatbot-roam-search-input" data-element="search-input" placeholder="Buscar texto del ultimo prompt importado...">' +
            '<div class="chatbot-roam-search-nav">' +
            '<button class="chatbot-roam-search-btn" data-action="prev-match" disabled title="Anterior">&lt;</button>' +
            '<span class="chatbot-roam-search-count" data-element="match-count">0/0</span>' +
            '<button class="chatbot-roam-search-btn" data-action="next-match" disabled title="Siguiente">&gt;</button>' +
            '</div>' +
            '<button class="chatbot-roam-cut-btn" data-action="cut-here" disabled>Cortar aqui</button>' +
            '<span class="chatbot-roam-cut-indicator" data-element="cut-indicator"></span>' +
            '</div>' +
            '</div>' +
            '<div class="chatbot-roam-section-title">VISTA PREVIA</div>' +
            '<div class="chatbot-roam-preview" data-element="preview">' +
            '<span style="color: #666;">Arrastra archivos para ver la vista previa...</span>' +
            '</div>' +
            '<div class="chatbot-roam-preview-info" data-element="preview-info"></div>' +
            '</div>' +
            '<div class="chatbot-roam-footer">' +
            '<div class="chatbot-roam-info">' +
            'Se insertara como hijo del <strong>bloque seleccionado</strong>' +
            '</div>' +
            '<div class="chatbot-roam-buttons">' +
            '<button class="chatbot-roam-btn chatbot-roam-btn-cancel" data-action="close">Cancelar</button>' +
            '<button class="chatbot-roam-btn chatbot-roam-btn-insert" data-action="insert" disabled>Insertar en Roam</button>' +
            '</div>' +
            '</div>' +
            '</div>';
    },

    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================
    _attachEventListeners() {
        const modal = this._modalContainer;

        // Close button and overlay click
        modal.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'close' || e.target.classList.contains('chatbot-roam-overlay')) {
                this.closeModal();
            }
        });

        // Dropzone click
        const dropzone = modal.querySelector('[data-action="dropzone"]');
        const fileInput = modal.querySelector('[data-action="file-input"]');

        dropzone.addEventListener('click', () => fileInput.click());

        // Drag & drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files && files.length > 0) this._handleFiles(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) this._handleFiles(files);
        });

        // Preset buttons
        modal.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => this._applyPreset(btn.dataset.preset));
        });

        // Checkbox changes
        modal.querySelectorAll('[data-option]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this._updateOpciones());
        });

        // Insert button
        modal.querySelector('[data-action="insert"]').addEventListener('click', () => this._insertInRoam());

        // Search functionality
        const searchInput = modal.querySelector('[data-element="search-input"]');
        let searchTimer = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => this._performSearch(e.target.value), 250);
        });

        // Navigation buttons
        modal.querySelector('[data-action="prev-match"]').addEventListener('click', () => this._navigateMatch(-1));
        modal.querySelector('[data-action="next-match"]').addEventListener('click', () => this._navigateMatch(1));

        // Cut button
        modal.querySelector('[data-action="cut-here"]').addEventListener('click', () => this._cutFromCurrentMatch());

        // ESC to close - guardar referencia bound para cleanup
        this._boundEscHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', this._boundEscHandler);
    },

    // ========================================================================
    // FILE HANDLING
    // ========================================================================

    // Constantes de validacion
    MAX_FILE_SIZE_MB: 5,
    VALID_EXTENSIONS: ['.md', '.txt'],

    /**
     * Valida el archivo antes de procesarlo
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    _validateFile(file) {
        // Validar tamaño
        const maxSizeBytes = this.MAX_FILE_SIZE_MB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return {
                valid: false,
                error: 'Archivo muy grande. Maximo ' + this.MAX_FILE_SIZE_MB + 'MB. Tu archivo: ' + (file.size / 1024 / 1024).toFixed(1) + 'MB'
            };
        }

        // Validar extension
        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.VALID_EXTENSIONS.some(ext => fileName.endsWith(ext));
        if (!hasValidExtension) {
            return {
                valid: false,
                error: 'Extension no valida. Se aceptan: ' + this.VALID_EXTENSIONS.join(', ')
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Valida el contenido del archivo
     * @returns {Object} - { valid: boolean, error: string|null, warning: string|null }
     */
    _validateContent(content) {
        // Verificar que no este vacio
        if (!content || content.trim().length === 0) {
            return { valid: false, error: 'El archivo esta vacio.', warning: null };
        }

        // Verificar marcadores de conversacion (Claude, Gemini, NotebookLM y formato clasico)
        const tienePrompt = content.includes('## Prompt:') ||
            content.includes('## User:') ||
            (ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_MARKER && new RegExp(ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_MARKER.source, 'mi').test(content)) ||
            (ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR && content.includes(ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR));
        const tieneResponse = content.includes('## Response:') ||
            content.includes('## Assistant:') ||
            content.includes('## Gemini:') ||
            (ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_MARKER && new RegExp(ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_MARKER.source, 'mi').test(content)) ||
            (ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_STR && content.includes(ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_STR));

        if (!tienePrompt && !tieneResponse) {
            return {
                valid: false,
                error: 'El archivo no parece ser una conversacion exportada. No se encontraron marcadores de conversacion.',
                warning: null
            };
        }

        // Warning si falta alguno
        let warning = null;
        if (!tienePrompt) {
            warning = 'Advertencia: No se encontraron marcadores de Prompt (ej: "## User:" o "## Prompt:")';
        } else if (!tieneResponse) {
            warning = 'Advertencia: No se encontraron marcadores de Respuesta (ej: "## Response:", "## Assistant:" o "## Gemini:")';
        }

        return { valid: true, error: null, warning: warning };
    },

    /**
     * Muestra error en la dropzone
     */
    _showDropzoneError(message) {
        const dropzone = this._modalContainer.querySelector('[data-action="dropzone"]');
        dropzone.classList.remove('chatbot-roam-file-loaded');
        dropzone.classList.add('chatbot-roam-file-error');
        dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = '!';
        dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML =
            '<strong style="color: #e94560;">Error</strong><br>' +
            '<span style="color: #e94560;">' + message + '</span>';
    },

    _handleFiles(fileList) {
        // Convertir FileList a Array y ordenar alfabeticamente
        const filesArray = Array.from(fileList).sort((a, b) => a.name.localeCompare(b.name));
        
        // Validar todos los archivos individuales
        let totalSize = 0;
        for (const file of filesArray) {
            const fileValidation = this._validateFile(file);
            if (!fileValidation.valid) {
                this._showDropzoneError('Archivo "' + file.name + '" invalido: ' + fileValidation.error);
                return;
            }
            totalSize += file.size;
        }

        // Mostrar estado de carga
        const dropzone = this._modalContainer.querySelector('[data-action="dropzone"]');
        dropzone.classList.remove('chatbot-roam-file-error');
        dropzone.classList.add('chatbot-roam-file-loaded');
        dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = '...';
        dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML = 'Leyendo ' + filesArray.length + ' archivo(s)...';

        // Leer todos de forma asincronica
        const readPromises = filesArray.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve({ name: file.name, content: e.target.result, size: file.size });
                reader.onerror = () => reject('Error leyendo ' + file.name);
                reader.readAsText(file);
            });
        });

        Promise.all(readPromises).then(results => {
            const validContents = [];
            let warnings = [];

            for (const result of results) {
                const contentValidation = this._validateContent(result.content);
                if (!contentValidation.valid) {
                    this._showDropzoneError('Archivo "' + result.name + '" no valido: ' + contentValidation.error);
                    return; // Abortar operacion si un archivo no es valido
                }
                if (contentValidation.warning) warnings.push(result.name + ': ' + contentValidation.warning);
                
                // Unir contenidos con un delimitador rastreable por el processing
                validContents.push(':::FILE_BOUNDARY:' + result.name + ':::\n' + result.content);
            }

            this._fileContent = validContents.join('\n\n');

            // Detectar tipo de chatbot y aplicar preset (usa todo el bloque de texto)
            const tipo = ChatbotRoamProcessing.detectarTipoChatbot(this._fileContent);
            this._applyPreset(tipo, true);

            // Actualizar dropzone visual final
            dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = 'OK';
            
            let namesText = filesArray.length > 1 ? filesArray.length + ' archivos' : filesArray[0].name;
            let statusText = '<span style="color: #4CAF50;">Cargados (' + (totalSize / 1024).toFixed(1) + ' KB)</span>';
            
            if (warnings.length > 0) {
                const escapedWarnings = warnings.map(w => this._escapeHtml(w));
                statusText += '<br><span style="color: #FFA500; font-size: 11px; font-weight: bold;" title="' + escapedWarnings.join('\n') + '">⚠ ' + warnings.length + ' advertencia(s):</span>';
                statusText += '<br><span style="color: #FFA500; font-size: 10px; display: inline-block; max-width: 90%; text-align: center;">' + escapedWarnings.join('<br>') + '</span>';
            }

            dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML =
                '<strong>' + namesText + '</strong><br>' + statusText;

            this._processAndPreview();
        }).catch(err => {
            this._showDropzoneError('Error fatal: ' + err);
        });
    },

    // ========================================================================
    // OPTIONS MANAGEMENT
    // ========================================================================
    _applyPreset(preset, skipProcess = false) {
        if (preset === 'limpiar') {
            // Generar objeto con todas las opciones en false
            this._currentOpciones = {};
            var opciones = ChatbotRoamOpciones.getAll();
            for (var i = 0; i < opciones.length; i++) {
                this._currentOpciones[opciones[i].id] = false;
            }
        } else {
            this._currentOpciones = ChatbotRoamProcessing.getPresetOpciones(preset);
        }

        // Update checkboxes
        this._modalContainer.querySelectorAll('[data-option]').forEach(checkbox => {
            const option = checkbox.dataset.option;
            checkbox.checked = this._currentOpciones[option] || false;
        });

        if (!skipProcess && this._fileContent) {
            this._processAndPreview();
        }
    },

    _updateOpciones() {
        this._modalContainer.querySelectorAll('[data-option]').forEach(checkbox => {
            this._currentOpciones[checkbox.dataset.option] = checkbox.checked;
        });

        if (this._fileContent) {
            clearTimeout(this._updateTimer);
            this._updateTimer = setTimeout(() => this._processAndPreview(), 300);
        }
    },

    // ========================================================================
    // PROCESSING & PREVIEW
    // ========================================================================
    async _processAndPreview() {
        // Mostrar estado de carga
        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        const insertBtn = this._modalContainer.querySelector('[data-action="insert"]');

        preview.innerHTML = '<span style="color: #4CAF50;">Procesando archivo... por favor espera</span>';
        insertBtn.disabled = true;

        // Bloquear checkboxes
        this._toggleInputs(false);

        try {
            // Dar tiempo al browser para renderizar el mensaje de carga
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            const { resultado, numIntercambios } = await ChatbotRoamProcessing.procesarConOpcionesIndividuales(
                this._fileContent,
                this._currentOpciones
            );

            this._processedContent = resultado;
            this._originalProcessedContent = resultado;  // Guardar original
            this._isCut = false;
            this._searchMatches = [];
            this._currentMatchIndex = -1;

            // Reset search UI
            const searchInput = this._modalContainer.querySelector('[data-element="search-input"]');
            const cutIndicator = this._modalContainer.querySelector('[data-element="cut-indicator"]');
            if (searchInput) searchInput.value = '';
            if (cutIndicator) cutIndicator.textContent = '';

            this._updatePreview(resultado, numIntercambios);
        } catch (error) {
            console.error(error);
            preview.innerHTML = '<span style="color: #e94560;">Error al procesar: ' + error.message + '</span>';
        } finally {
            this._toggleInputs(true);
        }
    },

    /**
     * Habilita/deshabilita inputs durante procesamiento
     */
    _toggleInputs(enabled) {
        const checkboxes = this._modalContainer.querySelectorAll('input[type="checkbox"]');
        const presets = this._modalContainer.querySelectorAll('.chatbot-roam-preset-btn');
        const fileInput = this._modalContainer.querySelector('.chatbot-roam-hidden-input');

        checkboxes.forEach(cb => cb.disabled = !enabled);
        presets.forEach(btn => btn.disabled = !enabled);
        if (fileInput) fileInput.disabled = !enabled;
    },

    _updatePreview(content, numIntercambios) {
        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        const previewInfo = this._modalContainer.querySelector('[data-element="preview-info"]');
        const insertBtn = this._modalContainer.querySelector('[data-action="insert"]');

        if (content) {
            // Mostrar contenido (truncado si es excesivamente grande para evitar lags de renderizado)
            const MAX_PREVIEW_LIMIT = 80000;
            const isTruncated = content.length > MAX_PREVIEW_LIMIT;
            const displayContent = isTruncated ? content.substring(0, MAX_PREVIEW_LIMIT) + '\n\n... [Vista previa truncada para mejorar rendimiento. El archivo completo se importará correctamente] ...' : content;

            preview.textContent = displayContent;
            const countInfo = numIntercambios !== undefined ? (numIntercambios + ' intercambios · ') : '';
            const truncationInfo = isTruncated ? ' (vista previa truncada)' : '';
            previewInfo.textContent = countInfo + content.length.toLocaleString() + ' caracteres totales' + truncationInfo;
            insertBtn.disabled = false;
        } else {
            preview.innerHTML = '<span style="color: #e94560;">No se encontraron conversaciones en el archivo.</span>';
            previewInfo.textContent = '';
            insertBtn.disabled = true;
        }

        this._updateSearchButtons();
    },

    // ========================================================================
    // BÚSQUEDA INCREMENTAL
    // ========================================================================
    _performSearch(query) {
        if (!this._originalProcessedContent || !query || query.length < 2) {
            this._searchMatches = [];
            this._currentMatchIndex = -1;
            this._renderPreviewWithHighlights();
            return;
        }

        // Buscar todas las ocurrencias (case-insensitive)
        const content = this._originalProcessedContent;
        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();

        this._searchMatches = [];
        let pos = 0;
        while ((pos = lowerContent.indexOf(lowerQuery, pos)) !== -1) {
            this._searchMatches.push({
                start: pos,
                end: pos + query.length
            });
            pos += 1;
        }

        this._currentMatchIndex = this._searchMatches.length > 0 ? 0 : -1;
        this._renderPreviewWithHighlights();

        if (this._currentMatchIndex >= 0) {
            this._scrollToCurrentMatch();
        }
    },

    _navigateMatch(direction) {
        if (this._searchMatches.length === 0) return;

        // Quitar highlight del match actual
        const prevMark = this._modalContainer.querySelector('#current-match');
        if (prevMark) {
            prevMark.classList.remove('current');
            prevMark.removeAttribute('id');
        }

        this._currentMatchIndex += direction;
        if (this._currentMatchIndex < 0) {
            this._currentMatchIndex = this._searchMatches.length - 1;
        } else if (this._currentMatchIndex >= this._searchMatches.length) {
            this._currentMatchIndex = 0;
        }

        // Poner highlight en el nuevo match sin reconstruir todo el innerHTML
        const marks = this._modalContainer.querySelectorAll('.chatbot-roam-preview mark');
        if (marks[this._currentMatchIndex]) {
            marks[this._currentMatchIndex].classList.add('current');
            marks[this._currentMatchIndex].id = 'current-match';
        }

        this._updateSearchButtons();
        this._scrollToCurrentMatch();
    },

    _renderPreviewWithHighlights() {
        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        let content = this._isCut ? this._processedContent : this._originalProcessedContent;

        if (!content) {
            preview.innerHTML = '<span style="color: #666;">Arrastra archivos para ver la vista previa...</span>';
            this._updateSearchButtons();
            return;
        }

        const MAX_PREVIEW_LIMIT = 80000;
        let isTruncated = false;
        if (content.length > MAX_PREVIEW_LIMIT) {
            content = content.substring(0, MAX_PREVIEW_LIMIT);
            isTruncated = true;
        }

        // Filtrar matches que estén dentro del límite de la vista previa visible
        const visibleMatches = this._searchMatches.filter(match => match.end <= MAX_PREVIEW_LIMIT);

        if (visibleMatches.length === 0) {
            preview.textContent = content + (isTruncated ? '\n\n... [Vista previa truncada para mejorar rendimiento] ...' : '');
            this._updateSearchButtons();
            return;
        }

        // Crear HTML con highlights
        let html = '';
        let lastEnd = 0;

        for (let i = 0; i < visibleMatches.length; i++) {
            const match = visibleMatches[i];
            // Texto antes del match
            html += this._escapeHtml(content.substring(lastEnd, match.start));
            // Match con highlight
            const isCurrent = i === this._currentMatchIndex;
            const markClass = isCurrent ? 'current' : '';
            const markId = isCurrent ? 'id="current-match"' : '';
            html += '<mark class="' + markClass + '" ' + markId + '>' + this._escapeHtml(content.substring(match.start, match.end)) + '</mark>';
            lastEnd = match.end;
        }
        // Texto después del último match
        html += this._escapeHtml(content.substring(lastEnd));
        if (isTruncated) {
            html += '\n\n... [Vista previa truncada para mejorar rendimiento] ...';
        }

        preview.innerHTML = html;
        this._updateSearchButtons();
    },

    _escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    _scrollToCurrentMatch() {
        const currentMark = this._modalContainer.querySelector('#current-match');
        if (currentMark) {
            currentMark.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
    },

    _updateSearchButtons() {
        const prevBtn = this._modalContainer.querySelector('[data-action="prev-match"]');
        const nextBtn = this._modalContainer.querySelector('[data-action="next-match"]');
        const cutBtn = this._modalContainer.querySelector('[data-action="cut-here"]');
        const countSpan = this._modalContainer.querySelector('[data-element="match-count"]');

        const hasMatches = this._searchMatches.length > 0;
        const hasMultiple = this._searchMatches.length > 1;

        prevBtn.disabled = !hasMultiple;
        nextBtn.disabled = !hasMultiple;
        cutBtn.disabled = !hasMatches || this._isCut;

        if (hasMatches) {
            countSpan.textContent = (this._currentMatchIndex + 1) + '/' + this._searchMatches.length;
        } else {
            countSpan.textContent = '0/0';
        }
    },

    _cutFromCurrentMatch() {
        if (this._currentMatchIndex < 0 || this._isCut) return;

        const match = this._searchMatches[this._currentMatchIndex];
        const content = this._originalProcessedContent;

        // Encontrar el inicio de la línea que contiene el match
        // Buscamos el "* " que indica un prompt
        let cutPosition = match.start;

        // Buscar hacia atrás el inicio del prompt ("* " al inicio de línea o después de newline)
        while (cutPosition > 0) {
            if (content.substring(cutPosition, cutPosition + 2) === '* ' &&
                (cutPosition === 0 || content[cutPosition - 1] === '\n')) {
                break;
            }
            cutPosition--;
        }

        // Cortar desde esa posición
        this._processedContent = content.substring(cutPosition);
        this._isCut = true;

        // Limpiar búsqueda y actualizar UI
        this._searchMatches = [];
        this._currentMatchIndex = -1;

        const searchInput = this._modalContainer.querySelector('[data-element="search-input"]');
        searchInput.value = '';

        const cutIndicator = this._modalContainer.querySelector('[data-element="cut-indicator"]');
        cutIndicator.textContent = '[OK] Cortado';

        // Contar intercambios restantes
        let numIntercambios = 0;
        let searchPos = 0;
        while (true) {
            const lineStart = searchPos === 0 ? 0 : this._processedContent.indexOf('\n', searchPos - 1) + 1;
            if (lineStart === 0 && searchPos > 0) break;
            if (this._processedContent.charCodeAt(lineStart) === 42 && this._processedContent.charCodeAt(lineStart + 1) === 32) {
                numIntercambios++;
            }
            const nextNewline = this._processedContent.indexOf('\n', lineStart);
            if (nextNewline === -1) break;
            searchPos = nextNewline + 1;
        }

        this._updatePreview(this._processedContent, numIntercambios);
    },

    // ROAM INSERTION
    async _insertInRoam() {
        if (!this._processedContent) return;

        // Usar el bloque guardado al abrir el modal
        if (!this._savedBlockUid) {
            alert('No hay bloque seleccionado. Selecciona un bloque antes de abrir el plugin.');
            return;
        }

        const parentUid = this._savedBlockUid;

        // Parsear el contenido procesado en estructura de bloques
        const lineas = this._processedContent.split('\n');
        let rawBloques = ChatbotRoamParser.parseToBlockStructure(lineas);

        // Agrupar bajo los nodos padre de cada archivo si procede
        let bloques = [];
        let currentFileBlock = null;

        for (let i = 0; i < rawBloques.length; i++) {
            let bloque = rawBloques[i];
            if (bloque.text && bloque.text.startsWith('📁 ')) {
                currentFileBlock = { text: '**' + bloque.text + '**', children: [] };
                bloques.push(currentFileBlock);
            } else {
                if (currentFileBlock) {
                    currentFileBlock.children.push(bloque);
                } else {
                    bloques.push(bloque);
                }
            }
        }

        if (bloques.length === 0) {
            alert('No se generaron bloques para insertar.');
            return;
        }

        // Feedback UI
        const insertBtn = this._modalContainer.querySelector('[data-action="insert"]');
        const originalText = insertBtn.textContent;
        insertBtn.disabled = true;
        insertBtn.textContent = 'Insertando... (0%)';
        this._toggleInputs(false);

        // Crear token de cancelacion
        this._activeCancelToken = { cancelled: false };

        // Insertar usando el Inserter con soporte de rollback, batching y cancelacion
        const result = await ChatbotRoamInserter.insertBlocksRecursively(parentUid, bloques, 0, this._activeCancelToken, (count, total) => {
            // Verificar si el modal aun existe (por si se cancelo y cerro)
            if (!this._modalContainer) return;

            // Actualizar porcentaje
            const percent = Math.round((count / total) * 100);
            insertBtn.textContent = 'Insertando... (' + percent + '%)';
        });

        // Limpiar token
        this._activeCancelToken = null;

        if (result.success) {
            // Cerrar modal tras exito
            this.closeModal();

            // Notificar al usuario (podriamos usar un toast de Roam si existiera API publica, por ahora alert o nada)
            console.log('Chatbot Roam Plugin: ' + result.insertedCount + ' bloques insertados correctamente.');
        } else {
            // Verificar si el modal aun existe antes de intentar actualizar UI
            if (!this._modalContainer) return;

            // Mostrar error y rollback info
            let msg = '';

            if (result.error === 'OPERACION_CANCELADA_POR_USUARIO') {
                msg = 'Operacion cancelada por el usuario.';
            } else {
                msg = 'Error al insertar bloques: ' + result.error;
            }

            if (result.rolledBackCount > 0) {
                msg += '\n\nSe realizo una limpieza automatica (ROLLBACK) eliminando ' + result.rolledBackCount + ' bloques parciales.';
            } else {
                msg += '\n\nNo se insertaron bloques (limpio).';
            }

            alert(msg);

            // Restaurar UI
            insertBtn.disabled = false;
            insertBtn.textContent = originalText;
            this._toggleInputs(true);
        }
    },
    // CLOSE MODAL
    closeModal() {
        const savedUid = this._savedBlockUid;

        // Si hay una insercion activa, cancelarla
        if (this._activeCancelToken) {
            console.log('Cancelando insercion en curso...');
            this._activeCancelToken.cancelled = true;
            // No esperamos al rollback aqui, "fire and forget"
            // El usuario recibe feedback visual inmediato de cierre
        }

        // Limpiar event listener SIEMPRE (incluso si modal ya no existe)
        if (this._boundEscHandler) {
            document.removeEventListener('keydown', this._boundEscHandler);
            this._boundEscHandler = null;
        }

        if (this._modalContainer) {
            this._modalContainer.remove();
            this._modalContainer = null;
            this._fileContent = null;
            this._processedContent = null;
            this._originalProcessedContent = null;
            this._searchMatches = [];
            this._currentMatchIndex = -1;
            this._savedBlockUid = null;
        }

        // Limpiar estilos inyectados
        const styleEl = document.getElementById('chatbot-roam-styles');
        if (styleEl) styleEl.remove();

        // Limpiar timers pendientes
        clearTimeout(this._updateTimer);

        // Restaurar foco al bloque original
        if (savedUid) {
            setTimeout(function () {
                window.roamAlphaAPI.ui.setBlockFocusAndSelection({
                    location: { "block-uid": savedUid, "window-id": "main-window" }
                });
            }, 100);
        }
    }
};


// --- index.js ---
// CHATBOT ROAM PLUGIN - INDEX
// Main entry point - registers commands with Roam

const ChatbotRoamPlugin = {
    VERSION: "1.5.5",

    // Lista de comandos registrados (para cleanup en recargas)
    _registeredCommands: [
        'Importar Conversacion de Chatbot'
    ],

    // Inicializa el plugin
    init: function () {
        if (!window.roamAlphaAPI) {
            console.error("Chatbot Roam Plugin: Roam Alpha API no disponible.");
            return;
        }

        // Limpiar comandos previos si existen (para manejar recargas del script)
        var self = this;
        this._registeredCommands.forEach(function (label) {
            try {
                window.roamAlphaAPI.ui.commandPalette.removeCommand({ label: label });
            } catch (e) { /* Ignorar - el comando no existia */ }
        });

        // Registrar comando principal
        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: 'Importar Conversacion de Chatbot',
            callback: function () { ChatbotRoamUI.openModal(); },
            "default-hotkey": "ctrl-shift-i"
        });

        console.log('Chatbot Roam Plugin v1.5.5 loaded');
        console.log('   Usa Ctrl+Shift+I o busca "Importar Conversacion" en el command palette.');
    }
};

// Auto-inicializar
ChatbotRoamPlugin.init();

