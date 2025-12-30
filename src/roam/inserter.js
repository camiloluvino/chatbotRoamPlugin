// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM INSERTER
// Handles block insertion into Roam using the Roam Alpha API
// ============================================================================

const ChatbotRoamInserter = {
    /**
     * Inserta bloques recursivamente en Roam usando la API correcta
     * Detecta headings markdown y los convierte a headings nativos de Roam
     * @param {string} parentUid - UID del bloque padre
     * @param {Array} bloques - Array de bloques a insertar
     * @param {number} startOrder - Orden inicial para los bloques
     * @returns {Promise<Array>} - Array de UIDs de bloques insertados
     * @throws {Error} - Si falla la insercion de algun bloque
     */
    async insertBlocksRecursively(parentUid, bloques, startOrder) {
        var insertedBlocks = [];

        for (var i = 0; i < bloques.length; i++) {
            var bloque = bloques[i];
            var blockUid = window.roamAlphaAPI.util.generateUID();
            var texto = bloque.text;
            var headingLevel = 0;

            // Detectar nivel de heading (### = 3, ## = 2, # = 1)
            if (texto.startsWith('### ')) {
                headingLevel = 3;
                texto = texto.substring(4).trim();
            } else if (texto.startsWith('## ')) {
                headingLevel = 2;
                texto = texto.substring(3).trim();
            } else if (texto.startsWith('# ')) {
                headingLevel = 1;
                texto = texto.substring(2).trim();
            }

            // Crear bloque con o sin heading
            var blockData = {
                location: { "parent-uid": parentUid, order: startOrder + i },
                block: { uid: blockUid, string: texto }
            };

            // Agregar heading si corresponde
            if (headingLevel > 0) {
                blockData.block.heading = headingLevel;
            }

            try {
                await window.roamAlphaAPI.data.block.create(blockData);
                insertedBlocks.push(blockUid);
            } catch (error) {
                var textoPreview = texto.length > 50 ? texto.substring(0, 50) + '...' : texto;
                console.error('Error insertando bloque ' + (i + 1) + '/' + bloques.length + ':', error);
                throw new Error('Fallo al insertar bloque: "' + textoPreview + '" - ' + error.message);
            }

            // Insertar hijos recursivamente
            if (bloque.children && bloque.children.length > 0) {
                try {
                    var childBlocks = await this.insertBlocksRecursively(blockUid, bloque.children, 0);
                    insertedBlocks = insertedBlocks.concat(childBlocks);
                } catch (error) {
                    // Re-lanzar con contexto adicional
                    throw new Error('Error en hijos de "' + texto.substring(0, 30) + '...": ' + error.message);
                }
            }
        }

        return insertedBlocks;
    }
};
