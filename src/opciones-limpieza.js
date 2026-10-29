// ============================================================================
// CHATBOT ROAM PLUGIN - OPCIONES DE LIMPIEZA
// Registro centralizado de todas las opciones de limpieza
// ============================================================================

/**
 * Definición centralizada de opciones de limpieza.
 * Para añadir una nueva opción:
 * 1. Agregar un objeto a este array
 * 2. Ejecutar build.ps1
 * 3. Listo - el UI y la lógica lo detectan automáticamente
 */
const OPCIONES_LIMPIEZA = [
    // ========================================================================
    // OPCIONES GENÉRICAS (todos los chatbots)
    // ========================================================================
    {
        id: 'eliminar_imagenes',
        label: 'Imagenes Base64',
        chatbots: ['claude', 'gemini', 'notebooklm'],
        defaultActivo: true,
        aplicarA: 'none', // Se ejecuta una sola vez en el preproceso global
        cleaner: function (texto) { return texto; }
    },
    {
        id: 'eliminar_metadata',
        label: 'Timestamps y referencias',
        chatbots: ['claude', 'gemini', 'notebooklm'],
        defaultActivo: false,
        aplicarA: 'ambos',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarMetadataGenerico(texto); }
    },
    {
        id: 'neutralizar_sintaxis',
        label: 'Neutralizar sintaxis Roam (::, [[ ]]) en la IA',
        chatbots: ['claude', 'gemini', 'notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.neutralizarSintaxisRoam(texto); }
    },

    // ========================================================================
    // OPCIONES CLAUDE
    // ========================================================================
    {
        id: 'eliminar_thinking_blockquotes_claude',
        label: 'Bloques de pensamiento (Claude V2)',
        chatbots: ['claude'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarThinkingBlockquotesClaude(texto); }
    },

    // ========================================================================
    // OPCIONES GEMINI
    // ========================================================================
    {
        id: 'eliminar_thinking_gemini',
        label: 'Bloques Thinking (Gemini)',
        chatbots: ['gemini'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarThinkingGemini(texto); }
    },
    {
        id: 'limpiar_etiquetas_codigo_gemini',
        label: 'Limpiar par\u00e1metros en c\u00f3digo (?code_...)',
        chatbots: ['gemini'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarEtiquetasCodigoGemini(texto); }
    },
    {
        id: 'eliminar_footer_gemini',
        label: 'Footer Gemini Exporter',
        chatbots: ['gemini'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarMetadataGemini(texto); }
    },
    {
        id: 'eliminar_adjuntos_gemini',
        label: 'Adjuntos Gemini',
        chatbots: ['gemini'],
        defaultActivo: true,
        aplicarA: 'ambos',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarAdjuntosGemini(texto); }
    },

    // ========================================================================
    // OPCIONES NOTEBOOKLM
    // ========================================================================
    {
        id: 'separar_headers_colisionados_notebooklm',
        label: 'Separar t\u00edtulos colisionados',
        chatbots: ['notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.separarHeadersColisionadosNotebookLM(texto); }
    },
    {
        id: 'normalizar_vinetas_notebooklm',
        label: 'Normalizar vi\u00f1etas (\u2022, \u25e6)',
        chatbots: ['notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.normalizarVinetasNotebookLM(texto); }
    },
    {
        id: 'eliminar_fuentes_notebooklm',
        label: 'Eliminar fuentes/sources (NotebookLM)',
        chatbots: ['notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarFuentesNotebookLM(texto); }
    },

    // ========================================================================
    // CONVERSIÓN DE FORMATO
    // ========================================================================
    {
        id: 'convertir_tablas_roam',
        label: 'Convertir tablas a Roam',
        chatbots: ['claude', 'gemini', 'notebooklm'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.convertirTablasMarkdownARoam(texto); }
    }
];

// ============================================================================
// OBJETO PRINCIPAL - Helpers para consumir las opciones
// ============================================================================

const ChatbotRoamOpciones = {
    /**
     * Devuelve todas las opciones definidas
     */
    getAll: function () {
        return OPCIONES_LIMPIEZA;
    },

    /**
     * Genera el objeto de preset para un tipo de chatbot
     * @param {string} tipo - 'claude', 'gemini', 'notebooklm', 'generico'
     * @returns {Object} - Objeto con todas las opciones y sus valores default
     */
    getPreset: function (tipo) {
        const preset = {};

        for (var i = 0; i < OPCIONES_LIMPIEZA.length; i++) {
            var opcion = OPCIONES_LIMPIEZA[i];
            // La opcion esta activa si el chatbot esta en su lista
            var estaEnChatbot = opcion.chatbots.indexOf(tipo) !== -1;
            preset[opcion.id] = estaEnChatbot && opcion.defaultActivo;
        }

        return preset;
    },

    /**
     * Aplica los cleaners activos a un texto
     * @param {string} texto - Texto a limpiar
     * @param {Object} opcionesActivas - Objeto con opciones activas (true/false)
     * @param {string} destino - 'prompt' o 'respuesta'
     * @returns {string} - Texto limpio
     */
    aplicarLimpieza: function (texto, opcionesActivas, destino) {
        for (var i = 0; i < OPCIONES_LIMPIEZA.length; i++) {
            var opcion = OPCIONES_LIMPIEZA[i];

            // Verificar si la opcion esta activa
            if (!opcionesActivas[opcion.id]) continue;

            // Verificar si aplica a este destino
            var aplica = opcion.aplicarA === 'ambos' || opcion.aplicarA === destino;
            if (!aplica) continue;

            // Aplicar el cleaner
            texto = opcion.cleaner(texto);
        }

        return texto;
    },

    /**
     * Genera el HTML de los checkboxes para el modal
     * @returns {string} - HTML de los checkboxes
     */
    generarCheckboxesHTML: function () {
        var html = '';

        for (var i = 0; i < OPCIONES_LIMPIEZA.length; i++) {
            var opcion = OPCIONES_LIMPIEZA[i];
            html += '<label class="chatbot-roam-option">' +
                '<input type="checkbox" data-option="' + opcion.id + '">' +
                opcion.label +
                '</label>';
        }

        return html;
    }
};
