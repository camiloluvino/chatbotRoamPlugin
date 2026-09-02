// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM INSERTER
// Handles block insertion into Roam using the Roam Alpha API
// Includes rollback capability for error recovery
// ============================================================================

const ChatbotRoamInserter = {
    // Configuración de batching con respeto al rate limit de Roam
    // Rate limit de Roam: 1500 mutaciones por 60000ms
    // Con BATCH_SIZE=50 y target de ~1200/min (80% del límite para margen de seguridad):
    // delay = 60000 / (1200/50) = 2500ms entre lotes
    BATCH_SIZE: 50,
    ROAM_RATE_LIMIT: 1500,        // mutaciones máximas por ventana
    ROAM_RATE_WINDOW_MS: 60000,   // ventana del rate limit (60s)
    RATE_LIMIT_SAFETY: 0.80,      // usar 80% del límite para dejar margen

    // Flag para detectar disponibilidad del batch API (se evalúa una sola vez)
    _batchApiChecked: false,
    _hasBatchApi: false,
    _batchApiType: 'none', // 'actions', 'function', o 'none'

    /**
     * Calcula el delay necesario entre lotes para respetar el rate limit
     * @param {number} batchSize - Tamaño del lote enviado
     * @returns {number} - Milisegundos de espera
     * @private
     */
    _calculateDelay(batchSize) {
        const effectiveLimit = this.ROAM_RATE_LIMIT * this.RATE_LIMIT_SAFETY;
        const batchesPerWindow = effectiveLimit / batchSize;
        return Math.ceil(this.ROAM_RATE_WINDOW_MS / batchesPerWindow);
    },

    /**
     * Detecta si la batch API está disponible (una sola vez, cachea resultado)
     * @returns {boolean}
     * @private
     */
    _checkBatchApi() {
        if (!this._batchApiChecked) {
            try {
                const api = window.roamAlphaAPI;
                const hasApi = !!api;
                const hasData = !!(api && api.data);
                const hasBatch = !!(api && api.data && api.data.batch);
                const hasActions = !!(hasBatch && typeof api.data.batch.actions === 'function');
                const isBatchFunction = !!(hasBatch && typeof api.data.batch === 'function');

                console.log('ChatbotRoamInserter API Check:', {
                    hasApi,
                    hasData,
                    hasBatch,
                    hasActions,
                    isBatchFunction
                });

                if (hasActions) {
                    this._hasBatchApi = true;
                    this._batchApiType = 'actions';
                } else if (isBatchFunction) {
                    this._hasBatchApi = true;
                    this._batchApiType = 'function';
                } else {
                    this._hasBatchApi = false;
                    this._batchApiType = 'none';
                }
            } catch (e) {
                console.error('Error checking Roam Batch API:', e);
                this._hasBatchApi = false;
                this._batchApiType = 'none';
            }
            this._batchApiChecked = true;
            if (!this._hasBatchApi) {
                console.warn('ChatbotRoamInserter: batch API no disponible, usando fallback individual (más lento).');
            } else {
                console.log('ChatbotRoamInserter: batch API disponible usando método "' + this._batchApiType + '".');
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
                if (this._batchApiType === 'actions') {
                    await window.roamAlphaAPI.data.batch.actions({
                        action: "batch-actions",
                        actions: actions
                    });
                } else if (this._batchApiType === 'function') {
                    await window.roamAlphaAPI.data.batch(actions);
                }
                return; // Batch exitoso, salir
            } catch (batchError) {
                // Si es rate limit, NO invalidar la API — solo propagar el error
                if (batchError && batchError.message && batchError.message.includes('rate limit')) {
                    throw batchError;
                }
                // Batch API falló por otra razón — invalidar cache y usar fallback
                console.warn('ChatbotRoamInserter: batch.actions falló en runtime, cambiando a fallback individual.', batchError);
                this._hasBatchApi = false;
                this._batchApiChecked = true;
                this._batchApiType = 'none';
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
     * Utiliza batch.actions para velocidad, respetando rate limit
     * @param {Array<string>} uids - Array de UIDs a eliminar
     * @returns {Promise<number>} - Numero de bloques eliminados exitosamente
     * @private
     */
    async _rollbackBlocks(uids) {
        let deleted = 0;
        console.warn('Rollback: Iniciando eliminacion de ' + uids.length + ' bloques...');

        const rollbackBatchSize = this.BATCH_SIZE;
        const rollbackDelay = this._calculateDelay(rollbackBatchSize);

        // Eliminar en orden inverso (de abajo hacia arriba)
        for (let i = uids.length; i > 0; i -= rollbackBatchSize) {
            const start = Math.max(0, i - rollbackBatchSize);
            const batchUids = uids.slice(start, i).reverse();

            const actions = batchUids.map(uid => ({
                action: "delete-block",
                block: { uid: uid }
            }));

            try {
                await this._executeBatch(actions);
                deleted += actions.length;
            } catch (e) {
                // Si es rate limit durante rollback, esperar más y reintentar
                if (e && e.message && e.message.includes('rate limit')) {
                    console.warn('Rollback: rate limit alcanzado, esperando 10s antes de reintentar...');
                    await this._delay(10000);
                    try {
                        await this._executeBatch(actions);
                        deleted += actions.length;
                    } catch (retryError) {
                        console.warn('Rollback: reintento fallido, saltando lote', retryError);
                    }
                } else {
                    console.warn('Rollback: No se pudo eliminar el lote de bloques', e);
                }
            }
            // Respetar rate limit entre lotes de rollback
            if (start > 0) {
                await this._delay(rollbackDelay);
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

            if (texto.startsWith('###### ')) {
                headingLevel = 3;
                texto = texto.substring(7).trim();
            } else if (texto.startsWith('##### ')) {
                headingLevel = 3;
                texto = texto.substring(6).trim();
            } else if (texto.startsWith('#### ')) {
                headingLevel = 3;
                texto = texto.substring(5).trim();
            } else if (texto.startsWith('### ')) {
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
     * Respeta el rate limit de Roam (1500 mutaciones / 60s)
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

        // Calcular delay basado en rate limit
        const batchDelay = this._calculateDelay(this.BATCH_SIZE);
        const totalBatches = Math.ceil(actions.length / this.BATCH_SIZE);
        const estimatedSeconds = Math.ceil((totalBatches * batchDelay) / 1000);
        console.log('ChatbotRoamInserter: ' + actions.length + ' bloques en ' + totalBatches + ' lotes de ' + this.BATCH_SIZE + ', delay ' + batchDelay + 'ms (~' + estimatedSeconds + 's estimados)');

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

                // Respetar rate limit entre lotes
                if (i + this.BATCH_SIZE < actions.length) {
                    await this._delay(batchDelay);
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
