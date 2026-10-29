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
            id: 'eliminar_razonamiento',
            label: 'Quitar el razonamiento del modelo',
            visible: true,
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoClaude.eliminarPensamiento(texto); }
        }
    ],

    /**
     * Elimina los bloques de pensamiento, que se presentan como citas (líneas consecutivas
     * que empiezan con '>'). Es pensamiento la cita con la que empieza la respuesta, aunque
     * sea de una sola línea, y cualquier cita que contenga la firma '- **Done**'.
     */
    eliminarPensamiento(texto) {
        const lineas = texto.split('\n');
        const lineasLimpias = [];
        let bloqueActual = [];

        // Cita inicial: el exportador pone ahí el resumen del razonamiento
        let inicio = 0;
        while (inicio < lineas.length && lineas[inicio].trim() === '') inicio++;
        if (inicio < lineas.length && lineas[inicio].trim().startsWith('>')) {
            while (inicio < lineas.length && lineas[inicio].trim().startsWith('>')) inicio++;
            lineas.splice(0, inicio);
        }

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
