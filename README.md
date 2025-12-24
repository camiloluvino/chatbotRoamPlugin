# Chatbot Roam Plugin

Plugin para Roam Research que permite importar conversaciones exportadas de chatbots (Claude, ChatGPT, Gemini) directamente a tu graph mediante drag & drop.

## ✨ Características

- 📁 **Drag & Drop** - Arrastra archivos .md directamente al modal
- 🤖 **Multi-chatbot** - Soporta Claude, ChatGPT y Google Gemini
- 🔍 **Auto-detección** - Detecta el tipo de chatbot y aplica el preset correspondiente
- 🎛️ **10 opciones de limpieza** - Configura exactamente qué limpiar
- 👁️ **Vista previa** - Previsualiza el resultado antes de insertar
- ⚡ **Inserción directa** - Inserta como hijo del bloque seleccionado

## 🚀 Instalación

1. En tu graph de Roam, crea una página `{{[[roam/js]]}}`
2. Crea un bloque de código JavaScript
3. Copia y pega el contenido de `chatbot-roam-plugin.js`
4. El plugin se activará automáticamente

## 📖 Uso

1. **Abre el modal**: `Ctrl+Shift+I` o busca "Importar Conversación" en el Command Palette
2. **Arrastra tu archivo** .md exportado del chatbot
3. **Ajusta opciones** si es necesario (auto-detecta y aplica preset)
4. **Revisa la vista previa**
5. **Selecciona un bloque** en Roam donde insertar
6. **Click en "Insertar en Roam"**

## 🧹 Opciones de Limpieza

| Opción | Descripción |
|--------|-------------|
| Bloques plaintext (Claude) | Elimina bloques ````plaintext |
| Logs de búsqueda | Elimina project_knowledge_search |
| Bloques Thinking (Gemini) | Elimina `> Thinking:` blockquotes |
| Timestamps y referencias | Elimina fechas y `> File:` |
| Thought process (ChatGPT) | Elimina bloques de razonamiento |
| Footer Gemini Exporter | Elimina pie de página |
| Tool calls (Claude) | Elimina Request/Response |
| Adjuntos Gemini | Limpia símbolo `>` de adjuntos |
| MCP Tool calls (Claude) | Elimina herramientas MCP |
| Imágenes Base64 | Elimina imágenes embedidas |

## 🔧 Desarrollo

### Estructura

```
chatbotRoamPlugin/
├── src/
│   ├── patterns.js    # Regex compilados
│   ├── cleaners.js    # Funciones de limpieza
│   ├── processing.js  # Lógica de procesamiento
│   ├── ui.js          # Modal y componentes UI
│   ├── index.js       # Entrada, registro comandos
│   └── build.ps1      # Script de build
├── chatbot-roam-plugin.js  # Bundle final
└── README.md
```

### Build

```powershell
cd src
.\build.ps1
```

## 📄 Licencia

MIT
