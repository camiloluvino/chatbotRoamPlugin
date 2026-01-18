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
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity'],
        defaultActivo: true,
        aplicarA: 'ambos',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarImagenesEmbedidas(texto); }
    },
    {
        id: 'eliminar_metadata',
        label: 'Timestamps y referencias',
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity'],
        defaultActivo: false,
        aplicarA: 'ambos',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarMetadataGenerico(texto); }
    },

    // ========================================================================
    // OPCIONES CLAUDE
    // ========================================================================
    {
        id: 'eliminar_mcp_toolcalls_claude',
        label: 'MCP Tool calls (Claude)',
        chatbots: ['claude'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarMcpToolCallsClaude(texto); }
    },
    {
        id: 'eliminar_plaintext_claude',
        label: 'Bloques plaintext (Claude)',
        chatbots: ['claude'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarThoughtProcessClaude(texto); }
    },
    {
        id: 'eliminar_toolcalls_claude',
        label: 'Tool calls (Claude)',
        chatbots: ['claude'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarToolCallsClaude(texto); }
    },

    // ========================================================================
    // OPCIONES CHATGPT
    // ========================================================================
    {
        id: 'eliminar_thought_chatgpt',
        label: 'Thought process (ChatGPT)',
        chatbots: ['chatgpt'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarThoughtProcessGenerico(texto); }
    },
    {
        id: 'eliminar_logs_chatgpt',
        label: 'Logs de busqueda',
        chatbots: ['chatgpt'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarToolLogsGenerico(texto); }
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
    // OPCIONES ANTIGRAVITY
    // ========================================================================
    {
        id: 'eliminar_header_antigravity',
        label: 'Header Antigravity',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'preproceso',  // Se aplica ANTES de extraer conversación
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarHeaderAntigravity(texto); }
    },
    {
        id: 'eliminar_acciones_antigravity',
        label: 'Acciones Antigravity',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarAccionesAntigravity(texto); }
    },
    {
        id: 'eliminar_cci_links',
        label: 'Enlaces CCI internos',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.limpiarEnlacesCCI(texto); }
    },
    {
        id: 'eliminar_sistema_antigravity',
        label: 'Mensajes de sistema',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarMensajesSistemaAntigravity(texto); }
    },
    {
        id: 'eliminar_timestamp_hora',
        label: 'Timestamps de hora suelta',
        chatbots: ['antigravity'],
        defaultActivo: true,
        aplicarA: 'respuesta',
        cleaner: function (texto) { return ChatbotRoamCleaners.eliminarTimestampHoraSuelta(texto); }
    },

    // ========================================================================
    // CONVERSIÓN DE FORMATO
    // ========================================================================
    {
        id: 'convertir_tablas_roam',
        label: 'Convertir tablas a Roam',
        chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity'],
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
     * @param {string} tipo - 'claude', 'chatgpt', 'gemini', 'antigravity', 'generico'
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
     * @param {string} destino - 'prompt', 'respuesta', o 'preproceso'
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
            // No mostrar opciones de preproceso (son internas)
            if (opcion.aplicarA === 'preproceso') continue;

            html += '<label class="chatbot-roam-option">' +
                '<input type="checkbox" data-option="' + opcion.id + '">' +
                opcion.label +
                '</label>';
        }

        return html;
    }
};
