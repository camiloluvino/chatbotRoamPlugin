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
     * Maneja headings markdown (h1 a h6), listas anidadas, bloques de codigo, tablas Roam y texto normal
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
        var enTablaRoam = false;

        // Pila para rastrear la profundidad de headings (#, ##, ###, etc.)
        // Cada elemento es { hLevel: number, indentSpaces: number }
        var headingStack = [];

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
                var currentIndent = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;
                resultado.push(' '.repeat(currentIndent) + lineaStripped);
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
                    var espaciosTabla = 0;
                    while (espaciosTabla < linea.length && linea[espaciosTabla] === ' ') espaciosTabla++;
                    var currentBaseIndent = headingStack.length > 0
                        ? headingStack[headingStack.length - 1].indentSpaces
                        : 0;
                    resultado.push(' '.repeat(currentBaseIndent + espaciosTabla) + linea.trim());
                    continue;
                } else {
                    enTablaRoam = false;
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
                    var currentIndent = headingStack.length > 0
                        ? headingStack[headingStack.length - 1].indentSpaces + 4
                        : 4;
                    resultado.push(' '.repeat(currentIndent) + '[CODE]' + codigoBuffer.join('{{NL}}'));
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

            // Headings markdown (#, ##, ###, ####, etc.)
            var matchHeading = lineaStripped.match(/^(#{1,6})\s+(.*)$/);
            var esNegritaCompleta = lineaStripped.startsWith('**') && lineaStripped.endsWith('**') && lineaStripped.length > 4 && !lineaStripped.substring(2, lineaStripped.length - 2).includes('**');

            if (matchHeading) {
                var hLevel = matchHeading[1].length;

                // Desapilar headings de nivel igual o mayor
                while (headingStack.length > 0 && headingStack[headingStack.length - 1].hLevel >= hLevel) {
                    headingStack.pop();
                }

                var indent = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;

                headingStack.push({ hLevel: hLevel, indentSpaces: indent });
                resultado.push(' '.repeat(indent) + lineaStripped);
            }
            else if (esNegritaCompleta) {
                // Linea completamente en negrita tratada como encabezado
                var indent = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;
                headingStack.push({ hLevel: 99, indentSpaces: indent });
                resultado.push(' '.repeat(indent) + lineaStripped);
            }
            // Listas (*, -, o numeradas)
            else if (lineaStripped.startsWith('* ') || lineaStripped.startsWith('- ') || /^\d+\.\s+/.test(lineaStripped)) {
                var espaciosOriginales = 0;
                while (espaciosOriginales < linea.length && linea[espaciosOriginales] === ' ') espaciosOriginales++;
                var nivelListaExtra = Math.floor(espaciosOriginales / 2) * 4;

                var indentBase = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;

                var itemText = lineaStripped.replace(/^[\*\-]\s+/, '');
                resultado.push(' '.repeat(indentBase + nivelListaExtra) + '* ' + itemText);
            }
            // Texto normal
            else {
                var indent = headingStack.length > 0
                    ? headingStack[headingStack.length - 1].indentSpaces + 4
                    : 4;
                resultado.push(' '.repeat(indent) + '* ' + lineaStripped);
            }
        }

        // Si quedo codigo sin cerrar, agregarlo
        if (codigoBuffer.length > 0) {
            var currentIndent = headingStack.length > 0
                ? headingStack[headingStack.length - 1].indentSpaces + 4
                : 4;
            resultado.push(' '.repeat(currentIndent) + '[CODE]' + codigoBuffer.join('{{NL}}'));
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
