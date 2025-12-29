// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM PARSER
// Converts lines into hierarchical block structure for Roam
// ============================================================================

const ChatbotRoamParser = {
    /**
     * Convierte lineas en estructura jerarquica de bloques
     * Maneja bloques de codigo marcados con [CODE]
     * Soporta 3 niveles: prompt -> respuesta/heading -> contenido bajo heading
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
    }
};
