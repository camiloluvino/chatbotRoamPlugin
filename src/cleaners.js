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
     * Reemplaza de forma segura bloques delimitados por backticks para evitar borrado masivo
     * si falta el delimitador de cierre.
     */
    _safeRegexReplace(texto, regex, delimiterStr) {
        if (!texto || !delimiterStr) return texto;
        const escapedDelim = delimiterStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const count = (texto.match(new RegExp(escapedDelim, 'g')) || []).length;
        // Si el número de delimitadores es impar, hay al menos uno sin cerrar; no aplicamos el regex para evitar borrado masivo
        if (count % 2 !== 0) {
            console.warn('ChatbotRoamCleaners: Delimitadores desbalanceados detectados (' + count + '). Omitiendo reemplazo potencialmente destructivo.');
            return texto;
        }
        return texto.replace(regex, '');
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
        return this._safeRegexReplace(texto, ChatbotRoamPatterns.THOUGHT_PROCESS_GENERICO, ChatbotRoamPatterns.BT4);
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
        return this._safeRegexReplace(texto, ChatbotRoamPatterns.PLAINTEXT_BLOCKS_CLAUDE, ChatbotRoamPatterns.BT4);
    },

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
                        lineasLimpias.push(...bloqueActual);
                    }
                    bloqueActual = [];
                }
                lineasLimpias.push(linea);
            }
        }

        if (bloqueActual.length > 0) {
            const esThinkingBlock = bloqueActual.some(line => /- \*\*Done\*\*/i.test(line));
            if (!esThinkingBlock) {
                lineasLimpias.push(...bloqueActual);
            }
        }

        return lineasLimpias.join('\n');
    },

    /**
     * Elimina los bloques completos de herramientas de Claude.
     */
    eliminarToolCallsClaude(texto) {
        // Patrón completo seguro
        texto = this._safeRegexReplace(texto, ChatbotRoamPatterns.TOOL_CALLS_COMPLETO, ChatbotRoamPatterns.BT4);
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
     * Elimina bloques de ejecución de código Python y salida stdout de Gemini (?code_reference, ?code_stdout, ?code_interpreter).
     */
    eliminarEjecucionCodigoGemini(texto) {
        return this._safeRegexReplace(texto, ChatbotRoamPatterns.GEMINI_CODE_EXECUTION, ChatbotRoamPatterns.BT3);
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
     * Formato: ---\nexported: ...\nsource: NotebookLM\n---\n# Título\nExported at: ...\n---
     */
    eliminarHeaderNotebookLM(texto) {
        // Eliminar bloque YAML (---...---)
        texto = texto.replace(/^---[\s\S]*?---\n*/m, '');
        // Eliminar título # y línea de exportación (chino, inglés, español, etc.)
        texto = texto.replace(/^# [^\n]+\n+(?:导出时间|Exported at|Exportado el|Exported on)[^\n]*\n*/gmi, '');
        // Limpiar separadores --- sueltos
        texto = texto.replace(/^---+\s*\n*/gm, '');
        return texto;
    },

    /**
     * Elimina timestamps de sección como "## 🕒 Today • 3:06 PM" o "## 📅 Monday, August 31"
     */
    eliminarTimestampNotebookLM(texto) {
        // Eliminar líneas de timestamp / fecha de sección de NotebookLM
        return texto.replace(/^##\s+[^#\n]*(?:Today|Yesterday|Hoy|Ayer|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo|January|February|March|April|May|June|July|August|September|October|November|December|Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre|\d{1,2}\/\d{1,2}|\d{1,2}:\d{2}|AM|PM|a\.m\.|p\.m\.)[^\n]*\n*/gmi, '');
    },

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
