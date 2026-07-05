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
        // Detectar formato Claude V2 (## User: / ## Assistant:)
        const esClaudeV2 = contenido.includes('## User:') && contenido.includes('## Assistant:');

        // Usar marcadores segun formato
        let promptPattern, responsePattern;
        if (esNotebookLM) {
            promptPattern = ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_MARKER;
            responsePattern = ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_MARKER;
        } else if (esAntigravity) {
            promptPattern = ChatbotRoamPatterns.ANTIGRAVITY_PROMPT_MARKER;
            responsePattern = ChatbotRoamPatterns.ANTIGRAVITY_RESPONSE_MARKER;
        } else if (esClaudeV2) {
            promptPattern = ChatbotRoamPatterns.PROMPT_MARKER_V2;
            responsePattern = ChatbotRoamPatterns.RESPONSE_MARKER_V2;
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
                const nextNewLine = contenido.indexOf('\n', pos);
                const lineLength = nextNewLine === -1 ? contenido.length - pos : nextNewLine - pos;
                let siguienteLineaPos = pos + lineLength + 1;
                let inicioContenido = siguienteLineaPos;

                if (skipTimestamp) {
                    const restoLimitado = contenido.substring(siguienteLineaPos, siguienteLineaPos + 1000);
                    const lineasResto = restoLimitado.split('\n');
                    let lineasSaltadas = 0;
                    // Saltar líneas vacías entre el marcador y el timestamp
                    while (lineasSaltadas < lineasResto.length && lineasResto[lineasSaltadas].trim() === '') {
                        lineasSaltadas++;
                    }
                    const lineaCandidata = lineasSaltadas < lineasResto.length ? lineasResto[lineasSaltadas].trim() : '';
                    // Detectar timestamp normal o en formato blockquote (> fecha)
                    const lineaCandidataSinQuote = lineaCandidata.replace(/^>\s*/, '');
                    if (ChatbotRoamPatterns.TIMESTAMP_FECHA.test(lineaCandidataSinQuote) ||
                        ChatbotRoamPatterns.TIMESTAMP_BLOCKQUOTE.test(lineaCandidata)) {
                        // Calcular cuántos bytes saltar (líneas vacías + línea del timestamp)
                        let bytesASaltar = 0;
                        for (let k = 0; k <= lineasSaltadas; k++) {
                            bytesASaltar += lineasResto[k].length + 1;
                        }
                        inicioContenido = siguienteLineaPos + bytesASaltar;
                    }
                }

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
        const regex = /^## (Prompt|Response|User|Assistant):/gm;
        let match;

        while ((match = regex.exec(contenido)) !== null) {
            const posInicio = match.index;
            // Normalizar: "User" -> "Prompt", "Assistant" -> "Response"
            let tipo = match[1];
            if (tipo === 'User') tipo = 'Prompt';
            if (tipo === 'Assistant') tipo = 'Response';

            // Calcular número de línea
            const lineNumber = contenido.substring(0, posInicio).split('\n').length;

            // Encontrar el fin de este bloque (siguiente ## o fin de archivo)
            const restoContenido = contenido.substring(posInicio);
            const marcadorLen = match[0].length; // "## Prompt:" o "## Response:"
            const siguienteBloque = restoContenido.substring(marcadorLen).search(/^## (?:Prompt|Response|User|Assistant):/m);
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

        // Neutralizar sintaxis especial de Roam de manera obligatoria en todas las intervenciones del usuario
        promptTemp = ChatbotRoamCleaners.neutralizarSintaxisRoam(promptTemp);

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

        // Detectar Claude V2 (formato actualizado del exportador: ## User: / ## Assistant:)
        const esClaudeV2 = contenido.includes('## User:') && contenido.includes('## Assistant:');
        if (esClaudeV2) {
            return 'claude';
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
