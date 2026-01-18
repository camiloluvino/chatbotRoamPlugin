// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM PARSER
// Converts lines into hierarchical block structure for Roam
// ============================================================================

const ChatbotRoamParser = {
    /**
     * Convierte lineas en estructura jerarquica de bloques
     * Maneja bloques de codigo marcados con [CODE]
     * Maneja tablas Roam con anidacion profunda
     * Soporta multiples niveles: prompt -> respuesta/heading/tabla -> contenido
     */
    parseToBlockStructure(lineas) {
        var result = [];
        var currentPrompt = null;
        var currentHeading = null;  // Track del heading actual para anidar contenido

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (!linea || !linea.trim()) continue;

            // Detectar prompts (nivel 0, empiezan con "* ")
            if (linea.startsWith('* ')) {
                if (currentPrompt) {
                    result.push(currentPrompt);
                }
                currentPrompt = {
                    text: linea.substring(2).trim(),
                    children: []
                };
                currentHeading = null;  // Reset heading al cambiar de prompt
                continue;
            }

            // ================================================================
            // NUEVO: Detectar tabla Roam y procesar estructura completa
            // ================================================================
            if (linea.trim() === '{{[[table]]}}' && currentPrompt) {
                // Recolectar todas las líneas hijas de la tabla
                var tablaLineas = [];
                var j = i + 1;
                while (j < lineas.length && lineas[j].match(/^\s+- /)) {
                    tablaLineas.push(lineas[j]);
                    j++;
                }

                // Construir estructura jerárquica de la tabla
                var bloqueTabla = {
                    text: '{{[[table]]}}',
                    children: this._parseIndentedBlocks(tablaLineas, 8)
                };

                currentPrompt.children.push(bloqueTabla);
                currentHeading = null;  // Reset heading después de tabla
                i = j - 1;  // Saltar las líneas procesadas
                continue;
            }

            // Detectar contenido bajo heading (8 espacios de indentacion)
            if (linea.startsWith('        ') && currentPrompt && currentHeading) {
                var texto = linea.substring(8);

                // Detectar bloque de codigo combinado
                if (texto.startsWith('[CODE]')) {
                    var codigo = texto.substring(6);
                    codigo = codigo.replace(/\{\{NL\}\}/g, '\n');
                    if (codigo) {
                        currentHeading.children.push({
                            text: codigo,
                            children: []
                        });
                    }
                    continue;
                }

                // Linea normal bajo heading - quitar "* " si es un bullet
                var textoLimpio = texto.startsWith('* ') ? texto.substring(2) : texto;
                if (textoLimpio.trim()) {
                    currentHeading.children.push({
                        text: textoLimpio.trim(),
                        children: []
                    });
                }
                continue;
            }

            // Detectar respuestas nivel 1 (indentadas 4 espacios)
            if (linea.startsWith('    ') && currentPrompt) {
                var texto = linea.substring(4);

                // Detectar bloque de codigo combinado
                if (texto.startsWith('[CODE]')) {
                    // Extraer codigo sin el marcador y restaurar los \n
                    var codigo = texto.substring(6);
                    // Restaurar los newlines: {{NL}} -> \n
                    codigo = codigo.replace(/\{\{NL\}\}/g, '\n');
                    if (codigo) {
                        var bloqueCode = {
                            text: codigo,
                            children: []
                        };
                        // Si hay heading activo, agregar como hijo del heading
                        if (currentHeading) {
                            currentHeading.children.push(bloqueCode);
                        } else {
                            currentPrompt.children.push(bloqueCode);
                        }
                    }
                    continue;
                }

                // Linea normal - quitar "* " si es un bullet
                var textoLimpio = texto.startsWith('* ') ? texto.substring(2) : texto;

                // Detectar si es un heading markdown
                var esHeading = textoLimpio.trim().startsWith('#');

                if (textoLimpio.trim()) {
                    var nuevoBloque = {
                        text: textoLimpio.trim(),
                        children: []
                    };
                    currentPrompt.children.push(nuevoBloque);

                    // Si es heading, marcarlo como el heading actual para anidar contenido
                    if (esHeading) {
                        currentHeading = nuevoBloque;
                    } else {
                        // Si no es heading, resetear para que el contenido no se anide
                        currentHeading = null;
                    }
                }
            }
        }

        // Agregar ultimo prompt
        if (currentPrompt) {
            result.push(currentPrompt);
        }

        return result;
    },

    /**
     * Convierte líneas indentadas en estructura anidada de bloques
     * Usado para parsear tablas Roam y otros contenidos con anidación profunda
     * 
     * @param {string[]} lineas - Líneas con formato "    - texto"
     * @param {number} baseIndent - Nivel base de indentación (espacios)
     * @returns {Object[]} - Estructura de bloques anidados
     */
    _parseIndentedBlocks(lineas, baseIndent) {
        if (lineas.length === 0) return [];

        var result = [];
        var stack = [{ indent: baseIndent - 4, children: result }];  // Nivel virtual padre

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];

            // Contar espacios de indentación
            var indent = 0;
            while (indent < linea.length && linea[indent] === ' ') indent++;

            // Extraer texto (quitar "- " al inicio)
            var texto = linea.substring(indent).replace(/^- /, '').trim();
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
