// CHATBOT ROAM PLUGIN v1.3.2
// Importador de conversaciones de chatbots (Claude, ChatGPT, Gemini) a Roam
// Uso: Ctrl+Shift+I o Command Palette
// Generated: 2026-01-18 13:33:37

// --- patterns.js ---
// CHATBOT ROAM PLUGIN - PATTERNS
// Regex patterns ported from Python chatbotRoam/patterns.py
// NOTE: Using RegExp constructor to avoid backtick issues in Roam

// Helper: backtick constants (char code 96)
const BT3 = String.fromCharCode(96, 96, 96);
const BT4 = String.fromCharCode(96, 96, 96, 96);

const ChatbotRoamPatterns = {
    // Version info
    VERSION: "1.3.3",

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

    // DETECCION DE TIPO DE CHATBOT
    DETECT_ANTIGRAVITY: /^### (?:User Input|Planner Response)$/m,
    DETECT_CLAUDE_TOOLS: /\*\*\w+\*\*\s*\*Request\*/,
    DETECT_GEMINI_THINKING: /^>\s*Thinking:/m,

    // Helper getters for backtick strings
    get BT3() { return BT3; },
    get BT4() { return BT4; }
};


// --- cleaners.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - CLEANERS
// Cleaning functions ported from Python chatbotRoam/cleaners.py
// ============================================================================

const ChatbotRoamCleaners = {
    // ========================================================================
    // FUNCIONES DE LIMPIEZA GENÃ‰RICAS
    // ========================================================================

    /**
     * Elimina las lÃ­neas de Markdown que contienen imÃ¡genes Base64.
     */
    eliminarImagenesEmbedidas(texto) {
        // PatrÃ³n 1: ImÃ¡genes completas con parÃ©ntesis de cierre
        texto = texto.replace(ChatbotRoamPatterns.IMAGEN_COMPLETA, '');

        // PatrÃ³n 2: ImÃ¡genes truncadas
        texto = texto.replace(ChatbotRoamPatterns.IMAGEN_TRUNCADA, '');

        // PatrÃ³n 3: Limpiar lÃ­neas que solo contienen restos de Base64
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
     * Limpia lÃ­neas vacÃ­as excesivas y espacios al inicio/fin.
     */
    limpiarContenido(texto) {
        texto = texto.replace(ChatbotRoamPatterns.LINEAS_VACIAS_EXCESIVAS, '\n\n');
        return texto.trim();
    },

    /**
     * Limpia etiquetas de lenguaje de bloques de cÃ³digo pero PRESERVA los delimitadores.
     */
    limpiarFormatoMarkdownBasico(texto) {
        texto = texto.replace(ChatbotRoamPatterns.CODIGO_CUATRO_BACKTICKS, ChatbotRoamPatterns.BT4);
        texto = texto.replace(ChatbotRoamPatterns.CODIGO_TRES_BACKTICKS, ChatbotRoamPatterns.BT3);
        return texto;
    },

    // ========================================================================
    // LIMPIEZA GENÃ‰RICA / CHATGPT
    // ========================================================================

    /**
     * Elimina los logs de herramientas de bÃºsqueda como 'project_knowledge_search'.
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
     * Elimina lÃ­neas de metadata como fechas y '> File:'.
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
        // PatrÃ³n completo
        texto = texto.replace(ChatbotRoamPatterns.TOOL_CALLS_COMPLETO, '');
        // PatrÃ³n simple
        texto = texto.replace(ChatbotRoamPatterns.TOOL_CALLS_SIMPLE, '');
        return texto;
    },

    /**
     * Elimina lÃ­neas que comienzan con 'Thought:'.
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
     * Elimina metadata especÃ­fica de Claude.
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
     * Elimina bloques de 'Thinking:' especÃ­ficos de Gemini.
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
     * Elimina el sÃ­mbolo '>' de lÃ­neas de adjuntos de Gemini.
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
     * Elimina metadata especÃ­fica de Gemini.
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
    // CONVERSIÃ“N DE TABLAS MARKDOWN A ROAM
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

            // Detectar posible inicio de tabla (lÃ­nea que empieza y termina con |)
            if (this._esLineaTablaMarkdown(lineaStripped)) {
                // Verificar si la siguiente lÃ­nea es un separador de tabla
                const siguienteLinea = i + 1 < lineas.length ? lineas[i + 1].trim() : '';

                if (this._esSeparadorTabla(siguienteLinea)) {
                    // Es una tabla vÃ¡lida - extraer todas las lÃ­neas de la tabla
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

                    i = j; // Saltar las lÃ­neas procesadas
                    continue;
                }
            }

            // No es una tabla - mantener la lÃ­nea original
            resultado.push(linea);
            i++;
        }

        return resultado.join('\n');
    },

    /**
     * Detecta si una lÃ­nea es parte de una tabla Markdown (empieza y termina con |)
     * @private
     */
    _esLineaTablaMarkdown(lineaStripped) {
        return lineaStripped.startsWith('|') && lineaStripped.endsWith('|') && lineaStripped.length > 2;
    },

    /**
     * Detecta si una lÃ­nea es un separador de tabla Markdown (|---|---|)
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
     * Extrae las celdas de una lÃ­nea de tabla Markdown
     * @private
     */
    _extraerCeldasTabla(lineaStripped) {
        // Quitar pipes inicial y final, luego split por |
        const sinPipes = lineaStripped.slice(1, -1);
        return sinPipes.split('|').map(celda => celda.trim());
    },

    /**
     * Convierte un array de lÃ­neas de tabla Markdown a formato Roam
     * @private
     */
    _convertirTablaARoam(tablaLineas) {
        if (tablaLineas.length === 0) return [];

        const resultado = [];
        const INDENT = '    '; // 4 espacios por nivel

        // Primera lÃ­nea: marcador de tabla Roam
        resultado.push('{{[[table]]}}');

        // Procesar cada fila (la primera es headers, las demÃ¡s son datos)
        for (const linea of tablaLineas) {
            const celdas = this._extraerCeldasTabla(linea);

            if (celdas.length === 0) continue;

            // Generar la estructura anidada para esta fila
            // Cada columna se anida un nivel mÃ¡s profundo
            for (let col = 0; col < celdas.length; col++) {
                const indent = INDENT.repeat(col + 1); // +1 porque el primer nivel es hijo de {{[[table]]}}
                const celda = celdas[col] || ''; // Celda vacÃ­a si no hay contenido
                resultado.push(indent + '- ' + celda);
            }
        }

        return resultado;
    }
};


// --- opciones-limpieza.js ---
// ============================================================================
// CHATBOT ROAM PLUGIN - OPCIONES DE LIMPIEZA
// Registro centralizado de todas las opciones de limpieza
// ============================================================================

/**
 * DefiniciÃ³n centralizada de opciones de limpieza.
 * Para aÃ±adir una nueva opciÃ³n:
 * 1. Agregar un objeto a este array
 * 2. Ejecutar build.ps1
 * 3. Listo - el UI y la lÃ³gica lo detectan automÃ¡ticamente
 */
const OPCIONES_LIMPIEZA = [
    // ========================================================================
    // OPCIONES GENÃ‰RICAS (todos los chatbots)
    // ========================================================================
    {
        id: 'eliminar_imagenes',
        label: 'Imagenes Base64',
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity'],
        defaultActivo: true,
        aplicarA: 'ambos',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarImagenesEmbedidas(texto); }
    },
    {
        id: 'eliminar_metadata',
        label: 'Timestamps y referencias',
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity'],
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
        label: 'Logs de busqueda',
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
        aplicarA: 'preproceso',  // Se aplica ANTES de extraer conversaciÃ³n
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
    // CONVERSIÃ“N DE FORMATO
    // ========================================================================
    {
        id: 'convertir_tablas_roam',
        label: 'Convertir tablas a Roam',
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity'],
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
            // DETECCIÃ“N DE TABLA ROAM
            // ================================================================
            if (lineaStripped === '{{[[table]]}}') {
                enTablaRoam = true;
                var indentTabla = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                resultado.push(indentTabla + lineaStripped);
                continue;
            }

            // Si estamos dentro de una tabla Roam
            if (enTablaRoam) {
                // LÃ­nea vacÃ­a = fin de tabla
                if (!lineaStripped) {
                    enTablaRoam = false;
                    resultado.push('');
                    continue;
                }

                // LÃ­nea de tabla (tiene indentaciÃ³n y empieza con "- ")
                if (linea.match(/^\s+- /)) {
                    var indentTabla = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                    // Preservar la indentaciÃ³n original de la lÃ­nea de tabla
                    resultado.push(indentTabla + linea);
                    continue;
                } else {
                    // LÃ­nea que no es parte de tabla = salir de tabla
                    enTablaRoam = false;
                    // NO hacer continue, procesar esta lÃ­nea normalmente abajo
                }
            }

            // ================================================================
            // DETECCIÃ“N DE BLOQUE DE CÃ“DIGO
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
    // FUNCIÃ“N UNIFICADA DE EXTRACCIÃ“N
    // ========================================================================

    /**
     * Extrae los bloques de texto RAW de prompts y respuestas, sin limpiarlos.
     */
    extraerConversacionRaw(contenido, skipTimestamp = true) {
        const marcadores = [];

        // Detectar formato Antigravity
        const esAntigravity = ChatbotRoamPatterns.DETECT_ANTIGRAVITY.test(contenido);

        // Usar marcadores segun formato
        const promptPattern = esAntigravity
            ? ChatbotRoamPatterns.ANTIGRAVITY_PROMPT_MARKER
            : ChatbotRoamPatterns.PROMPT_MARKER;
        const responsePattern = esAntigravity
            ? ChatbotRoamPatterns.ANTIGRAVITY_RESPONSE_MARKER
            : ChatbotRoamPatterns.RESPONSE_MARKER;

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

        // Ordenar por posiciÃ³n
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
            const { tipo, pos } = marcadores[i];

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
     * Para uso en el editor de clasificaciÃ³n manual.
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

            // Calcular nÃºmero de lÃ­nea
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
                extracto: extracto || '(vacÃ­o)',
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
    // LÃ“GICA DE PROCESAMIENTO PRINCIPAL
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

        // Eliminar imÃ¡genes ANTES de extraer (si estÃ¡ marcado)
        if (opciones.eliminar_imagenes) {
            contenido = ChatbotRoamCleaners.eliminarImagenesEmbedidas(contenido);
        }

        // Extraer conversaciÃ³n
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

            const { prompt: rawPrompt, response: rawResponse } = conversacionRaw[i];

            // --- LIMPIAR PROMPT ---
            let promptLimpio = this._limpiarPrompt(rawPrompt, opciones);

            // --- LIMPIAR RESPUESTA ---
            let responseLimpio = this._limpiarRespuesta(rawResponse, opciones);

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
    _limpiarRespuesta(rawResponse, opciones) {
        let responseTemp = rawResponse;

        // Aplicar cleaners del registro centralizado
        responseTemp = ChatbotRoamOpciones.aplicarLimpieza(responseTemp, opciones, 'respuesta');

        // Limpiar formato bÃ¡sico
        responseTemp = ChatbotRoamCleaners.limpiarFormatoMarkdownBasico(responseTemp);
        return ChatbotRoamCleaners.limpiarContenido(responseTemp);
    },

    /**
     * Detecta automÃ¡ticamente el tipo de chatbot basÃ¡ndose en marcadores caracterÃ­sticos.
     */
    detectarTipoChatbot(contenido) {
        // Detectar Antigravity PRIMERO (marcadores unicos)
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
     * Devuelve las opciones preconfiguradas segÃºn el tipo de chatbot.
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
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chatbot-roam-modal {
                background: #1a1a2e;
                border-radius: 12px;
                width: 900px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
            }

            .chatbot-roam-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: #16213e;
                border-bottom: 1px solid #0f3460;
            }

            .chatbot-roam-title {
                color: #e94560;
                font-size: 18px;
                font-weight: 600;
                margin: 0;
            }

            .chatbot-roam-close {
                background: transparent;
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }

            .chatbot-roam-close:hover {
                color: #e94560;
            }

            .chatbot-roam-body {
                padding: 20px;
                overflow-y: auto;
                flex: 1;
            }

            .chatbot-roam-dropzone {
                border: 2px dashed #0f3460;
                border-radius: 8px;
                padding: 40px 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #16213e;
            }

            .chatbot-roam-dropzone:hover,
            .chatbot-roam-dropzone.dragover {
                border-color: #e94560;
                background: rgba(233, 69, 96, 0.1);
            }

            .chatbot-roam-dropzone-icon {
                font-size: 48px;
                margin-bottom: 12px;
            }

            .chatbot-roam-dropzone-text {
                color: #aaa;
                font-size: 14px;
            }

            .chatbot-roam-dropzone-text strong {
                color: #e94560;
            }

            .chatbot-roam-file-loaded {
                background: rgba(76, 175, 80, 0.1);
                border-color: #4CAF50;
            }

            .chatbot-roam-file-loaded .chatbot-roam-dropzone-icon {
                color: #4CAF50;
            }

            .chatbot-roam-file-error {
                background: rgba(233, 69, 96, 0.1);
                border-color: #e94560;
            }

            .chatbot-roam-file-error .chatbot-roam-dropzone-icon {
                color: #e94560;
                font-size: 36px;
                font-weight: bold;
            }

            .chatbot-roam-section-title {
                color: #e94560;
                font-size: 14px;
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
                color: #ccc;
                font-size: 13px;
            }

            .chatbot-roam-option input[type="checkbox"] {
                accent-color: #e94560;
            }

            .chatbot-roam-presets {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                flex-wrap: wrap;
            }

            .chatbot-roam-preset-btn {
                background: #0f3460;
                border: 1px solid #16213e;
                color: #aaa;
                padding: 6px 14px;
                border-radius: 16px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .chatbot-roam-preset-btn:hover {
                background: #e94560;
                color: white;
                border-color: #e94560;
            }

            .chatbot-roam-preview {
                background: #0d1117;
                border: 1px solid #30363d;
                border-radius: 8px;
                padding: 12px;
                max-height: 250px;
                overflow-y: auto;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                color: #c9d1d9;
                white-space: pre-wrap;
                line-height: 1.5;
            }

            .chatbot-roam-preview-info {
                color: #888;
                font-size: 11px;
                margin-top: 8px;
                font-style: italic;
            }

            .chatbot-roam-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: #16213e;
                border-top: 1px solid #0f3460;
            }

            .chatbot-roam-info {
                color: #888;
                font-size: 12px;
            }

            .chatbot-roam-info strong {
                color: #e94560;
            }

            .chatbot-roam-buttons {
                display: flex;
                gap: 10px;
            }

            .chatbot-roam-btn {
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .chatbot-roam-btn-cancel {
                background: transparent;
                border: 1px solid #444;
                color: #aaa;
            }

            .chatbot-roam-btn-cancel:hover {
                border-color: #666;
                color: #fff;
            }

            .chatbot-roam-btn-insert {
                background: #e94560;
                border: none;
                color: white;
                font-weight: 600;
            }

            .chatbot-roam-btn-insert:hover {
                background: #d63651;
            }

            .chatbot-roam-btn-insert:disabled {
                background: #444;
                cursor: not-allowed;
            }

            .chatbot-roam-hidden-input {
                display: none;
            }

            /* Busqueda incremental */
            .chatbot-roam-search-section {
                background: #16213e;
                border: 1px solid #0f3460;
                border-radius: 8px;
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
                background: #0d1117;
                border: 1px solid #30363d;
                border-radius: 4px;
                padding: 8px 12px;
                color: #c9d1d9;
                font-size: 13px;
            }

            .chatbot-roam-search-input:focus {
                outline: none;
                border-color: #e94560;
            }

            .chatbot-roam-search-input::placeholder {
                color: #666;
            }

            .chatbot-roam-search-nav {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .chatbot-roam-search-btn {
                background: #0f3460;
                border: 1px solid #16213e;
                color: #aaa;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chatbot-roam-search-btn:hover:not(:disabled) {
                background: #e94560;
                color: white;
                border-color: #e94560;
            }

            .chatbot-roam-search-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .chatbot-roam-search-count {
                color: #888;
                font-size: 12px;
                min-width: 40px;
                text-align: center;
            }

            .chatbot-roam-cut-btn {
                background: #e94560;
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
            }

            .chatbot-roam-cut-btn:hover {
                background: #d63651;
            }

            .chatbot-roam-cut-btn:disabled {
                background: #444;
                cursor: not-allowed;
            }

            .chatbot-roam-cut-indicator {
                color: #4CAF50;
                font-size: 12px;
                margin-left: 8px;
            }

            /* Preview con highlights */
            .chatbot-roam-preview mark {
                background: rgba(233, 69, 96, 0.3);
                color: inherit;
                padding: 1px 2px;
                border-radius: 2px;
            }

            .chatbot-roam-preview mark.current {
                background: #e94560;
                color: white;
            }

            /* Editor de clasificaciÃ³n manual v2 */
            .chatbot-roam-editor-panel {
                background: rgba(255, 165, 0, 0.08);
                border: 1px solid #FFA500;
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
            }

            .chatbot-roam-editor-header {
                margin-bottom: 12px;
            }

            .chatbot-roam-editor-title {
                display: block;
                color: #FFA500;
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
            }

            .chatbot-roam-editor-subtitle {
                color: #888;
                font-size: 12px;
            }

            .chatbot-roam-editor-stats {
                color: #aaa;
                font-size: 11px;
                margin-bottom: 10px;
                padding: 6px 10px;
                background: rgba(0, 0, 0, 0.2);
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
                border-radius: 6px;
                border-left: 4px solid;
                position: relative;
            }

            .chatbot-roam-editor-item.prompt {
                background: rgba(66, 133, 244, 0.15);
                border-left-color: #4285F4;
            }

            .chatbot-roam-editor-item.response {
                background: rgba(76, 175, 80, 0.15);
                border-left-color: #4CAF50;
            }

            .chatbot-roam-editor-item.modified {
                box-shadow: 0 0 8px rgba(255, 165, 0, 0.5);
            }

            .chatbot-roam-editor-item-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
            }

            .chatbot-roam-editor-num {
                color: #666;
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
                color: #4285F4;
            }

            .chatbot-roam-editor-item.response .chatbot-roam-editor-tipo {
                color: #4CAF50;
            }

            .chatbot-roam-editor-mcp {
                background: #e94560;
                color: white;
                font-size: 9px;
                padding: 2px 5px;
                border-radius: 3px;
                font-weight: 600;
            }

            .chatbot-roam-editor-line {
                color: #666;
                font-size: 10px;
                margin-left: auto;
            }

            .chatbot-roam-editor-extracto {
                color: #999;
                font-size: 11px;
                font-family: 'Consolas', 'Monaco', monospace;
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
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #444;
                color: #aaa;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chatbot-roam-editor-swap-btn:hover {
                background: #FFA500;
                border-color: #FFA500;
                color: white;
            }

            .chatbot-roam-editor-chain-btn {
                font-size: 11px;
                background: rgba(255, 165, 0, 0.15);
                border-color: #FFA500;
                color: #FFA500;
            }

            .chatbot-roam-editor-chain-btn:hover {
                background: #e94560;
                border-color: #e94560;
                color: white;
            }

            .chatbot-roam-editor-actions {
                display: flex;
                gap: 10px;
                margin-top: 12px;
                justify-content: flex-end;
            }

            .chatbot-roam-editor-btn-continue {
                background: #4CAF50;
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
            }

            .chatbot-roam-editor-btn-continue:hover {
                background: #45a049;
            }

            .chatbot-roam-editor-btn-skip {
                background: transparent;
                border: 1px solid #444;
                color: #aaa;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }

            .chatbot-roam-editor-btn-skip:hover {
                border-color: #666;
                color: #fff;
            }

            .chatbot-roam-editor-btn-restore {
                background: transparent;
                border: 1px solid #e94560;
                color: #e94560;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }

            .chatbot-roam-editor-btn-restore:hover:not(:disabled) {
                background: #e94560;
                color: white;
            }

            .chatbot-roam-editor-btn-restore:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
        `;
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
                // Recolectar todas las lÃ­neas hijas de la tabla
                var tablaLineas = [];
                var j = i + 1;
                while (j < lineas.length && lineas[j].match(/^\s+- /)) {
                    tablaLineas.push(lineas[j]);
                    j++;
                }

                // Construir estructura jerÃ¡rquica de la tabla
                var bloqueTabla = {
                    text: '{{[[table]]}}',
                    children: this._parseIndentedBlocks(tablaLineas, 8)
                };

                currentPrompt.children.push(bloqueTabla);
                currentHeading = null;  // Reset heading despuÃ©s de tabla
                i = j - 1;  // Saltar las lÃ­neas procesadas
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
     * Convierte lÃ­neas indentadas en estructura anidada de bloques
     * Usado para parsear tablas Roam y otros contenidos con anidaciÃ³n profunda
     * 
     * @param {string[]} lineas - LÃ­neas con formato "    - texto"
     * @param {number} baseIndent - Nivel base de indentaciÃ³n (espacios)
     * @returns {Object[]} - Estructura de bloques anidados
     */
    _parseIndentedBlocks(lineas, baseIndent) {
        if (lineas.length === 0) return [];

        var result = [];
        var stack = [{ indent: baseIndent - 4, children: result }];  // Nivel virtual padre

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];

            // Contar espacios de indentaciÃ³n
            var indent = 0;
            while (indent < linea.length && linea[indent] === ' ') indent++;

            // Extraer texto (quitar "- " al inicio)
            var texto = linea.substring(indent).replace(/^- /, '').trim();
            if (!texto) continue;

            var nuevoBloque = { text: texto, children: [] };

            // Encontrar el padre correcto basÃ¡ndose en la indentaciÃ³n
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
    // Configuracion de batching
    BATCH_SIZE: 50,
    BATCH_DELAY_MS: 50,

    /**
     * Elimina bloques por sus UIDs (para rollback en caso de error)
     * @param {Array<string>} uids - Array de UIDs a eliminar
     * @returns {Promise<number>} - Numero de bloques eliminados exitosamente
     * @private
     */
    async _rollbackBlocks(uids) {
        let deleted = 0;
        console.warn('Rollback: Iniciando eliminacion de ' + uids.length + ' bloques...');

        // Eliminar en orden inverso para evitar problemas con padres/hijos
        for (let i = uids.length - 1; i >= 0; i--) {
            const uid = uids[i];
            try {
                await window.roamAlphaAPI.data.block.delete({ block: { uid: uid } });
                deleted++;
            } catch (e) {
                // Ignorar errores de eliminacion (el bloque puede ya no existir)
                console.warn('Rollback: No se pudo eliminar bloque ' + uid, e);
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
     * Inserta bloques recursivamente en Roam con soporte de rollback y batching
     * Si ocurre un error, automaticamente elimina los bloques ya insertados
     * 
     * @param {string} parentUid - UID del bloque padre
     * @param {Array} bloques - Array de bloques a insertar
     * @param {number} startOrder - Orden inicial para los bloques
     * @param {Function} onProgress - Callback opcional (insertedCount, total) => void
     * @returns {Promise<Object>} - { success, insertedBlocks, insertedCount, error, rolledBackCount }
     */
    async insertBlocksRecursively(parentUid, bloques, startOrder, onProgress) {
        // Estado GLOBAL de insercion para este proceso
        // Pasado por referencia a todas las llamadas recursivas
        const context = {
            allInsertedUids: [],
            totalOpsEstimate: this._estimateTotalBlocks(bloques),
            opsCount: 0
        };

        try {
            const result = await this._insertBlocksInternal(parentUid, bloques, startOrder, context, onProgress);
            return {
                success: true,
                insertedBlocks: result,
                insertedCount: context.allInsertedUids.length,
                error: null,
                rolledBackCount: 0
            };
        } catch (error) {
            // Error durante insercion - hacer rollback GLOBAL
            console.error('Error durante insercion, iniciando rollback de ' + context.allInsertedUids.length + ' bloques...');
            const rolledBack = await this._rollbackBlocks(context.allInsertedUids);
            console.log('Rollback completado: ' + rolledBack + '/' + context.allInsertedUids.length + ' bloques eliminados');

            return {
                success: false,
                insertedBlocks: [],
                insertedCount: context.allInsertedUids.length,
                error: error.message,
                rolledBackCount: rolledBack
            };
        }
    },

    /**
     * Estima el total de bloques a insertar para el progreso
     */
    _estimateTotalBlocks(bloques) {
        let count = 0;
        for (const b of bloques) {
            count++;
            if (b.children && b.children.length > 0) {
                count += this._estimateTotalBlocks(b.children);
            }
        }
        return count;
    },

    /**
     * Logica interna de insercion recursiva con batching
     * @private
     */
    async _insertBlocksInternal(parentUid, bloques, startOrder, context, onProgress) {
        const insertedBlocks = [];

        for (let i = 0; i < bloques.length; i++) {
            // Check batch limit
            if (context.opsCount > 0 && context.opsCount % this.BATCH_SIZE === 0) {
                // Yield al UI thread
                await this._delay(this.BATCH_DELAY_MS);
            }

            const bloque = bloques[i];
            const blockUid = window.roamAlphaAPI.util.generateUID();
            let texto = bloque.text;
            let headingLevel = 0;

            // Detectar nivel de heading (### = 3, ## = 2, # = 1)
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

            // Crear bloque
            const blockData = {
                location: { "parent-uid": parentUid, order: startOrder + i },
                block: { uid: blockUid, string: texto }
            };

            if (headingLevel > 0) {
                blockData.block.heading = headingLevel;
            }

            // Insertar
            await window.roamAlphaAPI.data.block.create(blockData);

            // Actualizar estado global
            context.allInsertedUids.push(blockUid);
            insertedBlocks.push(blockUid);
            context.opsCount++;

            // Reportar progreso
            if (onProgress && context.opsCount % 10 === 0) {
                onProgress(context.opsCount, context.totalOpsEstimate);
            }

            // Insertar hijos recursivamente
            if (bloque.children && bloque.children.length > 0) {
                const childBlocks = await this._insertBlocksInternal(blockUid, bloque.children, 0, context, onProgress);
                insertedBlocks.push(...childBlocks);
            }
        }

        return insertedBlocks;
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
    _originalProcessedContent: null,  // Para restaurar despuÃ©s de cortar
    _currentOpciones: null,
    _savedBlockUid: null,  // Guardar UID del bloque ANTES de abrir modal

    // Estado de bÃºsqueda incremental
    _searchMatches: [],      // Posiciones de coincidencias
    _currentMatchIndex: -1,  // Ãndice actual
    _isCut: false,           // Si ya se cortÃ³
    _boundEscHandler: null,  // Referencia al handler de ESC para cleanup


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
            '<strong>Arrastra un archivo .md aqui</strong><br>' +
            'o haz clic para seleccionar' +
            '</div>' +
            '</div>' +
            '<input type="file" class="chatbot-roam-hidden-input" accept=".md,.txt" data-action="file-input">' +
            '<div class="chatbot-roam-section-title">OPCIONES DE LIMPIEZA</div>' +
            '<div class="chatbot-roam-options">' +
            ChatbotRoamOpciones.generarCheckboxesHTML() +
            '</div>' +
            '<div class="chatbot-roam-presets">' +
            '<button class="chatbot-roam-preset-btn" data-preset="claude">Claude</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="chatgpt">ChatGPT</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="gemini">Gemini</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="antigravity">Antigravity</button>' +
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
            '<span style="color: #666;">Arrastra un archivo para ver la vista previa...</span>' +
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
            const file = e.dataTransfer.files[0];
            if (file) this._handleFile(file);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this._handleFile(file);
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
        // Validar tamaÃ±o
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

        // Verificar marcadores de conversacion (incluye Antigravity)
        const tienePrompt = content.includes('## Prompt:') || content.includes('### User Input');
        const tieneResponse = content.includes('## Response:') || content.includes('### Planner Response');

        if (!tienePrompt && !tieneResponse) {
            return {
                valid: false,
                error: 'El archivo no parece ser una conversacion exportada. No se encontraron marcadores "## Prompt:" ni "## Response:".',
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

    _handleFile(file) {
        // Validar archivo antes de leer
        const fileValidation = this._validateFile(file);
        if (!fileValidation.valid) {
            this._showDropzoneError(fileValidation.error);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;

            // Validar contenido
            const contentValidation = this._validateContent(content);
            if (!contentValidation.valid) {
                this._showDropzoneError(contentValidation.error);
                return;
            }

            this._fileContent = content;

            // Detectar tipo de chatbot y aplicar preset
            const tipo = ChatbotRoamProcessing.detectarTipoChatbot(this._fileContent);
            this._applyPreset(tipo);

            // Actualizar dropzone visual
            const dropzone = this._modalContainer.querySelector('[data-action="dropzone"]');
            dropzone.classList.remove('chatbot-roam-file-error');
            dropzone.classList.add('chatbot-roam-file-loaded');
            dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = 'OK';

            // Mostrar warning si existe
            let statusText = '<span style="color: #4CAF50;">Archivo cargado (' + (file.size / 1024).toFixed(1) + ' KB)</span>';
            if (contentValidation.warning) {
                statusText += '<br><span style="color: #FFA500; font-size: 11px;">' + contentValidation.warning + '</span>';
            }

            dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML =
                '<strong>' + file.name + '</strong><br>' + statusText;

            // Detectar si el archivo tiene uso de MCP (para mostrar editor de clasificaciÃ³n)
            const tieneMCP = ChatbotRoamProcessing.tieneUsoDeMCP(content);

            if (tieneMCP) {
                this._mostrarEditorClasificacion();
            } else {
                this._processAndPreview();
            }
        };

        reader.onerror = () => {
            this._showDropzoneError('Error al leer el archivo. Intenta de nuevo.');
        };

        reader.readAsText(file);
    },

    // ========================================================================
    // EDITOR DE CLASIFICACIÃ“N MANUAL (v2)
    // ========================================================================

    // Estado del editor
    _todosLosBloques: [],
    _originalFileContent: null,
    _bloquesModificados: new Set(),

    /**
     * Muestra el editor de clasificaciÃ³n con todos los bloques
     */
    _mostrarEditorClasificacion() {
        // Guardar contenido original para posible restauraciÃ³n
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
            const tipoIcon = bloque.tipo === 'Prompt' ? 'ðŸ”µ' : 'ðŸŸ¢';
            const mcpBadge = bloque.tieneMCP ? '<span class="chatbot-roam-editor-mcp">MCP</span>' : '';
            const extractoCorto = bloque.extracto.substring(0, 70) + (bloque.extracto.length > 70 ? '...' : '');

            return `
                <div class="chatbot-roam-editor-item ${tipoClass}" data-idx="${idx}">
                    <div class="chatbot-roam-editor-item-header">
                        <span class="chatbot-roam-editor-num">[${idx + 1}]</span>
                        <span class="chatbot-roam-editor-icon">${tipoIcon}</span>
                        <span class="chatbot-roam-editor-tipo">${bloque.tipo.toUpperCase()}</span>
                        ${mcpBadge}
                        <span class="chatbot-roam-editor-line">LÃ­nea ${bloque.lineNumber}</span>
                    </div>
                    <div class="chatbot-roam-editor-extracto">${this._escapeHtml(extractoCorto)}</div>
                    <div class="chatbot-roam-editor-buttons">
                        <button class="chatbot-roam-editor-swap-btn" data-action="swap" data-idx="${idx}" title="Intercambiar este bloque">â‡„</button>
                        <button class="chatbot-roam-editor-chain-btn" data-action="chain" data-idx="${idx}" title="Invertir desde aquÃ­ hasta el final">â†“â†“</button>
                    </div>
                </div>
            `;
        }).join('');

        panel.innerHTML = `
            <div class="chatbot-roam-editor-header">
                <span class="chatbot-roam-editor-title">âš ï¸ REVISIÃ“N DE CLASIFICACIÃ“N</span>
                <span class="chatbot-roam-editor-subtitle">Este archivo tiene MCP. Verifica que cada bloque estÃ© correctamente clasificado.</span>
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
                    Omitir revisiÃ³n
                </button>
                <button class="chatbot-roam-editor-btn-restore" data-action="restore-editor" disabled>
                    Restaurar original
                </button>
            </div>
        `;

        // Insertar despuÃ©s del dropzone
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
     * Intercambia la clasificaciÃ³n de un bloque (Prompt â†” Response)
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

        // Habilitar botÃ³n restaurar si hay modificaciones
        const restoreBtn = this._modalContainer.querySelector('[data-action="restore-editor"]');
        if (restoreBtn) {
            restoreBtn.disabled = this._bloquesModificados.size === 0;
        }
    },

    /**
     * Actualiza visualmente un item del editor despuÃ©s de intercambiar
     */
    _actualizarItemEditor(idx) {
        const item = this._modalContainer.querySelector(`.chatbot-roam-editor-item[data-idx="${idx}"]`);
        if (!item) return;

        const bloque = this._todosLosBloques[idx];
        const tipoClass = bloque.tipo === 'Prompt' ? 'prompt' : 'response';
        const tipoIcon = bloque.tipo === 'Prompt' ? 'ðŸ”µ' : 'ðŸŸ¢';

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

        if (!confirm(`Â¿Invertir ${restantes} bloques desde aquÃ­ hasta el final?`)) {
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
            const countInfo = numIntercambios !== undefined ? `${numIntercambios} intercambios Â· ` : '';
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
    // BÃšSQUEDA INCREMENTAL
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
            preview.innerHTML = '<span style="color: #666;">Arrastra un archivo para ver la vista previa...</span>';
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
        // Texto despuÃ©s del Ãºltimo match
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

        // Encontrar el inicio de la lÃ­nea que contiene el match
        // Buscamos el "* " que indica un prompt
        let cutPosition = match.start;

        // Buscar hacia atrÃ¡s el inicio del prompt ("* " al inicio de lÃ­nea o despuÃ©s de newline)
        while (cutPosition > 0) {
            if (content.substring(cutPosition, cutPosition + 2) === '* ' &&
                (cutPosition === 0 || content[cutPosition - 1] === '\n')) {
                break;
            }
            cutPosition--;
        }

        // Cortar desde esa posiciÃ³n
        this._processedContent = content.substring(cutPosition);
        this._isCut = true;

        // Limpiar bÃºsqueda y actualizar UI
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
        const bloques = ChatbotRoamParser.parseToBlockStructure(lineas);

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

        // Insertar usando el Inserter con soporte de rollback y batching
        const result = await ChatbotRoamInserter.insertBlocksRecursively(parentUid, bloques, 0, (count, total) => {
            // Actualizar porcentaje
            const percent = Math.round((count / total) * 100);
            insertBtn.textContent = `Insertando... (${percent}%)`;
        });

        if (result.success) {
            // Cerrar modal tras exito
            this.closeModal();

            // Notificar al usuario (podriamos usar un toast de Roam si existiera API publica, por ahora alert o nada)
            console.log(`Chatbot Roam Plugin: ${result.insertedCount} bloques insertados correctamente.`);
        } else {
            // Mostrar error y rollback info
            let msg = 'Error al insertar bloques: ' + result.error;
            if (result.rolledBackCount > 0) {
                msg += '\n\nSe realizo un ROLLBACK automatico eliminando ' + result.rolledBackCount + ' bloques parciales.';
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
    VERSION: "1.3.3",

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

        console.log('Chatbot Roam Plugin v1.3.3 loaded');
        console.log('   Usa Ctrl+Shift+I o busca "Importar Conversacion" en el command palette.');
    }
};

// Auto-inicializar
ChatbotRoamPlugin.init();

