// ============================================================================
// CHATBOT ROAM PLUGIN - FORMATO NOTEBOOKLM
// Exportaciones de NotebookLM: cabecera YAML con "source: NotebookLM" y turnos
// "### 🧑 **User**" / "### 🤖 **NotebookLM**" (versiones anteriores en chino
// 用户 / 助手, o en español)
// ============================================================================

const ChatbotRoamFormatoNotebookLM = {
    id: 'notebooklm',
    nombre: 'NotebookLM',

    MARCADOR_PROMPT: /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?(?:User|Usuario|用户|Prompt)(?:\*\*)?\s*$/gmi,
    MARCADOR_RESPUESTA: /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?(?:NotebookLM|Assistant|Asistente|助手|Response)(?:\*\*)?\s*$/gmi,

    detectar(contenido) {
        if (!contenido) return false;
        if (/source:\s*NotebookLM/i.test(contenido)) return true;
        const conPrompt = new RegExp(this.MARCADOR_PROMPT.source, 'mi').test(contenido);
        const conRespuesta = new RegExp(this.MARCADOR_RESPUESTA.source, 'mi').test(contenido);
        if (conPrompt && conRespuesta) return true;
        return /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?NotebookLM(?:\*\*)?\s*$/mi.test(contenido);
    },

    opciones: [
        {
            id: 'separar_headers_colisionados_notebooklm',
            label: 'Separar títulos colisionados',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoNotebookLM.separarHeadersColisionados(texto); }
        },
        {
            id: 'normalizar_vinetas_notebooklm',
            label: 'Normalizar viñetas (•, ◦)',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoNotebookLM.normalizarVinetas(texto); }
        },
        {
            id: 'eliminar_fuentes_notebooklm',
            label: 'Eliminar fuentes/sources (NotebookLM)',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoNotebookLM.eliminarFuentes(texto); }
        }
    ],

    /**
     * Limpieza que siempre se aplica a las respuestas, al final del proceso
     */
    limpiezaFinalRespuesta(texto) {
        return this.limpiarEscapes(texto);
    },

    /**
     * Limpia escapes innecesarios, como "1\." que debería ser "1.",
     * y elimina el prefijo "Thoughts" aislado al inicio de respuestas.
     */
    limpiarEscapes(texto) {
        // Eliminar línea aislada "Thoughts" al inicio de respuesta
        texto = texto.replace(/^Thoughts\s*\n+/i, '');
        // Reemplazar "numero\." por "numero."
        texto = texto.replace(/(\d+)\\\./g, '$1.');
        // Reemplazar "\-" por "-" (por si acaso)
        texto = texto.replace(/\\-/g, '-');
        return texto;
    },

    /**
     * Elimina el bloque de fuentes citado al final de la respuesta.
     * Ejemplo:
     * > **Sources:**
     * > [1] archivo.pdf
     */
    eliminarFuentes(texto) {
        return texto.replace(/> \*\*(?:来源[:：]|Sources[:：]|Fuentes[:：])\*\*(?:\r?\n> \[\d+\].*)*/gi, '');
    },

    /**
     * Separa el texto colisionado tras un cierre de negritas
     * Asegura que el patrón **Texto**Descripción se convierta en **Texto**\nDescripción
     */
    separarHeadersColisionados(texto) {
        return texto.replace(/(\S)\*\*([A-ZÁÉÍÓÚÑ¿¡])/g, '$1**\n$2');
    },

    /**
     * Normaliza las viñetas (•, ◦) para asegurar saltos de línea y formato correcto.
     */
    normalizarVinetas(texto) {
        // 1. Reemplazar viñeta sólida "• " por salto + guión "- "
        // Se usa \n- para garantizar que quede en su propia línea
        texto = texto.replace(/• /g, '\n- ');

        // 2. Reemplazar viñeta hueca "◦ " por salto + indentación + guión
        // Se asume nivel 1 de indentación (4 espacios)
        texto = texto.replace(/◦ /g, '\n    - ');

        // Limpieza de posibles saltos dobles introducidos si ya había saltos
        texto = texto.replace(/\n\n- /g, '\n- ');
        texto = texto.replace(/\n\n    - /g, '\n    - ');

        return texto;
    }
};
