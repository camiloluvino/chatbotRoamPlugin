// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM INSERTER
// Handles block insertion into Roam using the Roam Alpha API
// Includes rollback capability for error recovery
// ============================================================================

const ChatbotRoamInserter = {
    // Configuración de batching mejorada usando batch.actions
    // Lotes más grandes reducen peticiones, delay pequeño evita congelar UI
    BATCH_SIZE: 50,
    BATCH_DELAY_MS: 50,

    // Flag para detectar disponibilidad del batch API (se evalúa una sola vez)
    _batchApiChecked: false,
    _hasBatchApi: false,

    /**
     * Detecta si la batch API está disponible (una sola vez, cachea resultado)
     * @returns {boolean}
     * @private
     */
    _checkBatchApi() {
        if (!this._batchApiChecked) {
            try {
                this._hasBatchApi = !!(window.roamAlphaAPI &&
                    window.roamAlphaAPI.data &&
                    window.roamAlphaAPI.data.batch &&
                    typeof window.roamAlphaAPI.data.batch.actions === 'function');
            } catch (e) {
                this._hasBatchApi = false;
            }
            this._batchApiChecked = true;
            if (!this._hasBatchApi) {
                console.warn('ChatbotRoamInserter: batch API no disponible, usando fallback individual (más lento).');
            }
        }
        return this._hasBatchApi;
    },

    /**
     * Ejecuta un lote de acciones, con fallback a ejecución individual
     * @param {Array} actions - Array de acciones batch
     * @returns {Promise<void>}
     * @private
     */
    async _executeBatch(actions) {
        if (this._checkBatchApi()) {
            try {
                await window.roamAlphaAPI.data.batch.actions({
                    action: "batch-actions",
                    actions: actions
                });
                return; // Batch exitoso, salir
            } catch (batchError) {
                // Batch API falló en runtime — invalidar cache y usar fallback
                console.warn('ChatbotRoamInserter: batch.actions falló en runtime, cambiando a fallback individual.', batchError);
                this._hasBatchApi = false;
                this._batchApiChecked = true;
            }
        }
        // Fallback: ejecutar cada acción individualmente
        for (const action of actions) {
            if (action.action === 'create-block') {
                await window.roamAlphaAPI.createBlock({
                    location: action.location,
                    block: action.block
                });
            } else if (action.action === 'delete-block') {
                await window.roamAlphaAPI.deleteBlock({
                    block: action.block
                });
            }
        }
    },

    /**
     * Elimina bloques por sus UIDs (para rollback en caso de error)
     * Utiliza batch.actions para velocidad
     * @param {Array<string>} uids - Array de UIDs a eliminar
     * @returns {Promise<number>} - Numero de bloques eliminados exitosamente
     * @private
     */
    async _rollbackBlocks(uids) {
        let deleted = 0;
        console.warn('Rollback: Iniciando eliminacion de ' + uids.length + ' bloques...');

        // Eliminar en orden inverso (de abajo hacia arriba)
        for (let i = uids.length; i > 0; i -= this.BATCH_SIZE) {
            const start = Math.max(0, i - this.BATCH_SIZE);
            const batchUids = uids.slice(start, i).reverse();

            const actions = batchUids.map(uid => ({
                action: "delete-block",
                block: { uid: uid }
            }));

            try {
                await this._executeBatch(actions);
                deleted += actions.length;
            } catch (e) {
                console.warn('Rollback: No se pudo eliminar el lote de bloques', e);
            }
            // Yield UI
            if (start > 0) {
                await this._delay(this.BATCH_DELAY_MS);
            }
        }
        return deleted;
    },

    /**
     * Utilidad para esperar (promisified timeout)
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Aplana un árbol de bloques en un array de acciones de creación
     * @private
     */
    _flattenBlocks(parentUid, bloques, startOrder) {
        let actions = [];
        for (let i = 0; i < bloques.length; i++) {
            const bloque = bloques[i];
            const blockUid = window.roamAlphaAPI.util.generateUID();

            let texto = bloque.text;
            let headingLevel = 0;

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

            const action = {
                action: "create-block",
                location: { "parent-uid": parentUid, order: startOrder + i },
                block: { uid: blockUid, string: texto }
            };

            if (headingLevel > 0) {
                action.block.heading = headingLevel;
            }

            actions.push(action);

            if (bloque.children && bloque.children.length > 0) {
                const childActions = this._flattenBlocks(blockUid, bloque.children, 0);
                actions = actions.concat(childActions);
            }
        }
        return actions;
    },

    /**
     * Inserta bloques recursivamente en Roam con soporte de rollback, batching y cancelacion
     * Si ocurre un error o se cancela, automaticamente elimina los bloques ya insertados
     * 
     * @param {string} parentUid - UID del bloque padre
     * @param {Array} bloques - Array de bloques a insertar
     * @param {number} startOrder - Orden inicial para los bloques
     * @param {Object} cancelToken - Objeto { cancelled: boolean } compartido con UI
     * @param {Function} onProgress - Callback opcional (insertedCount, total) => void
     * @returns {Promise<Object>} - { success, insertedBlocks, insertedCount, error, rolledBackCount }
     */
    async insertBlocksRecursively(parentUid, bloques, startOrder, cancelToken, onProgress) {
        const actions = this._flattenBlocks(parentUid, bloques, startOrder);
        const totalOpsEstimate = actions.length;
        const allInsertedUids = [];

        try {
            for (let i = 0; i < actions.length; i += this.BATCH_SIZE) {
                if (cancelToken && cancelToken.cancelled) {
                    throw new Error('OPERACION_CANCELADA_POR_USUARIO');
                }

                const batchActions = actions.slice(i, i + this.BATCH_SIZE);

                await this._executeBatch(batchActions);

                const batchUids = batchActions.map(a => a.block.uid);
                allInsertedUids.push(...batchUids);

                if (onProgress) {
                    onProgress(allInsertedUids.length, totalOpsEstimate);
                }

                // Pausa para liberar el hilo de UI
                if (i + this.BATCH_SIZE < actions.length) {
                    await this._delay(this.BATCH_DELAY_MS);
                }
            }

            return {
                success: true,
                insertedBlocks: allInsertedUids,
                insertedCount: allInsertedUids.length,
                error: null,
                rolledBackCount: 0
            };
        } catch (error) {
            console.error('Error durante insercion, iniciando rollback de ' + allInsertedUids.length + ' bloques...');
            if (error.message === 'OPERACION_CANCELADA_POR_USUARIO') {
                console.info('Causa: Cancelacion por usuario');
            }

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
    }
};
