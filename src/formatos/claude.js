// ============================================================================
// CHATBOT ROAM PLUGIN - FORMATO CLAUDE
// Exportaciones de Claude: turnos "## User:" / "## Assistant:", con la marca de
// tiempo en una cita bajo cada turno y el razonamiento como cita al inicio de
// la respuesta
// ============================================================================

const ChatbotRoamFormatoClaude = {
    id: 'claude',
    nombre: 'Claude',

    MARCADOR_PROMPT: /^## User:/gm,
    MARCADOR_RESPUESTA: /^## Assistant:/gm,

    detectar(contenido) {
        return /^## User:/m.test(contenido) && /^## Assistant:/m.test(contenido);
    },

    opciones: [
        {
            id: 'eliminar_thinking_blockquotes_claude',
            label: 'Bloques de pensamiento (Claude V2)',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoClaude.eliminarPensamiento(texto); }
        }
    ],

    /**
     * Elimina los bloques de pensamiento que se presentan en formato blockquote
     * (líneas consecutivas que empiezan con '>'). Solo los elimina si el bloque contiene
     * la firma de finalización de pensamiento '- **Done**'.
     */
    eliminarPensamiento(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];
        let bloqueActual = [];

        for (const linea of lineas) {
            const lineaStripped = linea.trim();

            if (lineaStripped.startsWith('>')) {
                bloqueActual.push(linea);
            } else {
                if (bloqueActual.length > 0) {
                    const esThinkingBlock = bloqueActual.some(line => /- \*\*Done\*\*/i.test(line));
                    if (!esThinkingBlock) {
                        for (let k = 0; k < bloqueActual.length; k++) {
                            lineasLimpias.push(bloqueActual[k]);
                        }
                    }
                    bloqueActual = [];
                }
                lineasLimpias.push(linea);
            }
        }

        if (bloqueActual.length > 0) {
            const esThinkingBlock = bloqueActual.some(line => /- \*\*Done\*\*/i.test(line));
            if (!esThinkingBlock) {
                for (let k = 0; k < bloqueActual.length; k++) {
                    lineasLimpias.push(bloqueActual[k]);
                }
            }
        }

        return lineasLimpias.join('\n');
    }
};
