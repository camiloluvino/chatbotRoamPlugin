// CHATBOT ROAM PLUGIN v1.0.0
// Importador de conversaciones de chatbots (Claude, ChatGPT, Gemini) a Roam
// Uso: Ctrl+Shift+I o Command Palette
// Generated: 2025-12-24 15:22:59

// --- patterns.js ---
// CHATBOT ROAM PLUGIN - PATTERNS
// Regex patterns ported from Python chatbotRoam/patterns.py
// NOTE: Using RegExp constructor to avoid backtick issues in Roam

// Helper: backtick constants (char code 96)
const BT3 = String.fromCharCode(96, 96, 96);
const BT4 = String.fromCharCode(96, 96, 96, 96);

const ChatbotRoamPatterns = {
    // Version info
    VERSION: "1.0.0",

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
    MCP_TOOL_CALLS: new RegExp("\\*\\*[\\w-]+:[\\w_]+\\*\\*\\s*\\*Request\\*\\s*" + BT4 + "(?:javascript|json|plaintext)[\\s\\S]*?" + BT4 + "\\s*\\*Response\\*\\s*" + BT4 + "(?:javascript|json|plaintext|text)[\\s\\S]*?" + BT4, "g"),

    // DETECCION DE TIPO DE CHATBOT
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
     */
    eliminarMcpToolCallsClaude(texto) {
        // Paso 1: Eliminar bloques completos de MCP tool calls
        texto = texto.replace(ChatbotRoamPatterns.MCP_TOOL_CALLS, '');

        // Paso 2: Limpiar lÃ­neas residuales (nombres de herramientas sueltos)
        const patronNombresResiduales = /^\*\*[\w-]+:[\w_]+\*\*\s*$/gm;
        texto = texto.replace(patronNombresResiduales, '');

        // Paso 3: Limpiar *Request* y *Response* huÃ©rfanos
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

        // Encontrar todos los ## Prompt:
        let match;
        const promptRegex = new RegExp(ChatbotRoamPatterns.PROMPT_MARKER.source, 'gm');
        while ((match = promptRegex.exec(contenido)) !== null) {
            marcadores.push({ tipo: 'PROMPT', pos: match.index });
        }

        // Encontrar todos los ## Response:
        const responseRegex = new RegExp(ChatbotRoamPatterns.RESPONSE_MARKER.source, 'gm');
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

        // Emparejar prompts con responses
        const pares = [];
        let promptIdx = 0;
        let responseIdx = 0;

        for (let i = 0; i < marcadores.length; i++) {
            const { tipo } = marcadores[i];
            if (tipo === 'PROMPT') {
                if (i + 1 < marcadores.length && marcadores[i + 1].tipo === 'RESPONSE') {
                    pares.push({
                        prompt: prompts[promptIdx],
                        response: responses[responseIdx]
                    });
                    responseIdx++;
                }
                promptIdx++;
            }
        }

        return pares;
    },

    // ========================================================================
    // LÃ“GICA DE PROCESAMIENTO PRINCIPAL
    // ========================================================================

    /**
     * Procesa el archivo aplicando las opciones de limpieza seleccionadas individualmente.
     * @param {string} contenido - El contenido del archivo .md
     * @param {Object} opciones - Objeto con las opciones de limpieza
     * @returns {Object} - { resultado: string, numIntercambios: number }
     */
    procesarConOpcionesIndividuales(contenido, opciones) {
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

        for (const { prompt: rawPrompt, response: rawResponse } of conversacionRaw) {
            // --- LIMPIAR PROMPT ---
            let promptTemp = rawPrompt;

            if (opciones.eliminar_adjuntos_gemini) {
                promptTemp = ChatbotRoamCleaners.eliminarAdjuntosGemini(promptTemp);
            }

            if (opciones.eliminar_metadata) {
                promptTemp = ChatbotRoamCleaners.limpiarMetadataGenerico(promptTemp);
            }

            promptTemp = ChatbotRoamCleaners.limpiarFormatoMarkdownBasico(promptTemp);
            const promptLimpio = ChatbotRoamCleaners.limpiarContenido(promptTemp).split('\n').join(' ').trim();

            // --- LIMPIAR RESPUESTA ---
            let responseTemp = rawResponse;

            // Bloques de pensamiento
            if (opciones.eliminar_plaintext_claude) {
                responseTemp = ChatbotRoamCleaners.eliminarThoughtProcessClaude(responseTemp);
            }

            if (opciones.eliminar_thinking_gemini) {
                responseTemp = ChatbotRoamCleaners.eliminarThinkingGemini(responseTemp);
            }

            if (opciones.eliminar_thought_chatgpt) {
                responseTemp = ChatbotRoamCleaners.eliminarThoughtProcessGenerico(responseTemp);
            }

            // Tool calls y logs
            if (opciones.eliminar_toolcalls_claude) {
                responseTemp = ChatbotRoamCleaners.eliminarToolCallsClaude(responseTemp);
            }

            if (opciones.eliminar_mcp_toolcalls_claude) {
                responseTemp = ChatbotRoamCleaners.eliminarMcpToolCallsClaude(responseTemp);
            }

            if (opciones.eliminar_logs_chatgpt) {
                responseTemp = ChatbotRoamCleaners.eliminarToolLogsGenerico(responseTemp);
            }

            // Metadata
            if (opciones.eliminar_metadata) {
                responseTemp = ChatbotRoamCleaners.limpiarMetadataGenerico(responseTemp);
            }

            if (opciones.eliminar_footer_gemini) {
                responseTemp = ChatbotRoamCleaners.limpiarMetadataGemini(responseTemp);
            }

            if (opciones.eliminar_adjuntos_gemini) {
                responseTemp = ChatbotRoamCleaners.eliminarAdjuntosGemini(responseTemp);
            }

            // Limpiar formato bÃ¡sico
            responseTemp = ChatbotRoamCleaners.limpiarFormatoMarkdownBasico(responseTemp);
            const responseLimpio = ChatbotRoamCleaners.limpiarContenido(responseTemp);

            // --- FORMATEAR PARA ROAM ---
            if (!promptLimpio) continue;

            resultado.push(`* ${promptLimpio}`);

            if (responseLimpio) {
                const lineasResponse = responseLimpio.split('\n');
                let enBloqueCodigo = false;

                for (const linea of lineasResponse) {
                    const lineaStripped = linea.trim();

                    if (lineaStripped.startsWith(ChatbotRoamPatterns.BT3)) {
                        enBloqueCodigo = !enBloqueCodigo;
                        resultado.push(`    ${lineaStripped}`);
                        continue;
                    }

                    if (!lineaStripped) {
                        resultado.push('');
                        continue;
                    }

                    if (enBloqueCodigo) {
                        resultado.push(`    ${linea}`);
                    } else if (lineaStripped.startsWith('#')) {
                        resultado.push(`    ${lineaStripped}`);
                    } else if (lineaStripped.startsWith('* ') || lineaStripped.startsWith('- ')) {
                        resultado.push(`    ${linea}`);
                    } else {
                        resultado.push(`    * ${lineaStripped}`);
                    }
                }
            }

            resultado.push('');
        }

        return {
            resultado: resultado.join('\n'),
            numIntercambios: conversacionRaw.length
        };
    },

    /**
     * Detecta automÃ¡ticamente el tipo de chatbot basÃ¡ndose en marcadores caracterÃ­sticos.
     */
    detectarTipoChatbot(contenido) {
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
     */
    getPresetOpciones(tipo) {
        const base = {
            eliminar_imagenes: true,
            eliminar_plaintext_claude: false,
            eliminar_thinking_gemini: false,
            eliminar_thought_chatgpt: false,
            eliminar_toolcalls_claude: false,
            eliminar_mcp_toolcalls_claude: false,
            eliminar_logs_chatgpt: false,
            eliminar_metadata: false,
            eliminar_footer_gemini: false,
            eliminar_adjuntos_gemini: false
        };

        switch (tipo) {
            case 'claude':
                return {
                    ...base,
                    eliminar_plaintext_claude: true,
                    eliminar_toolcalls_claude: true,
                    eliminar_mcp_toolcalls_claude: true,
                    eliminar_metadata: true
                };
            case 'chatgpt':
                return {
                    ...base,
                    eliminar_thought_chatgpt: true,
                    eliminar_logs_chatgpt: true,
                    eliminar_metadata: true
                };
            case 'gemini':
                return {
                    ...base,
                    eliminar_thinking_gemini: true,
                    eliminar_footer_gemini: true,
                    eliminar_adjuntos_gemini: true,
                    eliminar_metadata: true
                };
            default:
                return base;
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
    _currentOpciones: null,
    _savedBlockUid: null,  // Guardar UID del bloque ANTES de abrir modal

    // ========================================================================
    // ESTILOS CSS
    // ========================================================================
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
                width: 700px;
                max-width: 90vw;
                max-height: 85vh;
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
                max-height: 200px;
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
        `;
    },

    // CREAR MODAL
    openModal() {
        if (this._modalContainer) {
            this.closeModal();
        }

        // IMPORTANTE: Capturar el bloque seleccionado ANTES de crear el modal
        const focusedBlock = window.roamAlphaAPI.ui.getFocusedBlock();
        this._savedBlockUid = focusedBlock ? focusedBlock['block-uid'] : null;

        // Inyectar estilos
        const styleId = 'chatbot-roam-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = this.getStyles();
            document.head.appendChild(style);
        }

        // Inicializar opciones por defecto
        this._currentOpciones = ChatbotRoamProcessing.getPresetOpciones('claude');
        this._fileContent = null;
        this._processedContent = null;

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
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_plaintext_claude" checked>' +
            'Bloques plaintext (Claude)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_logs_chatgpt">' +
            'Logs de busqueda' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_thinking_gemini">' +
            'Bloques Thinking (Gemini)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_metadata" checked>' +
            'Timestamps y referencias' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_thought_chatgpt">' +
            'Thought process (ChatGPT)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_footer_gemini">' +
            'Footer Gemini Exporter' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_toolcalls_claude" checked>' +
            'Tool calls (Claude)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_adjuntos_gemini">' +
            'Adjuntos Gemini' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_mcp_toolcalls_claude" checked>' +
            'MCP Tool calls (Claude)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_imagenes" checked>' +
            'Imagenes Base64' +
            '</label>' +
            '</div>' +
            '<div class="chatbot-roam-presets">' +
            '<button class="chatbot-roam-preset-btn" data-preset="claude">Claude</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="chatgpt">ChatGPT</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="gemini">Gemini</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="limpiar">Limpiar todo</button>' +
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

        // ESC to close
        document.addEventListener('keydown', this._handleEsc);
    },

    _handleEsc(e) {
        if (e.key === 'Escape') {
            ChatbotRoamUI.closeModal();
        }
    },

    // ========================================================================
    // FILE HANDLING
    // ========================================================================
    _handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this._fileContent = e.target.result;

            // Detectar tipo de chatbot y aplicar preset
            const tipo = ChatbotRoamProcessing.detectarTipoChatbot(this._fileContent);
            this._applyPreset(tipo);

            // Actualizar dropzone visual
            const dropzone = this._modalContainer.querySelector('[data-action="dropzone"]');
            dropzone.classList.add('chatbot-roam-file-loaded');
            dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = 'âœ…';
            dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML = `
                <strong>${file.name}</strong><br>
                <span style="color: #4CAF50;">Archivo cargado (${(file.size / 1024).toFixed(1)} KB)</span>
            `;

            this._processAndPreview();
        };
        reader.readAsText(file);
    },

    // ========================================================================
    // OPTIONS MANAGEMENT
    // ========================================================================
    _applyPreset(preset) {
        if (preset === 'limpiar') {
            this._currentOpciones = {
                eliminar_imagenes: false,
                eliminar_plaintext_claude: false,
                eliminar_thinking_gemini: false,
                eliminar_thought_chatgpt: false,
                eliminar_toolcalls_claude: false,
                eliminar_mcp_toolcalls_claude: false,
                eliminar_logs_chatgpt: false,
                eliminar_metadata: false,
                eliminar_footer_gemini: false,
                eliminar_adjuntos_gemini: false
            };
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
    _processAndPreview() {
        const { resultado, numIntercambios } = ChatbotRoamProcessing.procesarConOpcionesIndividuales(
            this._fileContent,
            this._currentOpciones
        );

        this._processedContent = resultado;

        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        const previewInfo = this._modalContainer.querySelector('[data-element="preview-info"]');
        const insertBtn = this._modalContainer.querySelector('[data-action="insert"]');

        if (resultado) {
            // Mostrar solo los primeros 500 caracteres
            const previewText = resultado.length > 500 ? resultado.substring(0, 500) + '...' : resultado;
            preview.textContent = previewText;
            previewInfo.textContent = `${numIntercambios} intercambios Â· ${resultado.length.toLocaleString()} caracteres totales`;
            insertBtn.disabled = false;
        } else {
            preview.innerHTML = '<span style="color: #e94560;">No se encontraron conversaciones en el archivo.</span>';
            previewInfo.textContent = '';
            insertBtn.disabled = true;
        }
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

        try {
            // Parsear el contenido procesado en estructura de bloques
            const lineas = this._processedContent.split('\n');
            const bloques = this._parseToBlockStructure(lineas);

            // Insertar bloques recursivamente
            await this._insertBlocksRecursively(parentUid, bloques, 0);

            // Cerrar modal despues de insertar
            this.closeModal();
            console.log('Conversacion insertada en Roam');

        } catch (error) {
            console.error('Error insertando en Roam:', error);
            alert('Error al insertar en Roam: ' + error.message);
        }
    },

    /**
     * Convierte lÃ­neas en estructura jerÃ¡rquica de bloques
     */
    _parseToBlockStructure(lineas) {
        const result = [];
        let currentPrompt = null;

        for (const linea of lineas) {
            if (!linea.trim()) continue;

            // Detectar prompts (nivel 0, empiezan con "* ")
            if (linea.startsWith('* ')) {
                if (currentPrompt) {
                    result.push(currentPrompt);
                }
                currentPrompt = {
                    text: linea.substring(2).trim(),
                    children: []
                };
            }
            // Detectar respuestas (indentadas 4 espacios)
            else if (linea.startsWith('    ') && currentPrompt) {
                const texto = linea.substring(4);
                // Quitar "* " si es un bullet
                const textoLimpio = texto.startsWith('* ') ? texto.substring(2) : texto;
                if (textoLimpio.trim()) {
                    currentPrompt.children.push({
                        text: textoLimpio.trim(),
                        children: []
                    });
                }
            }
        }

        // Agregar Ãºltimo prompt
        if (currentPrompt) {
            result.push(currentPrompt);
        }

        return result;
    },

    /**
     * Inserta bloques recursivamente en Roam usando la API correcta
     */
    async _insertBlocksRecursively(parentUid, bloques, startOrder) {
        for (let i = 0; i < bloques.length; i++) {
            const bloque = bloques[i];
            const blockUid = window.roamAlphaAPI.util.generateUID();

            // Usar la API correcta: window.roamAlphaAPI.data.block.create
            await window.roamAlphaAPI.data.block.create({
                location: { "parent-uid": parentUid, order: startOrder + i },
                block: { uid: blockUid, string: bloque.text }
            });

            // Insertar hijos recursivamente
            if (bloque.children && bloque.children.length > 0) {
                await this._insertBlocksRecursively(blockUid, bloque.children, 0);
            }
        }
    },

    // CLOSE MODAL
    closeModal() {
        const savedUid = this._savedBlockUid;
        if (this._modalContainer) {
            this._modalContainer.remove();
            this._modalContainer = null;
            this._fileContent = null;
            this._processedContent = null;
            this._savedBlockUid = null;
            document.removeEventListener('keydown', this._handleEsc);
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
    VERSION: "1.0.0",

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

        console.log("Chatbot Roam Plugin v" + this.VERSION + " cargado.");
        console.log('   Usa Ctrl+Shift+I o busca "Importar Conversacion" en el command palette.');
    }
};

// Auto-inicializar
ChatbotRoamPlugin.init();

