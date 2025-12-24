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
    // LÓGICA DE PROCESAMIENTO PRINCIPAL
    // ========================================================================

    /**
     * Procesa el archivo aplicando las opciones de limpieza seleccionadas individualmente.
     * @param {string} contenido - El contenido del archivo .md
     * @param {Object} opciones - Objeto con las opciones de limpieza
     * @returns {Object} - { resultado: string, numIntercambios: number }
     */
    procesarConOpcionesIndividuales(contenido, opciones) {
        // Eliminar imágenes ANTES de extraer (si está marcado)
        if (opciones.eliminar_imagenes) {
            contenido = ChatbotRoamCleaners.eliminarImagenesEmbedidas(contenido);
        }

        // Extraer conversación
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

            // Limpiar formato básico
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
                            resultado.push('    [CODE]' + codigoBuffer.join('\n'));
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
                    resultado.push('    [CODE]' + codigoBuffer.join('\n'));
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
     * Detecta automáticamente el tipo de chatbot basándose en marcadores característicos.
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
     * Devuelve las opciones preconfiguradas según el tipo de chatbot.
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
