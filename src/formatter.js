// ============================================================================
// CHATBOT ROAM PLUGIN - FORMATTER
// Formats cleaned responses for Roam block structure
// ============================================================================

const ChatbotRoamFormatter = {
    // Constantes de indentacion
    INDENT_BASE: '    ',      // 4 espacios - respuestas nivel 1
    INDENT_HEADING: '        ', // 8 espacios - contenido bajo headings

    /**
     * Formatea una respuesta limpia para estructura de bloques Roam
     * Maneja headings markdown, listas, bloques de codigo, tablas Roam y texto normal
     * 
     * @param {string} responseLimpio - Texto de respuesta ya limpiado
     * @returns {Array<string>} - Lineas formateadas con indentacion correcta
     */
    formatResponseLines(responseLimpio) {
        if (!responseLimpio) return [];

        var resultado = [];
        var lineasResponse = responseLimpio.split('\n');
        var enBloqueCodigo = false;
        var codigoBuffer = [];
        var bajoHeading = false;
        var enTablaRoam = false;

        // Definir backtick directamente para evitar problemas de resolucion
        var BACKTICK = String.fromCharCode(96);

        for (var j = 0; j < lineasResponse.length; j++) {
            var linea = lineasResponse[j];
            var lineaStripped = linea.trim();

            // ================================================================
            // DETECCIÓN DE TABLA ROAM
            // ================================================================
            if (lineaStripped === '{{[[table]]}}') {
                enTablaRoam = true;
                var indentTabla = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                resultado.push(indentTabla + lineaStripped);
                continue;
            }

            // Si estamos dentro de una tabla Roam
            if (enTablaRoam) {
                // Línea vacía = fin de tabla
                if (!lineaStripped) {
                    enTablaRoam = false;
                    resultado.push('');
                    continue;
                }

                // Línea de tabla (tiene indentación y empieza con "- ")
                if (linea.match(/^\s+- /)) {
                    var indentTabla = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                    // Preservar la indentación original de la línea de tabla
                    resultado.push(indentTabla + linea);
                    continue;
                } else {
                    // Línea que no es parte de tabla = salir de tabla
                    enTablaRoam = false;
                    // NO hacer continue, procesar esta línea normalmente abajo
                }
            }

            // ================================================================
            // DETECCIÓN DE BLOQUE DE CÓDIGO
            // ================================================================
            var esLineaCodigo = this._isCodeBlockDelimiter(lineaStripped, BACKTICK);

            if (esLineaCodigo) {
                if (!enBloqueCodigo) {
                    // Inicio de bloque de codigo
                    enBloqueCodigo = true;
                    codigoBuffer = [lineaStripped];
                } else {
                    // Fin de bloque de codigo - unir todo en un solo item
                    codigoBuffer.push(lineaStripped);
                    var indentCodigo = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                    resultado.push(indentCodigo + '[CODE]' + codigoBuffer.join('{{NL}}'));
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

            // ================================================================
            // PROCESAMIENTO NORMAL
            // ================================================================

            // Linea vacia
            if (!lineaStripped) {
                resultado.push('');
                continue;
            }

            // Headings markdown (#, ##, ###, etc.) o lineas completamente en negrita (**Texto**)
            if (lineaStripped.startsWith('#') || (lineaStripped.startsWith('**') && lineaStripped.endsWith('**') && lineaStripped.length > 4)) {
                bajoHeading = true;  // Activar indentacion para contenido siguiente
                resultado.push(this.INDENT_BASE + lineaStripped);
            }
            // Listas
            else if (lineaStripped.startsWith('* ') || lineaStripped.startsWith('- ')) {
                var indentLista = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                resultado.push(indentLista + linea.trim());
            }
            // Texto normal
            else {
                var indentTexto = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                resultado.push(indentTexto + '* ' + lineaStripped);
            }
        }

        // Si quedo codigo sin cerrar, agregarlo
        if (codigoBuffer.length > 0) {
            resultado.push(this.INDENT_BASE + '[CODE]' + codigoBuffer.join('{{NL}}'));
        }

        return resultado;
    },

    /**
     * Detecta si una linea es un delimitador de bloque de codigo (3+ backticks)
     * @private
     */
    _isCodeBlockDelimiter(lineaStripped, backtick) {
        return lineaStripped.length >= 3 &&
            lineaStripped.charAt(0) === backtick &&
            lineaStripped.charAt(1) === backtick &&
            lineaStripped.charAt(2) === backtick;
    },

    /**
     * Formatea un par prompt/respuesta completo para Roam
     * @param {string} promptLimpio - Prompt ya limpiado (una linea)
     * @param {string} responseLimpio - Respuesta ya limpiada
     * @returns {Array<string>} - Lineas formateadas para el intercambio completo
     */
    formatExchange(promptLimpio, responseLimpio) {
        var resultado = [];

        if (!promptLimpio) return resultado;

        // Agregar prompt como bullet principal
        resultado.push('* ' + promptLimpio);

        // Agregar lineas de respuesta formateadas
        if (responseLimpio) {
            var lineasFormateadas = this.formatResponseLines(responseLimpio);
            resultado = resultado.concat(lineasFormateadas);
        }

        // Linea vacia al final del intercambio
        resultado.push('');

        return resultado;
    }
};
