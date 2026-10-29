// ============================================================================
// CHATBOT ROAM PLUGIN - LIMPIEZA COMUN
// Constantes y funciones de limpieza que valen para cualquier formato
// NOTE: Los backticks se generan con String.fromCharCode(96); Roam rompe los
// scripts que los contienen literalmente
// ============================================================================

const ChatbotRoamComun = {
    BT3: String.fromCharCode(96, 96, 96),
    BT4: String.fromCharCode(96, 96, 96, 96),

    // Imagenes base64 incrustadas
    IMAGEN_COMPLETA: /!\[[^\]]*\]\(data:image\/[^)]*\)/g,
    IMAGEN_TRUNCADA: /!\[[^\]]*\]\(data:image\/[^\n)]*(?=\n|$)/g,

    LINEAS_VACIAS_EXCESIVAS: /\n{3,}/g,

    // Marcas de tiempo
    TIMESTAMP_COMPLETO: /^\d{1,2}\/\d{1,2}\/\d{4},\s+\d{1,2}:\d{2}:\d{2}\s+[ap]\.m\.$/,
    TIMESTAMP_FECHA: /^\d{1,2}\/\d{1,2}\/\d{4}/,
    // Marca en formato cita bajo cada turno: > 5/20/2026 22:35:00
    TIMESTAMP_BLOCKQUOTE: /^>\s*\d{1,2}\/\d{1,2}\/\d{4},?\s+\d{1,2}:\d{2}(:\d{2})?/,

    /**
     * Elimina las imágenes Base64 incrustadas en el Markdown.
     */
    eliminarImagenesEmbedidas(texto) {
        // Patrón 1: Imágenes completas con paréntesis de cierre
        texto = texto.replace(this.IMAGEN_COMPLETA, '');

        // Patrón 2: Imágenes truncadas
        texto = texto.replace(this.IMAGEN_TRUNCADA, '');

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
        texto = texto.replace(this.LINEAS_VACIAS_EXCESIVAS, '\n\n');
        return texto.trim();
    },

    /**
     * Limpia etiquetas de lenguaje de bloques de código pero PRESERVA los delimitadores.
     */
    limpiarFormatoMarkdownBasico(texto) {
        texto = texto.replace(new RegExp(this.BT4 + '[^\\n\\r\\x60]+', 'g'), this.BT4);
        texto = texto.replace(new RegExp(this.BT3 + '[^\\n\\r\\x60]+', 'g'), this.BT3);
        return texto;
    },

    /**
     * Neutraliza la sintaxis especial de Roam (::, [[, ]]) para evitar que se creen
     * atributos y referencias a páginas accidentalmente al importar texto de IA,
     * preservando intactos los bloques de código.
     */
    neutralizarSintaxisRoam(texto) {
        if (!texto) return '';
        // Separar en segmentos: texto normal vs bloques de codigo
        const partes = texto.split(new RegExp('(' + this.BT3 + '+[\\s\\S]*?' + this.BT3 + '+)', 'g'));

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

    /**
     * Elimina líneas de metadata como fechas y '> File:'.
     */
    limpiarMetadataGenerico(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();
            if (lineaStripped.startsWith('> File:')) continue;
            if (this.TIMESTAMP_COMPLETO.test(lineaStripped)) continue;
            lineasLimpias.push(linea);
        }

        return lineasLimpias.join('\n');
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
                    for (let k = 0; k < tablaRoam.length; k++) {
                        resultado.push(tablaRoam[k]);
                    }

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
