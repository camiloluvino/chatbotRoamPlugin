// ============================================================================
// CHATBOT ROAM PLUGIN - OPCIONES DE LIMPIEZA
// Une las opciones comunes con las de cada formato
// ============================================================================

const ChatbotRoamOpciones = {
    // Opciones comunes que se aplican antes de las del formato
    COMUNES_ANTES: [
        {
            id: 'eliminar_imagenes',
            label: 'Imagenes Base64',
            defaultActivo: true,
            aplicarA: 'archivo', // Una vez sobre el archivo completo, antes de separar los turnos
            cleaner: function (texto) { return ChatbotRoamComun.eliminarImagenesEmbedidas(texto); }
        },
        {
            id: 'eliminar_metadata',
            label: 'Timestamps y referencias',
            defaultActivo: false,
            aplicarA: 'ambos',
            cleaner: function (texto) { return ChatbotRoamComun.limpiarMetadataGenerico(texto); }
        },
        {
            id: 'neutralizar_sintaxis',
            label: 'Neutralizar sintaxis Roam (::, [[ ]]) en la IA',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamComun.neutralizarSintaxisRoam(texto); }
        }
    ],

    // Opciones comunes que se aplican despues de las del formato
    COMUNES_DESPUES: [
        {
            id: 'convertir_tablas_roam',
            label: 'Convertir tablas a Roam',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamComun.convertirTablasMarkdownARoam(texto); }
        }
    ],

    /**
     * Todas las opciones, comunes y de cada formato, en el orden en que se muestran
     */
    getAll() {
        let todas = this.COMUNES_ANTES.slice();
        ChatbotRoamFormatos.lista().forEach(formato => { todas = todas.concat(formato.opciones); });
        return todas.concat(this.COMUNES_DESPUES);
    },

    /**
     * Opciones que corresponden a un formato, en el orden en que se aplican
     */
    paraFormato(formato) {
        return this.COMUNES_ANTES.concat(formato.opciones, this.COMUNES_DESPUES);
    },

    /**
     * Valores por defecto para un conjunto de formatos (los de los archivos cargados)
     * @param {Array} formatos - Objetos de formato
     * @returns {Object} - { idOpcion: boolean } con todas las opciones
     */
    getDefaults(formatos) {
        const valores = {};
        this.getAll().forEach(opcion => { valores[opcion.id] = false; });
        formatos.forEach(formato => {
            this.paraFormato(formato).forEach(opcion => {
                if (opcion.defaultActivo) valores[opcion.id] = true;
            });
        });
        return valores;
    },

    /**
     * Aplica a un texto las opciones activas del formato
     * @param {string} texto - Texto a limpiar
     * @param {Object} opcionesActivas - { idOpcion: boolean }
     * @param {Object} formato - Formato del archivo
     * @param {string} destino - 'archivo', 'prompt' o 'respuesta'
     * @returns {string} - Texto limpio
     */
    aplicarLimpieza(texto, opcionesActivas, formato, destino) {
        const opciones = this.paraFormato(formato);
        for (let i = 0; i < opciones.length; i++) {
            const opcion = opciones[i];
            if (!opcionesActivas[opcion.id]) continue;

            const aplica = opcion.aplicarA === destino || (opcion.aplicarA === 'ambos' && destino !== 'archivo');
            if (!aplica) continue;

            texto = opcion.cleaner(texto);
        }
        return texto;
    },

    /**
     * Genera el HTML de los checkboxes para el modal
     */
    generarCheckboxesHTML() {
        return this.getAll().map(opcion =>
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="' + opcion.id + '">' +
            opcion.label +
            '</label>'
        ).join('');
    }
};
