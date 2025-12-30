// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM INSERTER
// Handles block insertion into Roam using the Roam Alpha API
// Includes rollback capability for error recovery
// ============================================================================

const ChatbotRoamInserter = {
    /**
     * Elimina bloques por sus UIDs (para rollback en caso de error)
     * @param {Array<string>} uids - Array de UIDs a eliminar
     * @returns {Promise<number>} - Numero de bloques eliminados exitosamente
     * @private
     */
    async _rollbackBlocks(uids) {
        let deleted = 0;
        for (const uid of uids) {
            try {
                await window.roamAlphaAPI.data.block.delete({ block: { uid: uid } });
                deleted++;
            } catch (e) {
                // Ignorar errores de eliminacion (el bloque puede ya no existir)
                console.warn('Rollback: No se pudo eliminar bloque ' + uid, e);
            }
        }
        return deleted;
    },

    /**
     * Inserta bloques recursivamente en Roam con soporte de rollback
     * Si ocurre un error, automaticamente elimina los bloques ya insertados
     * 
     * @param {string} parentUid - UID del bloque padre
     * @param {Array} bloques - Array de bloques a insertar
     * @param {number} startOrder - Orden inicial para los bloques
     * @returns {Promise<Object>} - { success, insertedBlocks, insertedCount, error, rolledBackCount }
     */
    async insertBlocksRecursively(parentUid, bloques, startOrder) {
        const allInsertedUids = [];

        try {
            const result = await this._insertBlocksInternal(parentUid, bloques, startOrder, allInsertedUids);
            return {
                success: true,
                insertedBlocks: result,
                insertedCount: allInsertedUids.length,
                error: null,
                rolledBackCount: 0
            };
        } catch (error) {
            // Error durante insercion - hacer rollback
            console.error('Error durante insercion, iniciando rollback de ' + allInsertedUids.length + ' bloques...');
            const rolledBack = await this._rollbackBlocks(allInsertedUids);
            console.log('Rollback completado: ' + rolledBack + '/' + allInsertedUids.length + ' bloques eliminados');

            return {
                success: false,
                insertedBlocks: [],
                insertedCount: allInsertedUids.length,
                error: error.message,
                rolledBackCount: rolledBack
            };
        }
    },

    /**
     * Logica interna de insercion recursiva
     * @private
     */
    async _insertBlocksInternal(parentUid, bloques, startOrder, allInsertedUids) {
        const insertedBlocks = [];

        for (let i = 0; i < bloques.length; i++) {
            const bloque = bloques[i];
            const blockUid = window.roamAlphaAPI.util.generateUID();
            let texto = bloque.text;
            let headingLevel = 0;

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
            const blockData = {
                location: { "parent-uid": parentUid, order: startOrder + i },
                block: { uid: blockUid, string: texto }
            };

            // Agregar heading si corresponde
            if (headingLevel > 0) {
                blockData.block.heading = headingLevel;
            }

            // Intentar insertar
            await window.roamAlphaAPI.data.block.create(blockData);
            allInsertedUids.push(blockUid);
            insertedBlocks.push(blockUid);

            // Insertar hijos recursivamente
            if (bloque.children && bloque.children.length > 0) {
                const childBlocks = await this._insertBlocksInternal(blockUid, bloque.children, 0, allInsertedUids);
                insertedBlocks.push(...childBlocks);
            }
        }

        return insertedBlocks;
    }
};
