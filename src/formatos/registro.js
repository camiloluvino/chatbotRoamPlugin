// ============================================================================
// CHATBOT ROAM PLUGIN - REGISTRO DE FORMATOS
// Para soportar un formato nuevo: crear src/formatos/<nombre>.js con la misma
// forma que los existentes, agregarlo aqui y en scripts/build.js
// ============================================================================

const ChatbotRoamFormatos = {
    /**
     * Formatos en orden de deteccion. El generico va al final porque acepta cualquier archivo.
     */
    lista() {
        return [
            ChatbotRoamFormatoNotebookLM,
            ChatbotRoamFormatoClaude,
            ChatbotRoamFormatoGemini,
            ChatbotRoamFormatoGenerico
        ];
    },

    /**
     * Devuelve el formato que corresponde al contenido de un archivo
     */
    detectar(contenido) {
        const formatos = this.lista();
        for (let i = 0; i < formatos.length; i++) {
            if (formatos[i].detectar(contenido)) return formatos[i];
        }
        return ChatbotRoamFormatoGenerico;
    },

    porId(id) {
        return this.lista().find(f => f.id === id) || null;
    }
};
