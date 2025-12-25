// CHATBOT ROAM PLUGIN v1.0.0
// Importador de conversaciones de chatbots (Claude, ChatGPT, Gemini) a Roam
// Uso: Ctrl+Shift+I o Command Palette
// Generated: 2025-12-25 03:54:11

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


            resultado.push('* ' + promptLimpio);

            if (responseLimpio) {
                var lineasResponse = responseLimpio.split('\n');
                var enBloqueCodigo = false;
                var codigoBuffer = [];
                // Definir backtick directamente para evitar problemas de resolucion
                var BACKTICK = String.fromCharCode(96);
                var BT3 = BACKTICK + BACKTICK + BACKTICK;

                for (var j = 0; j < lineasResponse.length; j++) {
                    var linea = lineasResponse[j];
                    var lineaStripped = linea.trim();

                    // Detectar inicio/fin de bloque de codigo (3+ backticks)
                    var esLineaCodigo = lineaStripped.length >= 3 &&
                        lineaStripped.charAt(0) === BACKTICK &&
                        lineaStripped.charAt(1) === BACKTICK &&
                        lineaStripped.charAt(2) === BACKTICK;

                    if (esLineaCodigo) {
                        if (!enBloqueCodigo) {
                            // Inicio de bloque de codigo
                            enBloqueCodigo = true;
                            codigoBuffer = [lineaStripped];
                        } else {
                            // Fin de bloque de codigo - unir todo en un solo item
                            codigoBuffer.push(lineaStripped);
                            // Usar marcador especial para codigo combinado
                            // Usamos {{NL}} en vez de \n para no romperlo en el split posterior
                            resultado.push('    [CODE]' + codigoBuffer.join('{{NL}}'));
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

                    // Linea vacia
                    if (!lineaStripped) {
                        resultado.push('');
                        continue;
                    }

                    // Headings
                    if (lineaStripped.startsWith('#')) {
                        resultado.push('    ' + lineaStripped);
                    }
                    // Listas
                    else if (lineaStripped.startsWith('* ') || lineaStripped.startsWith('- ')) {
                        resultado.push('    ' + linea);
                    }
                    // Texto normal
                    else {
                        resultado.push('    * ' + lineaStripped);
                    }
                }

                // Si quedo codigo sin cerrar, agregarlo
                if (codigoBuffer.length > 0) {
                    resultado.push('    [CODE]' + codigoBuffer.join('{{NL}}'));
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
    _originalProcessedContent: null,  // Para restaurar despuÃ©s de cortar
    _currentOpciones: null,
    _savedBlockUid: null,  // Guardar UID del bloque ANTES de abrir modal

    // Estado de bÃºsqueda incremental
    _searchMatches: [],      // Posiciones de coincidencias
    _currentMatchIndex: -1,  // Ãndice actual
    _isCut: false,           // Si ya se cortÃ³

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

            /* BÃºsqueda incremental */
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
            dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = 'OK';
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

        try {
            // Parsear el contenido procesado en estructura de bloques
            // Los bloques [CODE] ya tienen {{NL}} en vez de \n gracias a processing.js
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
     * Convierte lineas en estructura jerarquica de bloques
     * Maneja bloques de codigo marcados con [CODE]
     */
    _parseToBlockStructure(lineas) {
        var result = [];
        var currentPrompt = null;

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
                continue;
            }

            // Detectar respuestas (indentadas 4 espacios)
            if (linea.startsWith('    ') && currentPrompt) {
                var texto = linea.substring(4);

                // Detectar bloque de codigo combinado
                if (texto.startsWith('[CODE]')) {
                    // Extraer codigo sin el marcador y restaurar los \n
                    var codigo = texto.substring(6);
                    // Restaurar los newlines: {{NL}} -> \n
                    codigo = codigo.replace(/\{\{NL\}\}/g, '\n');
                    if (codigo) {
                        currentPrompt.children.push({
                            text: codigo,
                            children: []
                        });
                    }
                    continue;
                }

                // Linea normal - quitar "* " si es un bullet
                var textoLimpio = texto.startsWith('* ') ? texto.substring(2) : texto;
                if (textoLimpio.trim()) {
                    currentPrompt.children.push({
                        text: textoLimpio.trim(),
                        children: []
                    });
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
     * Inserta bloques recursivamente en Roam usando la API correcta
     * Detecta headings markdown y los convierte a headings nativos de Roam
     */
    async _insertBlocksRecursively(parentUid, bloques, startOrder) {
        for (var i = 0; i < bloques.length; i++) {
            var bloque = bloques[i];
            var blockUid = window.roamAlphaAPI.util.generateUID();
            var texto = bloque.text;
            var headingLevel = 0;

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

            // Crear bloque con o sin heading
            var blockData = {
                location: { "parent-uid": parentUid, order: startOrder + i },
                block: { uid: blockUid, string: texto }
            };

            // Agregar heading si corresponde
            if (headingLevel > 0) {
                blockData.block.heading = headingLevel;
            }

            await window.roamAlphaAPI.data.block.create(blockData);

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

