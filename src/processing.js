// ============================================================================
// CHATBOT ROAM PLUGIN - PROCESSING
// Separa cada archivo en turnos segun su formato, los limpia y los formatea
// ============================================================================

const ChatbotRoamProcessing = {
    // ========================================================================
    // EXTRACCIÓN DE TURNOS
    // ========================================================================

    /**
     * Extrae los pares prompt/respuesta en bruto, sin limpiarlos.
     * @param {string} contenido - Contenido de un archivo
     * @param {Object} formato - Formato del archivo (define los marcadores de turno)
     * @returns {Array} - [{ prompt, response }]
     */
    extraerConversacionRaw(contenido, formato, skipTimestamp = true) {
        const marcadores = [];
        let match;

        const promptRegex = new RegExp(formato.MARCADOR_PROMPT.source, formato.MARCADOR_PROMPT.flags);
        while ((match = promptRegex.exec(contenido)) !== null) {
            marcadores.push({ tipo: 'PROMPT', pos: match.index });
        }

        const responseRegex = new RegExp(formato.MARCADOR_RESPUESTA.source, formato.MARCADOR_RESPUESTA.flags);
        while ((match = responseRegex.exec(contenido)) !== null) {
            marcadores.push({ tipo: 'RESPONSE', pos: match.index });
        }

        // Ordenar por posición
        marcadores.sort((a, b) => a.pos - b.pos);

        // Salta la línea del marcador, las líneas vacías y la marca de tiempo que la sigue
        const calcularInicioContenido = (marcadorPos) => {
            const nextNewLine = contenido.indexOf('\n', marcadorPos);
            const inicioPos = nextNewLine === -1 ? contenido.length + 1 : nextNewLine + 1;
            if (!skipTimestamp) return inicioPos;

            const restoLimitado = contenido.substring(inicioPos, inicioPos + 1000);
            const lineasResto = restoLimitado.split('\n');
            let lineasSaltadas = 0;
            while (lineasSaltadas < lineasResto.length && lineasResto[lineasSaltadas].trim() === '') {
                lineasSaltadas++;
            }
            const lineaCandidata = lineasSaltadas < lineasResto.length ? lineasResto[lineasSaltadas].trim() : '';
            const lineaCandidataSinQuote = lineaCandidata.replace(/^>\s*/, '');
            if (ChatbotRoamComun.TIMESTAMP_FECHA.test(lineaCandidataSinQuote) ||
                ChatbotRoamComun.TIMESTAMP_BLOCKQUOTE.test(lineaCandidata)) {
                let bytesASaltar = 0;
                for (let k = 0; k <= lineasSaltadas; k++) {
                    bytesASaltar += lineasResto[k].length + 1;
                }
                return inicioPos + bytesASaltar;
            }
            return inicioPos;
        };

        const textoDelTurno = (idx) => {
            const fin = idx + 1 < marcadores.length ? marcadores[idx + 1].pos : contenido.length;
            return contenido.substring(calcularInicioContenido(marcadores[idx].pos), fin).trim();
        };

        // Emparejar prompts con responses (concatenando respuestas consecutivas)
        const pares = [];
        let i = 0;
        while (i < marcadores.length) {
            if (marcadores[i].tipo !== 'PROMPT') {
                // Respuesta sin prompt previo: se salta
                i++;
                continue;
            }

            const promptBloque = textoDelTurno(i);

            const responseParts = [];
            let j = i + 1;
            while (j < marcadores.length && marcadores[j].tipo === 'RESPONSE') {
                const respBloque = textoDelTurno(j);
                if (respBloque) responseParts.push(respBloque);
                j++;
            }

            // Solo crear par si hay al menos una respuesta
            if (responseParts.length > 0) {
                pares.push({
                    prompt: promptBloque,
                    response: responseParts.join('\n\n')
                });
            }

            i = j;
        }

        return pares;
    },

    // ========================================================================
    // PROCESAMIENTO PRINCIPAL
    // ========================================================================

    /**
     * Procesa uno o más archivos. Cada archivo se detecta y limpia según su propio formato.
     * Async para evitar congelar el UI en archivos grandes.
     * @param {Array} archivos - [{ name, content }]
     * @param {Object} [opciones] - { idOpcion: boolean }; si falta, los valores por defecto de cada formato
     * @returns {Promise<Object>} - { resultado, numIntercambios, formatos, resumen }
     */
    async procesarArchivos(archivos, opciones) {
        const lineas = [];
        const formatos = [];
        let numIntercambios = 0;
        let lastYield = performance.now();

        for (const archivo of archivos) {
            const formato = ChatbotRoamFormatos.detectar(archivo.content);
            const opcionesArchivo = opciones || ChatbotRoamOpciones.getDefaults([formato]);
            formatos.push({ archivo: archivo.name, formato: formato });

            const contenido = ChatbotRoamOpciones.aplicarLimpieza(archivo.content, opcionesArchivo, formato, 'archivo');
            const pares = this.extraerConversacionRaw(contenido, formato);

            lineas.push('* 📁 ' + archivo.name);

            for (let i = 0; i < pares.length; i++) {
                // Yield al main thread cada ~16ms para mantener UI fluida a 60fps
                if (performance.now() - lastYield > 16) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                    lastYield = performance.now();
                }

                const promptLimpio = this._limpiarPrompt(pares[i].prompt, opcionesArchivo, formato);
                const responseLimpio = this._limpiarRespuesta(pares[i].response, opcionesArchivo, formato);

                const lineasFormateadas = ChatbotRoamFormatter.formatExchange(promptLimpio, responseLimpio);
                for (let k = 0; k < lineasFormateadas.length; k++) {
                    lineas.push(lineasFormateadas[k]);
                }
            }
            numIntercambios += pares.length;
        }

        const tipos = [];
        formatos.forEach(f => { if (tipos.indexOf(f.formato.id) === -1) tipos.push(f.formato.id); });

        return {
            resultado: numIntercambios > 0 ? lineas.join('\n') : null,
            numIntercambios: numIntercambios,
            formatos: formatos,
            resumen: 'tipo: ' + tipos.join(', ')
        };
    },

    /**
     * Limpia un prompt aplicando las opciones seleccionadas
     * @private
     */
    _limpiarPrompt(rawPrompt, opciones, formato) {
        let promptTemp = ChatbotRoamOpciones.aplicarLimpieza(rawPrompt, opciones, formato, 'prompt');

        // Neutralizar sintaxis especial de Roam de manera obligatoria en todas las intervenciones del usuario
        promptTemp = ChatbotRoamComun.neutralizarSintaxisRoam(promptTemp);

        promptTemp = ChatbotRoamComun.limpiarFormatoMarkdownBasico(promptTemp);
        return promptTemp.split('\n').join(' ').trim();
    },

    /**
     * Limpia una respuesta aplicando las opciones seleccionadas
     * @private
     */
    _limpiarRespuesta(rawResponse, opciones, formato) {
        let responseTemp = ChatbotRoamOpciones.aplicarLimpieza(rawResponse, opciones, formato, 'respuesta');

        responseTemp = ChatbotRoamComun.limpiarFormatoMarkdownBasico(responseTemp);

        if (formato.limpiezaFinalRespuesta) {
            responseTemp = formato.limpiezaFinalRespuesta(responseTemp);
        }

        return ChatbotRoamComun.limpiarContenido(responseTemp);
    }
};
