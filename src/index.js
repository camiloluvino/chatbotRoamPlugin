// CHATBOT ROAM PLUGIN - INDEX
// Main entry point - registers commands with Roam

const ChatbotRoamPlugin = {
    VERSION: "1.0.0",

    // Lista de comandos registrados (para cleanup en recargas)
    _registeredCommands: [
        'Importar Conversacion de Chatbot'
    ],

    // Inicializa el plugin
    init: function () {
        if (!window.roamAlphaAPI) {
            console.error("Chatbot Roam Plugin: Roam Alpha API no disponible.");
            return;
        }

        // Limpiar comandos previos si existen (para manejar recargas del script)
        var self = this;
        this._registeredCommands.forEach(function (label) {
            try {
                window.roamAlphaAPI.ui.commandPalette.removeCommand({ label: label });
            } catch (e) { /* Ignorar - el comando no existia */ }
        });

        // Registrar comando principal
        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: 'Importar Conversacion de Chatbot',
            callback: function () { ChatbotRoamUI.openModal(); },
            "default-hotkey": "ctrl-shift-i"
        });

        console.log("Chatbot Roam Plugin v" + this.VERSION + " cargado.");
        console.log('   Usa Ctrl+Shift+I o busca "Importar Conversacion" en el command palette.');
    }
};

// Auto-inicializar
ChatbotRoamPlugin.init();
