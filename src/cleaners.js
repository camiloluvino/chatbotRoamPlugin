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
    }
};
