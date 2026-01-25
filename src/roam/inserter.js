// ============================================================================
// CHATBOT ROAM PLUGIN - ROAM INSERTER
// Handles block insertion into Roam using the Roam Alpha API
// Includes rollback capability for error recovery
// ============================================================================

const ChatbotRoamInserter = {
    // Configuracion de batching (Ajustado para Roam Rate Limit 1500/min)
    // 22 ops * 60 seg = 1320 ops/min (Margen de seguridad del 12%)
    BATCH_SIZE: 22,
    BATCH_DELAY_MS: 1000,

    /**
     * Elimina bloques por sus UIDs (para rollback en caso de error)
     * Aplica throttling para evitar saturar rate limit durante limpieza
     * @param {Array<string>} uids - Array de UIDs a eliminar
     * @returns {Promise<number>} - Numero de bloques eliminados exitosamente
     * @private
     */
    async _rollbackBlocks(uids) {
        let deleted = 0;
        console.warn('Rollback: Iniciando eliminacion de ' + uids.length + ' bloques...');

        // Eliminar en orden inverso para evitar problemas con padres/hijos
        for (let i = uids.length - 1; i >= 0; i--) {
            // Aplicar Rate Limiting tambien al borrar
            // Cada BATCH_SIZE bloques, esperar BATCH_DELAY_MS
            // i es indice decreciente, asi que chequeamos modulos
            // (uids.length - 1 - i) es el contador de operaciones realizadas
            const opsCount = (uids.length - 1) - i;
            if (opsCount > 0 && opsCount % this.BATCH_SIZE === 0) {
                await this._delay(this.BATCH_DELAY_MS);
            }

            const uid = uids[i];
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
     * Utilidad para esperar (promisified timeout)
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        // Estado GLOBAL de insercion para este proceso
        // Pasado por referencia a todas las llamadas recursivas
        const context = {
            allInsertedUids: [],
            totalOpsEstimate: this._estimateTotalBlocks(bloques),
            opsCount: 0,
            cancelToken: cancelToken
        };

        try {
            const result = await this._insertBlocksInternal(parentUid, bloques, startOrder, context, onProgress);
            return {
                success: true,
                insertedBlocks: result,
                insertedCount: context.allInsertedUids.length,
                error: null,
                rolledBackCount: 0
            };
        } catch (error) {
            // Error durante insercion - hacer rollback GLOBAL
            console.error('Error durante insercion, iniciando rollback de ' + context.allInsertedUids.length + ' bloques...');

            // Si es cancelacion, mostrar mensaje especifico en log
            if (error.message === 'OPERACION_CANCELADA_POR_USUARIO') {
                console.info('Causa: Cancelacion por usuario');
            }

            const rolledBack = await this._rollbackBlocks(context.allInsertedUids);
            console.log('Rollback completado: ' + rolledBack + '/' + context.allInsertedUids.length + ' bloques eliminados');

            return {
                success: false,
                insertedBlocks: [],
                insertedCount: context.allInsertedUids.length,
                error: error.message,
                rolledBackCount: rolledBack
            };
        }
    },

    /**
     * Estima el total de bloques a insertar para el progreso
     */
    _estimateTotalBlocks(bloques) {
        let count = 0;
        for (const b of bloques) {
            count++;
            if (b.children && b.children.length > 0) {
                count += this._estimateTotalBlocks(b.children);
            }
        }
        return count;
    },

    /**
     * Logica interna de insercion recursiva con batching y cancelacion
     * @private
     */
    async _insertBlocksInternal(parentUid, bloques, startOrder, context, onProgress) {
        const insertedBlocks = [];

        for (let i = 0; i < bloques.length; i++) {
            // 1. Verificar Cancelacion
            if (context.cancelToken && context.cancelToken.cancelled) {
                throw new Error('OPERACION_CANCELADA_POR_USUARIO');
            }

            // 2. Check batch limit (Rate Limiting)
            if (context.opsCount > 0 && context.opsCount % this.BATCH_SIZE === 0) {
                // Yield al UI thread y esperar para respetar rate limit
                await this._delay(this.BATCH_DELAY_MS);
            }

            // Verificar Cancelacion de nuevo tras el delay (ui input puede haber ocurrido)
            if (context.cancelToken && context.cancelToken.cancelled) {
                throw new Error('OPERACION_CANCELADA_POR_USUARIO');
            }

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

            // Crear bloque
            const blockData = {
                location: { "parent-uid": parentUid, order: startOrder + i },
                block: { uid: blockUid, string: texto }
            };

            if (headingLevel > 0) {
                blockData.block.heading = headingLevel;
            }

            // Insertar
            await window.roamAlphaAPI.data.block.create(blockData);

            // Actualizar estado global
            context.allInsertedUids.push(blockUid);
            insertedBlocks.push(blockUid);
            context.opsCount++;

            // Reportar progreso
            if (onProgress) {
                // Reportar cada bloque o cada pocos bloques
                if (context.opsCount % 2 === 0 || context.opsCount === context.totalOpsEstimate) {
                    onProgress(context.opsCount, context.totalOpsEstimate);
                }
            }

            // Insertar hijos recursivamente
            if (bloque.children && bloque.children.length > 0) {
                const childBlocks = await this._insertBlocksInternal(blockUid, bloque.children, 0, context, onProgress);
                insertedBlocks.push(...childBlocks);
            }
        }

        return insertedBlocks;
    }
};
