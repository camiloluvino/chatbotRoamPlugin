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
