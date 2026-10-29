// ============================================================================
// CHATBOT ROAM PLUGIN - FORMATO GENERICO
// Respaldo para exportaciones que no corresponden a ningun formato conocido
// (ChatGPT, Grok, etc.): turnos "## Prompt:" / "## Response:" y solo la
// limpieza comun
// ============================================================================

const ChatbotRoamFormatoGenerico = {
    id: 'generico',
    nombre: 'Genérico',

    MARCADOR_PROMPT: /^## (?:Prompt|User):/gm,
    MARCADOR_RESPUESTA: /^## (?:Response|Assistant):/gm,

    detectar(contenido) {
        return true;
    },

    opciones: []
};
