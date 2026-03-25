// CHATBOT ROAM PLUGIN v1.4.2
// Importador de conversaciones de chatbots (Claude, ChatGPT, Gemini) a Roam
// Uso: Ctrl+Shift+I o Command Palette
// Generated: 2026-03-25 16:09:06

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
    VERSION: "1.4.1",

    // IMAGENES BASE64
    IMAGEN_COMPLETA: /!\[[^\]]*\]\(data:image\/[^)]*\)/g,
    IMAGEN_TRUNCADA: /!\[[^\]]*\]\(data:image\/[^\n)]*(?=\n|$)/g,

    // FORMATO MARKDOWN
    LINEAS_VACIAS_EXCESIVAS: /\n{3,}/g,
    CODIGO_CUATRO_BACKTICKS: new RegExp(BT4 + "(\\w+)", "g"),
    CODIGO_TRES_BACKTICKS: new RegExp(BT3 + "(\\w+)", "g"),

    // TIMESTAMPS
    TIMESTAMP_COMPLETO: /^\d{1,2}\/\d{1,2}\/\d{4},\s+\d{1,2}:\d{2}:\d{2}\s+[ap]\.m\.$/,
    TIMESTAMP_FECHA: /^\d{1,2}\/\d{1,2}\/\d{4}/,

    // MARCADORES DE CONVERSACION
    PROMPT_MARKER: /^## Prompt:/gm,
    RESPONSE_MARKER: /^## Response:/gm,

    // THOUGHT PROCESSES
    // Claude - bloques plaintext
    PLAINTEXT_BLOCKS_CLAUDE: new RegExp(BT4 + "plaintext[\\s\\S]*?" + BT4, "g"),

    // ChatGPT - Thought process generico
    THOUGHT_PROCESS_GENERICO: new RegExp(BT4 + "plaintext\\s*Thought process:[\\s\\S]*?" + BT4, "g"),

    // TOOL CALLS (CLAUDE)
    TOOL_CALLS_COMPLETO: new RegExp("\\*\\*\\w+\\*\\*\\s*\\*Request\\*\\s*" + BT4 + "(?:javascript|json)[\\s\\S]*?" + BT4 + "\\s*\\*Response\\*\\s*" + BT4 + "(?:plaintext|text)[\\s\\S]*?" + BT4, "g"),
    TOOL_CALLS_SIMPLE: /\*\*\w+\*\*\s*(?=\*Request\*|$)/g,

    // MCP Tool calls (Claude con MCP)
    MCP_TOOL_CALLS: new RegExp("\\*\\*[\\w-]+:[\\w_]+\\*\\*[\\s\\n]*\\*Request\\*[\\s\\n]*" + BT4 + "(?:javascript|json|plaintext)[\\s\\S]*?" + BT4 + "[\\s\\n]*\\*Response\\*[\\s\\n]*" + BT4 + "(?:javascript|json|plaintext|text)[\\s\\S]*?" + BT4, "g"),

    // MCP Tool Header (para detectar bloques mal clasificados)
    MCP_TOOL_HEADER: /\*\*[\w-]+:[\w_]+\*\*/,

    // ANTIGRAVITY FORMAT
    ANTIGRAVITY_PROMPT_MARKER: /^### User Input$/gm,
    ANTIGRAVITY_RESPONSE_MARKER: /^### Planner Response$/gm,
    ANTIGRAVITY_ACTIONS: /^\*(?:Listed directory|Viewed|Searched filesystem|Searched|Edited relevant file|Edited|Grep searched|Checked command status|Checked command|User accepted the command|User accepted)[^\n]*$/gm,
    ANTIGRAVITY_HEADER: /^# Chat Conversation\s*\n+Note: _This is purely[^_]*_\s*\n*/gm,
    ANTIGRAVITY_SYSTEM_MESSAGE: /^This is a system-generated message[^\n]*$/gm,
    CCI_LINKS: /\(cci:\d+:\/\/file:\/\/\/[^)]+\)/g,
    TIMESTAMP_HORA_SUELTA: /^\d{1,2}:\d{2}\s+[ap]\.m\.$/,

    // NOTEBOOKLM FORMAT - Using runtime-generated constants
    NOTEBOOKLM_PROMPT_MARKER: null,    // Initialized below
    NOTEBOOKLM_RESPONSE_MARKER: null,  // Initialized below
    NOTEBOOKLM_PROMPT_STR: null,       // For string matching
    NOTEBOOKLM_RESPONSE_STR: null,     // For string matching

    // DETECCION DE TIPO DE CHATBOT
    DETECT_ANTIGRAVITY: /^### (?:User Input|Planner Response)$/m,
    DETECT_CLAUDE_TOOLS: /\*\*\w+\*\*\s*\*Request\*/,
    DETECT_GEMINI_THINKING: /^>\s*Thinking:/m,

    // Helper getters for backtick strings
    get BT3() { return BT3; },
    get BT4() { return BT4; },

    // Helper for NotebookLM detection
    isNotebookLM(content) {
        return content.includes(this.NOTEBOOKLM_PROMPT_STR) ||
            content.includes(this.NOTEBOOKLM_RESPONSE_STR);
    }
};

// Initialize NotebookLM patterns after object creation (using runtime-generated strings)
ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR = '### ' + NOTEBOOKLM_PERSON + ' **' + NOTEBOOKLM_USER + '**';
ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_STR = '### ' + NOTEBOOKLM_ROBOT + ' **' + NOTEBOOKLM_ASSISTANT + '**';
ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_MARKER = new RegExp('^' + ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'gm');
ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_MARKER = new RegExp('^' + ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_STR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'gm');


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
     * Usa procesamiento iterativo para mayor robustez con contenido largo.
     */
    eliminarMcpToolCallsClaude(texto) {
        const BT4 = ChatbotRoamPatterns.BT4;

        // Patron para encontrar nombres de herramientas MCP
        const patronNombre = /\*\*[\w-]+:[\w_]+\*\*/g;

        // Encontrar todas las posiciones de herramientas MCP
        const matches = [];
        let match;
        while ((match = patronNombre.exec(texto)) !== null) {
            matches.push({ start: match.index, nombre: match[0] });
        }

        // Procesar en reversa para no afectar los indices
        for (let i = matches.length - 1; i >= 0; i--) {
            const { start, nombre } = matches[i];

            // Buscar *Request* despues del nombre
            const despuesNombre = texto.substring(start + nombre.length);
            const posRequest = despuesNombre.indexOf('*Request*');
            if (posRequest === -1 || posRequest > 50) continue; // Muy lejos, no es parte del bloque

            // Buscar el primer bloque de codigo (BT4 + lang ... BT4)
            const despuesRequest = despuesNombre.substring(posRequest + 9);
            const posAbreCode1 = despuesRequest.indexOf(BT4);
            if (posAbreCode1 === -1 || posAbreCode1 > 50) continue;

            const despuesAbre1 = despuesRequest.substring(posAbreCode1 + 4);
            const posCierraCode1 = despuesAbre1.indexOf(BT4);
            if (posCierraCode1 === -1) continue;

            // Buscar *Response* despues del primer bloque
            const despuesCierra1 = despuesAbre1.substring(posCierraCode1 + 4);
            const posResponse = despuesCierra1.indexOf('*Response*');
            if (posResponse === -1 || posResponse > 50) continue;

            // Buscar el segundo bloque de codigo
            const despuesResponse = despuesCierra1.substring(posResponse + 10);
            const posAbreCode2 = despuesResponse.indexOf(BT4);
            if (posAbreCode2 === -1 || posAbreCode2 > 50) continue;

            const despuesAbre2 = despuesResponse.substring(posAbreCode2 + 4);
            const posCierraCode2 = despuesAbre2.indexOf(BT4);
            if (posCierraCode2 === -1) continue;

            // Calcular el fin del bloque completo
            const finBloque = start + nombre.length + posRequest + 9 + posAbreCode1 + 4 +
                posCierraCode1 + 4 + posResponse + 10 + posAbreCode2 + 4 +
                posCierraCode2 + 4;

            // Eliminar el bloque
            texto = texto.substring(0, start) + texto.substring(finBloque);
        }

        // Limpiar lineas residuales (nombres sueltos que no matchearon el patron completo)
        const patronNombresResiduales = /^\*\*[\w-]+:[\w_]+\*\*\s*$/gm;
        texto = texto.replace(patronNombresResiduales, '');

        // Limpiar *Request* y *Response* huerfanos
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
    },

    // ========================================================================
    // LIMPIEZA ANTIGRAVITY
    // ========================================================================

    /**
     * Elimina el encabezado del archivo Antigravity
     */
    eliminarHeaderAntigravity(texto) {
        return texto.replace(ChatbotRoamPatterns.ANTIGRAVITY_HEADER, '');
    },

    /**
     * Elimina lineas de acciones (*Listed directory*, *Viewed*, etc.)
     */
    eliminarAccionesAntigravity(texto) {
        return texto.replace(ChatbotRoamPatterns.ANTIGRAVITY_ACTIONS, '');
    },

    /**
     * Limpia enlaces CCI internos (cci:N://file:///...)
     */
    limpiarEnlacesCCI(texto) {
        // Paso 1: Eliminar enlaces CCI completos
        texto = texto.replace(ChatbotRoamPatterns.CCI_LINKS, '');
        // Paso 2: Limpiar enlaces markdown que apuntan a CCI
        texto = texto.replace(/\[([^\]]+)\]\(cci:[^)]+\)/g, '$1');
        return texto;
    },

    /**
     * Elimina mensajes de sistema generados automaticamente
     */
    eliminarMensajesSistemaAntigravity(texto) {
        return texto.replace(ChatbotRoamPatterns.ANTIGRAVITY_SYSTEM_MESSAGE, '');
    },

    /**
     * Elimina timestamps de hora suelta (sin fecha)
     */
    eliminarTimestampHoraSuelta(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            if (ChatbotRoamPatterns.TIMESTAMP_HORA_SUELTA.test(linea.trim())) continue;
            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
    },

    // ========================================================================
    // LIMPIEZA NOTEBOOKLM
    // ========================================================================

    /**
     * Elimina el header YAML y título de NotebookLM
     * Formato: ---\nexported: ...\nsource: NotebookLM\n---\n# Título\n导出时间: ...\n---
     */
    eliminarHeaderNotebookLM(texto) {
        // Eliminar bloque YAML (---...---)
        texto = texto.replace(/^---[\s\S]*?---\n*/m, '');
        // Eliminar título # y línea de exportación china
        texto = texto.replace(/^# [^\n]+\n+导出时间:[^\n]+\n+---+\n*/m, '');
        // Limpiar separadores --- sueltos
        texto = texto.replace(/^---+\s*\n/gm, '');
        return texto;
    },

    /**
     * Elimina timestamps de sección como "## 🕒 Today • 3:06 PM"
     */
    eliminarTimestampNotebookLM(texto) {
        // Eliminar líneas tipo "## 🕒 Today • 3:06 PM" o similares
        return texto.replace(/^## [^\n]*(?:Today|Yesterday|AM|PM)[^\n]*\n*/gm, '');
    },

    /**
     * Limpia escapes innecesarios de NotebookLM, como "1\." que debería ser "1."
     */
    limpiarEscapesNotebookLM(texto) {
        // Reemplazar "numero\." por "numero."
        texto = texto.replace(/(\d+)\\\./g, '$1.');
        // Reemplazar "\-" por "-" (por si acaso)
        texto = texto.replace(/\\-/g, '-');
        return texto;
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
                    resultado.push(...tablaRoam);

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
        id: 'revisar_clasificacion',
        label: 'Revisar clasificaci\u00f3n (Prompt/Response)',
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity', 'notebooklm'],
        defaultActivo: false,
        aplicarA: 'none', // No modifica el texto, es solo un flag UI
        cleaner: function (texto) { return texto; }
    },
    {
        id: 'eliminar_imagenes',
        label: 'Imagenes Base64',
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity', 'notebooklm'],
        defaultActivo: true,
        aplicarA: 'ambos',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarImagenesEmbedidas(texto); }
    },
    {
        id: 'eliminar_metadata',
        label: 'Timestamps y referencias',
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity', 'notebooklm'],
        defaultActivo: false,
        aplicarA: 'ambos',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarMetadataGenerico(texto); }
    },

    // ========================================================================
    // OPCIONES CLAUDE
    // ========================================================================
    {
        id: 'eliminar_mcp_toolcalls_claude',
        label: 'MCP Tool calls (Claude)',
        chatbots: ['claude'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarMcpToolCallsClaude(texto); }
    },
    {
        id: 'eliminar_plaintext_claude',
        label: 'Bloques plaintext (Claude)',
        chatbots: ['claude'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarThoughtProcessClaude(texto); }
    },
    {
        id: 'eliminar_toolcalls_claude',
        label: 'Tool calls (Claude)',
        chatbots: ['claude'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarToolCallsClaude(texto); }
    },

    // ========================================================================
    // OPCIONES CHATGPT
    // ========================================================================
    {
        id: 'eliminar_thought_chatgpt',
        label: 'Thought process (ChatGPT)',
        chatbots: ['chatgpt'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarThoughtProcessGenerico(texto); }
    },
    {
        id: 'eliminar_logs_chatgpt',
        label: 'Logs de b\u00fasqueda',
        chatbots: ['chatgpt'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarToolLogsGenerico(texto); }
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
    // OPCIONES ANTIGRAVITY
    // ========================================================================
    {
        id: 'eliminar_header_antigravity',
        label: 'Header Antigravity',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'preproceso',  // Se aplica ANTES de extraer conversación
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarHeaderAntigravity(texto); }
    },
    {
        id: 'eliminar_acciones_antigravity',
        label: 'Acciones Antigravity',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarAccionesAntigravity(texto); }
    },
    {
        id: 'eliminar_cci_links',
        label: 'Enlaces CCI internos',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarEnlacesCCI(texto); }
    },
    {
        id: 'eliminar_sistema_antigravity',
        label: 'Mensajes de sistema',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarMensajesSistemaAntigravity(texto); }
    },
    {
        id: 'eliminar_timestamp_hora',
        label: 'Timestamps de hora suelta',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarTimestampHoraSuelta(texto); }
    },

    // ========================================================================
    // OPCIONES NOTEBOOKLM
    // ========================================================================
    {
        id: 'eliminar_header_notebooklm',
        label: 'Header NotebookLM (YAML + t\u00edtulo)',
        chatbots: ['notebooklm'],
        defaultActivo: true,
        aplicarA: 'preproceso',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarHeaderNotebookLM(texto); }
    },
    {
        id: 'eliminar_timestamp_notebooklm',
        label: 'Timestamps de secci\u00f3n (Today, etc.)',
        chatbots: ['notebooklm'],
        defaultActivo: true,
        aplicarA: 'preproceso',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarTimestampNotebookLM(texto); }
    },

    {
        id: 'normalizar_vinetas_notebooklm',
        label: 'Normalizar vi\u00f1etas (\u2022, \u25e6)',
        chatbots: ['notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.normalizarVinetasNotebookLM(texto); }
    },

    // ========================================================================
    // CONVERSIÓN DE FORMATO
    // ========================================================================
    {
        id: 'convertir_tablas_roam',
        label: 'Convertir tablas a Roam',
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity', 'notebooklm'],
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
     * @param {string} tipo - 'claude', 'chatgpt', 'gemini', 'antigravity', 'generico'
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
     * @param {string} destino - 'prompt', 'respuesta', o 'preproceso'
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
            // No mostrar opciones de preproceso (son internas)
            if (opcion.aplicarA === 'preproceso') continue;

            var extraClass = opcion.id === 'revisar_clasificacion' ? ' chatbot-roam-option-highlight' : '';
            html += '<label class="chatbot-roam-option' + extraClass + '">' +
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
     * Maneja headings markdown, listas, bloques de codigo, tablas Roam y texto normal
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
        var bajoHeading = false;
        var enTablaRoam = false;

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
                var indentTabla = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                resultado.push(indentTabla + lineaStripped);
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
                    var indentTabla = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                    // Preservar la indentación original de la línea de tabla
                    resultado.push(indentTabla + linea);
                    continue;
                } else {
                    // Línea que no es parte de tabla = salir de tabla
                    enTablaRoam = false;
                    // NO hacer continue, procesar esta línea normalmente abajo
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
                    var indentCodigo = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                    resultado.push(indentCodigo + '[CODE]' + codigoBuffer.join('{{NL}}'));
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

            // Headings markdown (#, ##, ###, etc.)
            if (lineaStripped.startsWith('#')) {
                bajoHeading = true;  // Activar indentacion para contenido siguiente
                resultado.push(this.INDENT_BASE + lineaStripped);
            }
            // Listas
            else if (lineaStripped.startsWith('* ') || lineaStripped.startsWith('- ')) {
                var indentLista = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                resultado.push(indentLista + linea.trim());
            }
            // Texto normal
            else {
                var indentTexto = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                resultado.push(indentTexto + '* ' + lineaStripped);
            }
        }

        // Si quedo codigo sin cerrar, agregarlo
        if (codigoBuffer.length > 0) {
            resultado.push(this.INDENT_BASE + '[CODE]' + codigoBuffer.join('{{NL}}'));
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

        if (!promptLimpio) return resultado;

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
        // NotebookLM uses Chinese markers: 用户 (user) and 助手 (assistant)
        const esNotebookLM = ChatbotRoamPatterns.isNotebookLM(contenido);
        const esAntigravity = ChatbotRoamPatterns.DETECT_ANTIGRAVITY.test(contenido);

        // Usar marcadores segun formato
        let promptPattern, responsePattern;
        if (esNotebookLM) {
            promptPattern = ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_MARKER;
            responsePattern = ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_MARKER;
        } else if (esAntigravity) {
            promptPattern = ChatbotRoamPatterns.ANTIGRAVITY_PROMPT_MARKER;
            responsePattern = ChatbotRoamPatterns.ANTIGRAVITY_RESPONSE_MARKER;
        } else {
            promptPattern = ChatbotRoamPatterns.PROMPT_MARKER;
            responsePattern = ChatbotRoamPatterns.RESPONSE_MARKER;
        }

        // Encontrar todos los prompts
        let match;
        const promptRegex = new RegExp(promptPattern.source, 'gm');
        while ((match = promptRegex.exec(contenido)) !== null) {
            marcadores.push({ tipo: 'PROMPT', pos: match.index });
        }

        // Encontrar todas las respuestas
        const responseRegex = new RegExp(responsePattern.source, 'gm');
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

        // Extraer contenido entre marcadores
        const prompts = [];
        const responses = [];

        for (let i = 0; i < marcadores.length; i++) {
            const { tipo, pos } = marcadores[i];
            const lineaInicio = contenido.substring(pos).split('\n', 2);

            if (lineaInicio.length < 2) continue;

            let siguienteLineaPos = pos + lineaInicio[0].length + 1;
            let inicioContenido = siguienteLineaPos;

            if (skipTimestamp) {
                const resto = contenido.substring(siguienteLineaPos);
                const lineasResto = resto.split('\n');
                if (lineasResto.length > 0 && ChatbotRoamPatterns.TIMESTAMP_FECHA.test(lineasResto[0].trim())) {
                    inicioContenido = siguienteLineaPos + lineasResto[0].length + 1;
                }
            }

            const finContenido = i < marcadores.length - 1 ? marcadores[i + 1].pos : contenido.length;
            const bloque = contenido.substring(inicioContenido, finContenido).trim();

            if (tipo === 'PROMPT') {
                prompts.push(bloque);
            } else {
                responses.push(bloque);
            }
        }

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
                // Extraer contenido del prompt
                const lineaInicio = contenido.substring(pos).split('\n', 2);
                let siguienteLineaPos = pos + lineaInicio[0].length + 1;
                let inicioContenido = siguienteLineaPos;

                if (skipTimestamp) {
                    const resto = contenido.substring(siguienteLineaPos);
                    const lineasResto = resto.split('\n');
                    if (lineasResto.length > 0 && ChatbotRoamPatterns.TIMESTAMP_FECHA.test(lineasResto[0].trim())) {
                        inicioContenido = siguienteLineaPos + lineasResto[0].length + 1;
                    }
                }

                const finPrompt = i + 1 < marcadores.length ? marcadores[i + 1].pos : contenido.length;
                const promptBloque = contenido.substring(inicioContenido, finPrompt).trim();

                // Buscar y concatenar todas las respuestas consecutivas
                const responseParts = [];
                let j = i + 1;

                while (j < marcadores.length && marcadores[j].tipo === 'RESPONSE') {
                    const respPos = marcadores[j].pos;
                    const respLineaInicio = contenido.substring(respPos).split('\n', 2);
                    const respSiguienteLineaPos = respPos + respLineaInicio[0].length + 1;
                    const finResp = j + 1 < marcadores.length ? marcadores[j + 1].pos : contenido.length;
                    const respBloque = contenido.substring(respSiguienteLineaPos, finResp).trim();

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

    /**
     * Extrae TODOS los bloques (Prompt y Response) del archivo con metadata.
     * Para uso en el editor de clasificación manual.
     * @param {string} contenido - Contenido raw del archivo
     * @returns {Array} - [{pos, tipo, extracto, lineNumber}, ...]
     */
    extraerTodosLosBloques(contenido) {
        const bloques = [];
        const regex = /^## (Prompt|Response):/gm;
        let match;

        while ((match = regex.exec(contenido)) !== null) {
            const posInicio = match.index;
            const tipo = match[1]; // "Prompt" o "Response"

            // Calcular número de línea
            const lineNumber = contenido.substring(0, posInicio).split('\n').length;

            // Encontrar el fin de este bloque (siguiente ## o fin de archivo)
            const restoContenido = contenido.substring(posInicio);
            const marcadorLen = match[0].length; // "## Prompt:" o "## Response:"
            const siguienteBloque = restoContenido.substring(marcadorLen).search(/^## (?:Prompt|Response):/m);
            const finBloque = siguienteBloque === -1
                ? contenido.length
                : posInicio + marcadorLen + siguienteBloque;

            // Extraer contenido del bloque (skip header y timestamp)
            const contenidoBloque = contenido.substring(posInicio, finBloque);
            const lineas = contenidoBloque.split('\n').slice(2, 5);
            const extracto = lineas.join(' ').substring(0, 100).trim();

            // Detectar si tiene MCP tools (para marcar visualmente)
            const tieneMCP = ChatbotRoamPatterns.MCP_TOOL_HEADER.test(contenidoBloque);

            bloques.push({
                pos: posInicio,
                tipo: tipo,
                lineNumber: lineNumber,
                extracto: extracto || '(vacío)',
                tieneMCP: tieneMCP
            });
        }

        return bloques;
    },

    /**
     * Detecta si un archivo tiene uso de MCP (para decidir si mostrar editor)
     */
    tieneUsoDeMCP(contenido) {
        return ChatbotRoamPatterns.MCP_TOOL_HEADER.test(contenido);
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
        // Eliminar header Antigravity ANTES de procesar
        if (opciones.eliminar_header_antigravity) {
            contenido = ChatbotRoamCleaners.eliminarHeaderAntigravity(contenido);
        }

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

        for (let i = 0; i < conversacionRaw.length; i++) {
            // Yield al main thread cada 20 items para mantener UI responsiva
            if (i > 0 && i % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
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
            resultado.push(...lineasFormateadas);
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

        promptTemp = ChatbotRoamCleaners.limpiarFormatoMarkdownBasico(promptTemp);
        return ChatbotRoamCleaners.limpiarContenido(promptTemp).split('\n').join(' ').trim();
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
        // Detectar NotebookLM PRIMERO (marcadores chinos: 用户/助手)
        if (ChatbotRoamPatterns.isNotebookLM(contenido)) {
            return 'notebooklm';
        }

        // Detectar Antigravity (marcadores unicos)
        const esAntigravity = ChatbotRoamPatterns.DETECT_ANTIGRAVITY.test(contenido);
        if (esAntigravity) {
            return 'antigravity';
        }

        const tieneToolCalls = ChatbotRoamPatterns.DETECT_CLAUDE_TOOLS.test(contenido);
        const tienePlaintextBlocks = contenido.includes(ChatbotRoamPatterns.BT4 + 'plaintext');

        if (tieneToolCalls || tienePlaintextBlocks) {
            return 'claude';
        }

        const tieneThinkingGemini = ChatbotRoamPatterns.DETECT_GEMINI_THINKING.test(contenido);
        const tieneGeminiFooter = contenido.includes('Gemini Exporter');

        if (tieneThinkingGemini || tieneGeminiFooter) {
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
        return `
            .chatbot-roam-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(7, 54, 66, 0.85);
                backdrop-filter: blur(6px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chatbot-roam-modal {
                background: #002b36;
                border-radius: 8px;
                width: 900px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(88, 110, 117, 0.3);
                display: flex;
                flex-direction: column;
            }

            .chatbot-roam-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 20px;
                background: #073642;
                border-bottom: 1px solid #586e75;
            }

            .chatbot-roam-title {
                color: #b58900;
                font-size: 16px;
                font-weight: 600;
                margin: 0;
                letter-spacing: 0.3px;
            }

            .chatbot-roam-close {
                background: transparent;
                border: none;
                color: #657b83;
                font-size: 22px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                transition: color 0.15s;
            }

            .chatbot-roam-close:hover {
                color: #cb4b16;
            }

            .chatbot-roam-body {
                padding: 20px;
                overflow-y: auto;
                flex: 1;
            }

            .chatbot-roam-dropzone {
                border: 2px dashed #586e75;
                border-radius: 6px;
                padding: 40px 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
                background: #073642;
            }

            .chatbot-roam-dropzone:hover,
            .chatbot-roam-dropzone.dragover {
                border-color: #2aa198;
                background: rgba(42, 161, 152, 0.08);
            }

            .chatbot-roam-dropzone-icon {
                font-size: 42px;
                margin-bottom: 12px;
                color: #657b83;
            }

            .chatbot-roam-dropzone-text {
                color: #93a1a1;
                font-size: 14px;
            }

            .chatbot-roam-dropzone-text strong {
                color: #2aa198;
            }

            .chatbot-roam-file-loaded {
                background: rgba(42, 161, 152, 0.1);
                border-color: #2aa198;
            }

            .chatbot-roam-file-loaded .chatbot-roam-dropzone-icon {
                color: #2aa198;
            }

            .chatbot-roam-file-error {
                background: rgba(203, 75, 22, 0.1);
                border-color: #cb4b16;
            }

            .chatbot-roam-file-error .chatbot-roam-dropzone-icon {
                color: #cb4b16;
                font-size: 36px;
                font-weight: bold;
            }

            .chatbot-roam-section-title {
                color: #b58900;
                font-size: 13px;
                font-weight: 600;
                margin: 20px 0 12px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .chatbot-roam-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px 20px;
            }

            .chatbot-roam-option {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #93a1a1;
                font-size: 13px;
            }

            .chatbot-roam-option input[type="checkbox"] {
                accent-color: #2aa198;
            }

            .chatbot-roam-option-highlight {
                grid-column: 1 / -1;
                background: rgba(203, 75, 22, 0.08);
                border: 1px solid rgba(203, 75, 22, 0.25);
                border-radius: 6px;
                padding: 6px 10px;
                color: #cb4b16;
                font-weight: 600;
            }

            .chatbot-roam-option-highlight input[type="checkbox"] {
                accent-color: #cb4b16;
            }

            .chatbot-roam-presets {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                flex-wrap: wrap;
            }

            .chatbot-roam-preset-btn {
                background: transparent;
                border: 1px solid #586e75;
                color: #93a1a1;
                padding: 6px 14px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s;
            }

            .chatbot-roam-preset-btn:hover {
                background: #b58900;
                color: #002b36;
                border-color: #b58900;
            }

            .chatbot-roam-preview {
                background: #073642;
                border: 1px solid #586e75;
                border-radius: 6px;
                padding: 12px;
                max-height: 250px;
                overflow-y: auto;
                font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                color: #839496;
                white-space: pre-wrap;
                line-height: 1.5;
            }

            .chatbot-roam-preview-info {
                color: #657b83;
                font-size: 11px;
                margin-top: 8px;
                font-style: italic;
            }

            .chatbot-roam-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 20px;
                background: #073642;
                border-top: 1px solid #586e75;
            }

            .chatbot-roam-info {
                color: #657b83;
                font-size: 12px;
            }

            .chatbot-roam-info strong {
                color: #b58900;
            }

            .chatbot-roam-buttons {
                display: flex;
                gap: 10px;
            }

            .chatbot-roam-btn {
                padding: 10px 20px;
                border-radius: 4px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s;
            }

            .chatbot-roam-btn-cancel {
                background: transparent;
                border: 1px solid #586e75;
                color: #93a1a1;
            }

            .chatbot-roam-btn-cancel:hover {
                border-color: #839496;
                color: #eee8d5;
            }

            .chatbot-roam-btn-insert {
                background: #b58900;
                border: none;
                color: #002b36;
                font-weight: 600;
            }

            .chatbot-roam-btn-insert:hover {
                background: #d4a000;
            }

            .chatbot-roam-btn-insert:disabled {
                background: #586e75;
                color: #839496;
                cursor: not-allowed;
            }

            .chatbot-roam-hidden-input {
                display: none;
            }

            /* Busqueda incremental */
            .chatbot-roam-search-section {
                background: #073642;
                border: 1px solid #586e75;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 16px;
            }

            .chatbot-roam-search-row {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .chatbot-roam-search-input {
                flex: 1;
                background: #002b36;
                border: 1px solid #586e75;
                border-radius: 4px;
                padding: 8px 12px;
                color: #93a1a1;
                font-size: 13px;
            }

            .chatbot-roam-search-input:focus {
                outline: none;
                border-color: #2aa198;
            }

            .chatbot-roam-search-input::placeholder {
                color: #586e75;
            }

            .chatbot-roam-search-nav {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .chatbot-roam-search-btn {
                background: transparent;
                border: 1px solid #586e75;
                color: #93a1a1;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s;
            }

            .chatbot-roam-search-btn:hover:not(:disabled) {
                background: #2aa198;
                color: #002b36;
                border-color: #2aa198;
            }

            .chatbot-roam-search-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .chatbot-roam-search-count {
                color: #657b83;
                font-size: 12px;
                min-width: 40px;
                text-align: center;
            }

            .chatbot-roam-cut-btn {
                background: #b58900;
                border: none;
                color: #002b36;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
            }

            .chatbot-roam-cut-btn:hover {
                background: #d4a000;
            }

            .chatbot-roam-cut-btn:disabled {
                background: #586e75;
                color: #839496;
                cursor: not-allowed;
            }

            .chatbot-roam-cut-indicator {
                color: #2aa198;
                font-size: 12px;
                margin-left: 8px;
            }

            /* Preview con highlights */
            .chatbot-roam-preview mark {
                background: rgba(181, 137, 0, 0.35);
                color: inherit;
                padding: 1px 2px;
                border-radius: 2px;
            }

            .chatbot-roam-preview mark.current {
                background: #b58900;
                color: #002b36;
            }

            /* Editor de clasificación manual v2 */
            .chatbot-roam-editor-panel {
                background: rgba(203, 75, 22, 0.08);
                border: 1px solid #cb4b16;
                border-radius: 6px;
                padding: 16px;
                margin-top: 16px;
            }

            .chatbot-roam-editor-header {
                margin-bottom: 12px;
            }

            .chatbot-roam-editor-title {
                display: block;
                color: #cb4b16;
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
            }

            .chatbot-roam-editor-subtitle {
                color: #657b83;
                font-size: 12px;
            }

            .chatbot-roam-editor-stats {
                color: #93a1a1;
                font-size: 11px;
                margin-bottom: 10px;
                padding: 6px 10px;
                background: rgba(0, 0, 0, 0.15);
                border-radius: 4px;
            }

            .chatbot-roam-editor-list {
                max-height: 400px;
                overflow-y: auto;
            }

            .chatbot-roam-editor-item {
                display: flex;
                flex-direction: column;
                padding: 8px 12px;
                margin-bottom: 6px;
                border-radius: 4px;
                border-left: 4px solid;
                position: relative;
            }

            .chatbot-roam-editor-item.prompt {
                background: rgba(38, 139, 210, 0.12);
                border-left-color: #268bd2;
            }

            .chatbot-roam-editor-item.response {
                background: rgba(42, 161, 152, 0.12);
                border-left-color: #2aa198;
            }

            .chatbot-roam-editor-item.modified {
                box-shadow: 0 0 8px rgba(203, 75, 22, 0.4);
            }

            .chatbot-roam-editor-item-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
            }

            .chatbot-roam-editor-num {
                color: #586e75;
                font-size: 11px;
                font-weight: 600;
            }

            .chatbot-roam-editor-icon {
                font-size: 12px;
            }

            .chatbot-roam-editor-tipo {
                font-weight: 600;
                font-size: 11px;
            }

            .chatbot-roam-editor-item.prompt .chatbot-roam-editor-tipo {
                color: #268bd2;
            }

            .chatbot-roam-editor-item.response .chatbot-roam-editor-tipo {
                color: #2aa198;
            }

            .chatbot-roam-editor-mcp {
                background: #cb4b16;
                color: white;
                font-size: 9px;
                padding: 2px 5px;
                border-radius: 3px;
                font-weight: 600;
            }

            .chatbot-roam-editor-line {
                color: #586e75;
                font-size: 10px;
                margin-left: auto;
            }

            .chatbot-roam-editor-extracto {
                color: #839496;
                font-size: 11px;
                font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding-right: 70px;
            }

            .chatbot-roam-editor-buttons {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                gap: 4px;
            }

            .chatbot-roam-editor-swap-btn,
            .chatbot-roam-editor-chain-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid #586e75;
                color: #93a1a1;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s;
            }

            .chatbot-roam-editor-swap-btn:hover {
                background: #cb4b16;
                border-color: #cb4b16;
                color: white;
            }

            .chatbot-roam-editor-chain-btn {
                font-size: 11px;
                background: rgba(203, 75, 22, 0.15);
                border-color: #cb4b16;
                color: #cb4b16;
            }

            .chatbot-roam-editor-chain-btn:hover {
                background: #cb4b16;
                border-color: #cb4b16;
                color: white;
            }

            .chatbot-roam-editor-actions {
                display: flex;
                gap: 10px;
                margin-top: 12px;
                justify-content: flex-end;
            }

            .chatbot-roam-editor-btn-continue {
                background: #2aa198;
                border: none;
                color: #002b36;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
            }

            .chatbot-roam-editor-btn-continue:hover {
                background: #3dc9b9;
            }

            .chatbot-roam-editor-btn-skip {
                background: transparent;
                border: 1px solid #586e75;
                color: #93a1a1;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }

            .chatbot-roam-editor-btn-skip:hover {
                border-color: #839496;
                color: #eee8d5;
            }

            .chatbot-roam-editor-btn-restore {
                background: transparent;
                border: 1px solid #cb4b16;
                color: #cb4b16;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }

            .chatbot-roam-editor-btn-restore:hover:not(:disabled) {
                background: #cb4b16;
                color: white;
            }

            .chatbot-roam-editor-btn-restore:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
        `;
    }
};


// --- roam\parser.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM PARSER
// Converts lines into hierarchical block structure for Roam
// ============================================================================

const ChatbotRoamParser = {
    /**
     * Convierte lineas en estructura jerarquica de bloques
     * Maneja bloques de codigo marcados con [CODE]
     * Maneja tablas Roam con anidacion profunda
     * Soporta multiples niveles: prompt -> respuesta/heading/tabla -> contenido
     */
    parseToBlockStructure(lineas) {
        var result = [];
        var currentPrompt = null;
        var currentHeading = null;  // Track del heading actual para anidar contenido

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (!linea || !linea.trim()) continue;

            // Detectar prompts (nivel 0, empiezan con "* ")
            if (linea.startsWith('* ')) {
                if (currentPrompt) {
                    result.push(currentPrompt);
                }
                currentPrompt = {
                    text: linea.substring(2).trim(),
                    children: []
                };
                currentHeading = null;  // Reset heading al cambiar de prompt
                continue;
            }

            // ================================================================
            // NUEVO: Detectar tabla Roam y procesar estructura completa
            // ================================================================
            if (linea.trim() === '{{[[table]]}}' && currentPrompt) {
                // Recolectar todas las líneas hijas de la tabla
                var tablaLineas = [];
                var j = i + 1;
                while (j < lineas.length && lineas[j].match(/^\s+- /)) {
                    tablaLineas.push(lineas[j]);
                    j++;
                }

                // Construir estructura jerárquica de la tabla
                var bloqueTabla = {
                    text: '{{[[table]]}}',
                    children: this._parseIndentedBlocks(tablaLineas, 8)
                };

                currentPrompt.children.push(bloqueTabla);
                currentHeading = null;  // Reset heading después de tabla
                i = j - 1;  // Saltar las líneas procesadas
                continue;
            }

            // Detectar contenido bajo heading (8 espacios de indentacion)
            if (linea.startsWith('        ') && currentPrompt && currentHeading) {
                var texto = linea.substring(8);

                // Detectar bloque de codigo combinado
                if (texto.startsWith('[CODE]')) {
                    var codigo = texto.substring(6);
                    codigo = codigo.replace(/\{\{NL\}\}/g, '\n');
                    if (codigo) {
                        currentHeading.children.push({
                            text: codigo,
                            children: []
                        });
                    }
                    continue;
                }

                // Linea normal bajo heading - quitar "* " si es un bullet
                var textoLimpio = texto.startsWith('* ') ? texto.substring(2) : texto;
                if (textoLimpio.trim()) {
                    currentHeading.children.push({
                        text: textoLimpio.trim(),
                        children: []
                    });
                }
                continue;
            }

            // Detectar respuestas nivel 1 (indentadas 4 espacios)
            if (linea.startsWith('    ') && currentPrompt) {
                var texto = linea.substring(4);

                // Detectar bloque de codigo combinado
                if (texto.startsWith('[CODE]')) {
                    // Extraer codigo sin el marcador y restaurar los \n
                    var codigo = texto.substring(6);
                    // Restaurar los newlines: {{NL}} -> \n
                    codigo = codigo.replace(/\{\{NL\}\}/g, '\n');
                    if (codigo) {
                        var bloqueCode = {
                            text: codigo,
                            children: []
                        };
                        // Si hay heading activo, agregar como hijo del heading
                        if (currentHeading) {
                            currentHeading.children.push(bloqueCode);
                        } else {
                            currentPrompt.children.push(bloqueCode);
                        }
                    }
                    continue;
                }

                // Linea normal - quitar "* " si es un bullet
                var textoLimpio = texto.startsWith('* ') ? texto.substring(2) : texto;

                // Detectar si es un heading markdown
                var esHeading = textoLimpio.trim().startsWith('#');

                if (textoLimpio.trim()) {
                    var nuevoBloque = {
                        text: textoLimpio.trim(),
                        children: []
                    };
                    currentPrompt.children.push(nuevoBloque);

                    // Si es heading, marcarlo como el heading actual para anidar contenido
                    if (esHeading) {
                        currentHeading = nuevoBloque;
                    } else {
                        // Si no es heading, resetear para que el contenido no se anide
                        currentHeading = null;
                    }
                }
            }
        }

        // Agregar ultimo prompt
        if (currentPrompt) {
            result.push(currentPrompt);
        }

        return result;
    },

    /**
     * Convierte líneas indentadas en estructura anidada de bloques
     * Usado para parsear tablas Roam y otros contenidos con anidación profunda
     * 
     * @param {string[]} lineas - Líneas con formato "    - texto"
     * @param {number} baseIndent - Nivel base de indentación (espacios)
     * @returns {Object[]} - Estructura de bloques anidados
     */
    _parseIndentedBlocks(lineas, baseIndent) {
        if (lineas.length === 0) return [];

        var result = [];
        var stack = [{ indent: baseIndent - 4, children: result }];  // Nivel virtual padre

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];

            // Contar espacios de indentación
            var indent = 0;
            while (indent < linea.length && linea[indent] === ' ') indent++;

            // Extraer texto (quitar "- " al inicio)
            var texto = linea.substring(indent).replace(/^- /, '').trim();
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


// --- roam\inserter.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM INSERTER
// Handles block insertion into Roam using the Roam Alpha API
// Includes rollback capability for error recovery
// ============================================================================

const ChatbotRoamInserter = {
    // Configuración de batching mejorada usando batch.actions
    // Lotes más grandes reducen peticiones, delay pequeño evita congelar UI
    BATCH_SIZE: 50,
    BATCH_DELAY_MS: 50,

    // Flag para detectar disponibilidad del batch API (se evalúa una sola vez)
    _batchApiChecked: false,
    _hasBatchApi: false,

    /**
     * Detecta si la batch API está disponible (una sola vez, cachea resultado)
     * @returns {boolean}
     * @private
     */
    _checkBatchApi() {
        if (!this._batchApiChecked) {
            try {
                this._hasBatchApi = !!(window.roamAlphaAPI &&
                    window.roamAlphaAPI.data &&
                    window.roamAlphaAPI.data.batch &&
                    typeof window.roamAlphaAPI.data.batch.actions === 'function');
            } catch (e) {
                this._hasBatchApi = false;
            }
            this._batchApiChecked = true;
            if (!this._hasBatchApi) {
                console.warn('ChatbotRoamInserter: batch API no disponible, usando fallback individual (más lento).');
            }
        }
        return this._hasBatchApi;
    },

    /**
     * Ejecuta un lote de acciones, con fallback a ejecución individual
     * @param {Array} actions - Array de acciones batch
     * @returns {Promise<void>}
     * @private
     */
    async _executeBatch(actions) {
        if (this._checkBatchApi()) {
            try {
                await window.roamAlphaAPI.data.batch.actions({
                    action: "batch-actions",
                    actions: actions
                });
                return; // Batch exitoso, salir
            } catch (batchError) {
                // Batch API falló en runtime — invalidar cache y usar fallback
                console.warn('ChatbotRoamInserter: batch.actions falló en runtime, cambiando a fallback individual.', batchError);
                this._hasBatchApi = false;
                this._batchApiChecked = true;
            }
        }
        // Fallback: ejecutar cada acción individualmente
        for (const action of actions) {
            if (action.action === 'create-block') {
                await window.roamAlphaAPI.createBlock({
                    location: action.location,
                    block: action.block
                });
            } else if (action.action === 'delete-block') {
                await window.roamAlphaAPI.deleteBlock({
                    block: action.block
                });
            }
        }
    },

    /**
     * Elimina bloques por sus UIDs (para rollback en caso de error)
     * Utiliza batch.actions para velocidad
     * @param {Array<string>} uids - Array de UIDs a eliminar
     * @returns {Promise<number>} - Numero de bloques eliminados exitosamente
     * @private
     */
    async _rollbackBlocks(uids) {
        let deleted = 0;
        console.warn('Rollback: Iniciando eliminacion de ' + uids.length + ' bloques...');

        // Eliminar en orden inverso (de abajo hacia arriba)
        for (let i = uids.length; i > 0; i -= this.BATCH_SIZE) {
            const start = Math.max(0, i - this.BATCH_SIZE);
            const batchUids = uids.slice(start, i).reverse();

            const actions = batchUids.map(uid => ({
                action: "delete-block",
                block: { uid: uid }
            }));

            try {
                await this._executeBatch(actions);
                deleted += actions.length;
            } catch (e) {
                console.warn('Rollback: No se pudo eliminar el lote de bloques', e);
            }
            // Yield UI
            if (start > 0) {
                await this._delay(this.BATCH_DELAY_MS);
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
    _flattenBlocks(parentUid, bloques, startOrder) {
        let actions = [];
        for (let i = 0; i < bloques.length; i++) {
            const bloque = bloques[i];
            const blockUid = window.roamAlphaAPI.util.generateUID();

            let texto = bloque.text;
            let headingLevel = 0;

            if (texto.startsWith('### ')) {
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
                const childActions = this._flattenBlocks(blockUid, bloque.children, 0);
                actions = actions.concat(childActions);
            }
        }
        return actions;
    },

    /**
     * Inserta bloques recursivamente en Roam con soporte de rollback, batching y cancelacion
     * Si ocurre un error o se cancela, automaticamente elimina los bloques ya insertados
     * 
     * @param {string} parentUid - UID del bloque padre
     * @param {Array} bloques - Array de bloques a insertar
     * @param {number} startOrder - Orden inicial para los bloques
     * @param {Object} cancelToken - Objeto { cancelled: boolean } compartido con UI
     * @param {Function} onProgress - Callback opcional (insertedCount, total) => void
     * @returns {Promise<Object>} - { success, insertedBlocks, insertedCount, error, rolledBackCount }
     */
    async insertBlocksRecursively(parentUid, bloques, startOrder, cancelToken, onProgress) {
        const actions = this._flattenBlocks(parentUid, bloques, startOrder);
        const totalOpsEstimate = actions.length;
        const allInsertedUids = [];

        try {
            for (let i = 0; i < actions.length; i += this.BATCH_SIZE) {
                if (cancelToken && cancelToken.cancelled) {
                    throw new Error('OPERACION_CANCELADA_POR_USUARIO');
                }

                const batchActions = actions.slice(i, i + this.BATCH_SIZE);

                await this._executeBatch(batchActions);

                const batchUids = batchActions.map(a => a.block.uid);
                allInsertedUids.push(...batchUids);

                if (onProgress) {
                    onProgress(allInsertedUids.length, totalOpsEstimate);
                }

                // Pausa para liberar el hilo de UI
                if (i + this.BATCH_SIZE < actions.length) {
                    await this._delay(this.BATCH_DELAY_MS);
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
            '<button class="chatbot-roam-preset-btn" data-preset="chatgpt">ChatGPT</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="gemini">Gemini</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="antigravity">Antigravity</button>' +
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
        searchInput.addEventListener('input', (e) => this._performSearch(e.target.value));

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

        // Verificar marcadores de conversacion (incluye Antigravity y NotebookLM)
        // NotebookLM uses Chinese: 🧑 用户 (user) and 🤖 助手 (assistant)
        const tienePrompt = content.includes('## Prompt:') ||
            content.includes('### User Input') ||
            (ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR && content.includes(ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR));
        const tieneResponse = content.includes('## Response:') ||
            content.includes('### Planner Response') ||
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
            warning = 'Advertencia: No se encontraron marcadores "## Prompt:"';
        } else if (!tieneResponse) {
            warning = 'Advertencia: No se encontraron marcadores "## Response:"';
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

            // Guardar intencion del usuario sobre la revision manual
            const intencionRevisar = this._currentOpciones['revisar_clasificacion'];

            // Detectar tipo de chatbot y aplicar preset (usa todo el bloque de texto)
            const tipo = ChatbotRoamProcessing.detectarTipoChatbot(this._fileContent);
            this._applyPreset(tipo);

            // Restaurar intencion de revisar si estaba activa
            if (intencionRevisar) {
                this._currentOpciones['revisar_clasificacion'] = true;
                const chk = this._modalContainer.querySelector('[data-option="revisar_clasificacion"]');
                if (chk) chk.checked = true;
            }

            // Actualizar dropzone visual final
            dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = 'OK';
            
            let namesText = filesArray.length > 1 ? filesArray.length + ' archivos' : filesArray[0].name;
            let statusText = '<span style="color: #4CAF50;">Cargados (' + (totalSize / 1024).toFixed(1) + ' KB)</span>';
            
            if (warnings.length > 0) {
                statusText += '<br><span style="color: #FFA500; font-size: 11px;">Advertencias: ' + warnings.length + '</span>';
            }

            dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML =
                '<strong>' + namesText + '</strong><br>' + statusText;

            // Redirigir dependiendo de la revision
            const revisarManual = this._currentOpciones['revisar_clasificacion'];
            if (revisarManual) {
                this._mostrarEditorClasificacion();
            } else {
                this._processAndPreview();
            }
        }).catch(err => {
            this._showDropzoneError('Error fatal: ' + err);
        });
    },

    // ========================================================================
    // EDITOR DE CLASIFICACIÓN MANUAL (v2)
    // ========================================================================

    // Estado del editor
    _todosLosBloques: [],
    _originalFileContent: null,
    _bloquesModificados: new Set(),

    /**
     * Muestra el editor de clasificación con todos los bloques
     */
    _mostrarEditorClasificacion() {
        // Guardar contenido original para posible restauración
        this._originalFileContent = this._fileContent;
        this._bloquesModificados = new Set();

        // Extraer todos los bloques
        this._todosLosBloques = ChatbotRoamProcessing.extraerTodosLosBloques(this._fileContent);

        // Remover panel anterior si existe
        const existente = this._modalContainer.querySelector('.chatbot-roam-editor-panel');
        if (existente) existente.remove();

        const panel = document.createElement('div');
        panel.className = 'chatbot-roam-editor-panel';

        // Generar HTML de items
        const itemsHTML = this._todosLosBloques.map((bloque, idx) => {
            const tipoClass = bloque.tipo === 'Prompt' ? 'prompt' : 'response';
            const tipoIcon = bloque.tipo === 'Prompt' ? '🔵' : '🟢';
            const mcpBadge = bloque.tieneMCP ? '<span class="chatbot-roam-editor-mcp">MCP</span>' : '';
            const extractoCorto = bloque.extracto.substring(0, 70) + (bloque.extracto.length > 70 ? '...' : '');

            return `
                <div class="chatbot-roam-editor-item ${tipoClass}" data-idx="${idx}">
                    <div class="chatbot-roam-editor-item-header">
                        <span class="chatbot-roam-editor-num">[${idx + 1}]</span>
                        <span class="chatbot-roam-editor-icon">${tipoIcon}</span>
                        <span class="chatbot-roam-editor-tipo">${bloque.tipo.toUpperCase()}</span>
                        ${mcpBadge}
                        <span class="chatbot-roam-editor-line">Línea ${bloque.lineNumber}</span>
                    </div>
                    <div class="chatbot-roam-editor-extracto">${this._escapeHtml(extractoCorto)}</div>
                    <div class="chatbot-roam-editor-buttons">
                        <button class="chatbot-roam-editor-swap-btn" data-action="swap" data-idx="${idx}" title="Intercambiar este bloque">⇄</button>
                        <button class="chatbot-roam-editor-chain-btn" data-action="chain" data-idx="${idx}" title="Invertir desde aquí hasta el final">↓↓</button>
                    </div>
                </div>
            `;
        }).join('');

        panel.innerHTML = `
            <div class="chatbot-roam-editor-header">
                <span class="chatbot-roam-editor-title">⚠️ REVISIÓN DE CLASIFICACIÓN</span>
                <span class="chatbot-roam-editor-subtitle">Verifica que cada bloque esté correctamente clasificado como Prompt o Response.</span>
            </div>
            <div class="chatbot-roam-editor-stats">
                Total: ${this._todosLosBloques.length} bloques | 
                <span data-element="modified-count">Modificados: 0</span>
            </div>
            <div class="chatbot-roam-editor-list">
                ${itemsHTML}
            </div>
            <div class="chatbot-roam-editor-actions">
                <button class="chatbot-roam-editor-btn-continue" data-action="continue-editor">
                    Continuar con procesamiento
                </button>
                <button class="chatbot-roam-editor-btn-skip" data-action="skip-editor">
                    Omitir revisión
                </button>
                <button class="chatbot-roam-editor-btn-restore" data-action="restore-editor" disabled>
                    Restaurar original
                </button>
            </div>
        `;

        // Insertar después del dropzone
        const dropzone = this._modalContainer.querySelector('[data-action="dropzone"]');
        dropzone.parentNode.insertBefore(panel, dropzone.nextSibling);

        // Event listeners
        panel.querySelectorAll('[data-action="swap"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                this._intercambiarClasificacion(idx);
            });
        });

        panel.querySelectorAll('[data-action="chain"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                this._invertirDesdeAqui(idx);
            });
        });

        panel.querySelector('[data-action="continue-editor"]').addEventListener('click', () => {
            panel.remove();
            this._processAndPreview();
        });

        panel.querySelector('[data-action="skip-editor"]').addEventListener('click', () => {
            panel.remove();
            this._processAndPreview();
        });

        panel.querySelector('[data-action="restore-editor"]').addEventListener('click', () => {
            this._restaurarOriginal();
        });
    },

    /**
     * Intercambia la clasificación de un bloque (Prompt ↔ Response)
     */
    _intercambiarClasificacion(idx) {
        if (idx < 0 || idx >= this._todosLosBloques.length) return;

        const bloque = this._todosLosBloques[idx];
        const nuevoTipo = bloque.tipo === 'Prompt' ? 'Response' : 'Prompt';
        const marcadorViejo = `## ${bloque.tipo}:`;
        const marcadorNuevo = `## ${nuevoTipo}:`;
        const diffLen = marcadorNuevo.length - marcadorViejo.length; // +1 o -1

        // Reemplazar en el contenido
        const antes = this._fileContent.substring(0, bloque.pos);
        const despues = this._fileContent.substring(bloque.pos + marcadorViejo.length);
        this._fileContent = antes + marcadorNuevo + despues;

        // Actualizar posiciones de bloques posteriores
        for (let i = idx + 1; i < this._todosLosBloques.length; i++) {
            this._todosLosBloques[i].pos += diffLen;
        }

        // Actualizar tipo del bloque
        bloque.tipo = nuevoTipo;

        // Marcar como modificado
        if (this._bloquesModificados.has(idx)) {
            this._bloquesModificados.delete(idx); // Si se intercambia de nuevo, vuelve al original
        } else {
            this._bloquesModificados.add(idx);
        }

        // Actualizar UI del item
        this._actualizarItemEditor(idx);

        // Actualizar contador
        const countSpan = this._modalContainer.querySelector('[data-element="modified-count"]');
        if (countSpan) {
            countSpan.textContent = `Modificados: ${this._bloquesModificados.size}`;
        }

        // Habilitar botón restaurar si hay modificaciones
        const restoreBtn = this._modalContainer.querySelector('[data-action="restore-editor"]');
        if (restoreBtn) {
            restoreBtn.disabled = this._bloquesModificados.size === 0;
        }
    },

    /**
     * Actualiza visualmente un item del editor después de intercambiar
     */
    _actualizarItemEditor(idx) {
        const item = this._modalContainer.querySelector(`.chatbot-roam-editor-item[data-idx="${idx}"]`);
        if (!item) return;

        const bloque = this._todosLosBloques[idx];
        const tipoClass = bloque.tipo === 'Prompt' ? 'prompt' : 'response';
        const tipoIcon = bloque.tipo === 'Prompt' ? '🔵' : '🟢';

        // Actualizar clases
        item.classList.remove('prompt', 'response');
        item.classList.add(tipoClass);

        // Marcar como modificado visualmente
        if (this._bloquesModificados.has(idx)) {
            item.classList.add('modified');
        } else {
            item.classList.remove('modified');
        }

        // Actualizar icono y texto
        item.querySelector('.chatbot-roam-editor-icon').textContent = tipoIcon;
        item.querySelector('.chatbot-roam-editor-tipo').textContent = bloque.tipo.toUpperCase();
    },

    /**
     * Restaura el contenido original antes de las modificaciones
     */
    _restaurarOriginal() {
        if (!this._originalFileContent) return;

        this._fileContent = this._originalFileContent;
        this._bloquesModificados.clear();

        // Re-renderizar el editor
        this._mostrarEditorClasificacion();
    },

    /**
     * Invierte todos los bloques desde idx hasta el final (para corregir errores en cadena)
     */
    _invertirDesdeAqui(idx) {
        const restantes = this._todosLosBloques.length - idx;

        if (!confirm(`¿Invertir ${restantes} bloques desde aquí hasta el final?`)) {
            return;
        }

        // Procesar en orden DESCENDENTE para no corromper posiciones
        for (let i = this._todosLosBloques.length - 1; i >= idx; i--) {
            this._intercambiarClasificacion(i);
        }
    },

    // ========================================================================
    // OPTIONS MANAGEMENT
    // ========================================================================
    _applyPreset(preset) {
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

        // Limpiar editor de clasificación si existe (los presets siempre lo desactivan)
        const editorPanel = this._modalContainer.querySelector('.chatbot-roam-editor-panel');
        if (editorPanel) editorPanel.remove();

        // Update checkboxes
        this._modalContainer.querySelectorAll('[data-option]').forEach(checkbox => {
            const option = checkbox.dataset.option;
            checkbox.checked = this._currentOpciones[option] || false;
        });

        if (this._fileContent) {
            this._processAndPreview();
        }
    },

    _updateOpciones() {
        this._modalContainer.querySelectorAll('[data-option]').forEach(checkbox => {
            this._currentOpciones[checkbox.dataset.option] = checkbox.checked;
        });

        if (this._fileContent) {
            const revisarActivo = this._currentOpciones['revisar_clasificacion'];
            const editorExiste = !!this._modalContainer.querySelector('.chatbot-roam-editor-panel');

            if (revisarActivo && !editorExiste) {
                // Usuario acaba de marcar la opción → mostrar editor
                this._mostrarEditorClasificacion();
                return;
            }

            if (!revisarActivo && editorExiste) {
                // Usuario desmarcó → quitar editor y re-procesar
                this._modalContainer.querySelector('.chatbot-roam-editor-panel').remove();
            }

            this._processAndPreview();
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
            // Dar tiempo al UI para renderizar el mensaje de carga
            await new Promise(resolve => setTimeout(resolve, 50));

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
            // Mostrar contenido completo para poder buscar
            preview.textContent = content;
            const countInfo = numIntercambios !== undefined ? `${numIntercambios} intercambios · ` : '';
            previewInfo.textContent = `${countInfo}${content.length.toLocaleString()} caracteres totales`;
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

        this._currentMatchIndex += direction;
        if (this._currentMatchIndex < 0) {
            this._currentMatchIndex = this._searchMatches.length - 1;
        } else if (this._currentMatchIndex >= this._searchMatches.length) {
            this._currentMatchIndex = 0;
        }

        this._renderPreviewWithHighlights();
        this._scrollToCurrentMatch();
    },

    _renderPreviewWithHighlights() {
        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        const content = this._isCut ? this._processedContent : this._originalProcessedContent;

        if (!content) {
            preview.innerHTML = '<span style="color: #666;">Arrastra archivos para ver la vista previa...</span>';
            this._updateSearchButtons();
            return;
        }

        if (this._searchMatches.length === 0) {
            preview.textContent = content;
            this._updateSearchButtons();
            return;
        }

        // Crear HTML con highlights
        let html = '';
        let lastEnd = 0;

        for (let i = 0; i < this._searchMatches.length; i++) {
            const match = this._searchMatches[i];
            // Texto antes del match
            html += this._escapeHtml(content.substring(lastEnd, match.start));
            // Match con highlight
            const isCurrent = i === this._currentMatchIndex;
            const markClass = isCurrent ? 'current' : '';
            const markId = isCurrent ? 'id="current-match"' : '';
            html += `<mark class="${markClass}" ${markId}>${this._escapeHtml(content.substring(match.start, match.end))}</mark>`;
            lastEnd = match.end;
        }
        // Texto después del último match
        html += this._escapeHtml(content.substring(lastEnd));

        preview.innerHTML = html;
        this._updateSearchButtons();
    },

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    _scrollToCurrentMatch() {
        const currentMark = this._modalContainer.querySelector('#current-match');
        if (currentMark) {
            currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            countSpan.textContent = `${this._currentMatchIndex + 1}/${this._searchMatches.length}`;
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
        const lines = this._processedContent.split('\n');
        let numIntercambios = 0;
        for (const line of lines) {
            if (line.startsWith('* ')) numIntercambios++;
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
                currentFileBlock = { text: `**${bloque.text}**`, children: [] };
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
            insertBtn.textContent = `Insertando... (${percent}%)`;
        });

        // Limpiar token
        this._activeCancelToken = null;

        if (result.success) {
            // Cerrar modal tras exito
            this.closeModal();

            // Notificar al usuario (podriamos usar un toast de Roam si existiera API publica, por ahora alert o nada)
            console.log(`Chatbot Roam Plugin: ${result.insertedCount} bloques insertados correctamente.`);
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
            this._savedBlockUid = null;
        }
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
    VERSION: "1.4.1",

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

        console.log('Chatbot Roam Plugin v1.4.1 loaded');
        console.log('   Usa Ctrl+Shift+I o busca "Importar Conversacion" en el command palette.');
    }
};

// Auto-inicializar
ChatbotRoamPlugin.init();

