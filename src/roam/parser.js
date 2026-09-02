// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM PARSER
// Converts lines into hierarchical block structure for Roam
// ============================================================================

const ChatbotRoamParser = {
    /**
     * Convierte lineas en estructura jerarquica de bloques
     * Maneja bloques de codigo marcados con [CODE]
     * Maneja tablas Roam con anidacion profunda
     * Soporta multiples niveles: prompt -> respuesta/headings (h1..h6) -> listas/contenido anidado
     */
    parseToBlockStructure(lineas) {
        var result = [];
        var currentPrompt = null;
        var responseBuffer = [];

        var flushPrompt = function () {
            if (currentPrompt) {
                if (responseBuffer.length > 0) {
                    currentPrompt.children = ChatbotRoamParser._parseIndentedBlocks(responseBuffer, 4);
                    responseBuffer = [];
                }
                result.push(currentPrompt);
            }
        };

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (!linea || !linea.trim()) continue;

            // Detectar prompts (nivel 0, empiezan con "* ")
            if (linea.startsWith('* ')) {
                flushPrompt();
                currentPrompt = {
                    text: linea.substring(2).trim(),
                    children: []
                };
                continue;
            }

            // Si es linea de respuesta (indentada), acumular en buffer
            if (currentPrompt) {
                responseBuffer.push(linea);
            }
        }

        flushPrompt();
        return result;
    },

    /**
     * Convierte líneas indentadas en estructura anidada de bloques
     * Usado para parsear tablas Roam, headings con sub-headings y listas anidadas
     * 
     * @param {string[]} lineas - Líneas con formato indentado ("    texto", "        texto", etc.)
     * @param {number} baseIndent - Nivel base de indentación (espacios)
     * @returns {Object[]} - Estructura de bloques anidados
     */
    _parseIndentedBlocks(lineas, baseIndent) {
        if (!lineas || lineas.length === 0) return [];

        var result = [];
        var stack = [{ indent: baseIndent - 4, children: result }];  // Nivel virtual padre

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (!linea || !linea.trim()) continue;

            // Contar espacios de indentación
            var indent = 0;
            while (indent < linea.length && linea[indent] === ' ') indent++;

            var rawText = linea.substring(indent);
            var texto = '';

            // Detectar bloque de codigo combinado
            if (rawText.startsWith('[CODE]')) {
                texto = rawText.substring(6).replace(/\{\{NL\}\}/g, '\n');
            } else {
                // Quitar viñetas "* " o "- " al inicio
                texto = rawText;
                if (texto.startsWith('* ') || texto.startsWith('- ')) {
                    texto = texto.substring(2);
                }
                texto = texto.trim();
            }

            if (!texto) continue;

            var nuevoBloque = { text: texto, children: [] };

            // Encontrar el padre correcto basándose en la indentación
            while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }

            // Agregar como hijo del padre actual
            stack[stack.length - 1].children.push(nuevoBloque);

            // Agregar a la pila para posibles hijos
            stack.push({ indent: indent, children: nuevoBloque.children });
        }

        return result;
    }
};
