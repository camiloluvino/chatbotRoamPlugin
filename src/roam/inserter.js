// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM INSERTER
// Handles block insertion into Roam using the Roam Alpha API
// ============================================================================

const ChatbotRoamInserter = {
    /**
     * Inserta bloques recursivamente en Roam usando la API correcta
     * Detecta headings markdown y los convierte a headings nativos de Roam
     */
    async insertBlocksRecursively(parentUid, bloques, startOrder) {
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

            await window.roamAlphaAPI.data.block.create(blockData);

            // Insertar hijos recursivamente
            if (bloque.children && bloque.children.length > 0) {
                await this.insertBlocksRecursively(blockUid, bloque.children, 0);
            }
        }
    }
};
