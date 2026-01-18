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

        // Limpiar formato básico
        responseTemp = ChatbotRoamCleaners.limpiarFormatoMarkdownBasico(responseTemp);
        return ChatbotRoamCleaners.limpiarContenido(responseTemp);
    },

    /**
     * Detecta automáticamente el tipo de chatbot basándose en marcadores característicos.
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
     * Devuelve las opciones preconfiguradas según el tipo de chatbot.
     * Delega al registro centralizado en ChatbotRoamOpciones.
     */
    getPresetOpciones(tipo) {
        return ChatbotRoamOpciones.getPreset(tipo);
    }
};
