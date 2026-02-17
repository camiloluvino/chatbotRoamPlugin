# Chatbot Roam Plugin

Plugin para Roam Research que permite importar conversaciones exportadas de chatbots (Claude, ChatGPT, Gemini) directamente a tu graph mediante drag & drop.

## ✨ Características

- 📁 **Drag & Drop** - Arrastra archivos .md directamente al modal
- 🤖 **Multi-chatbot** - Soporta Claude, ChatGPT, Google Gemini, Antigravity y NotebookLM
- 🔍 **Auto-detección** - Detecta el tipo de chatbot y aplica el preset correspondiente
- 🎛️ **17 opciones de limpieza** - Configura exactamente qué limpiar
- 👁️ **Vista previa** - Previsualiza el resultado antes de insertar
- ⚡ **Inserción directa** - Inserta como hijo del bloque seleccionado
- 💻 **Preserva code blocks** - Los bloques de código se insertan correctamente formateados
- 📐 **Indentación bajo headings** - El contenido bajo headings markdown (`#`, `##`, `###`) se anida automáticamente
- 📐 **Indentación bajo headings** - El contenido bajo headings markdown (`#`, `##`, `###`) se anida automáticamente
- 🚀 **Rate Limit Safe (v1.3.8)** - Velocidad optimizada (22 ops/s) para evitar errores de API al importar archivos masivos.
- 🧹 **NotebookLM Limpio (v1.3.9)** - Elimina escapes visuales molestos (ej: `1\.` a `1.`) y mejora la detección de formato.
- ⚡ **Selector Manual Reactivo (v1.4.0)** - Activa/desactiva la revisión manual en tiempo real sin recargar el archivo.
- 🛑 **Cancelación Segura** - Detén la importación en cualquier momento con rollback automático.

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

> **Nota sobre velocidad:** Para proteger tu base de datos y evitar errores de API, la inserción está limitada a 22 bloques por segundo. Una conversación larga puede tomar unos minutos.

> **Nota sobre cancelación:** Si cancelas durante la inserción, el plugin intentará borrar los bloques que ya insertó. Este proceso de limpieza también es lento para ser seguro. **¡No cierres el navegador mientras dice "Limpiando..."!**

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
| Header NotebookLM | Elimina YAML y título exportado |
| Timestamps NotebookLM | Elimina timestamps de sección |
| Normalizar viñetas (NotebookLM) | Convierte bullets • y ◦ a estructura Roam |

## 🔄 Editor de Clasificación (Opcional)

Algunos exportadores pueden invertir el orden de los mensajes (confundir Prompt con Response). Para verificar esto manualmente antes de procesar:

1. Marca la opción **"Revisar clasificación (Prompt/Response)"** en el modal (ahora destacada en naranja).
2. Puedes marcarla **antes o después** de cargar el archivo.
3. Se abrirá el **Editor de Clasificación** donde podrás verificar y corregir visualmente.
4. Si encuentras errores, usa los botones **[⇄]** o **[↓↓]** para corregirlos.


## 🔧 Desarrollo

### Estructura

### Estructura

```
chatbotRoamPlugin/
├── docs/                 # Documentación y referencias
├── data/                 # Archivos de ejemplo y exports
├── src/
│   ├── patterns.js           # Regex compilados
│   ├── cleaners.js           # Funciones de limpieza
│   ├── opciones-limpieza.js  # Registro centralizado de opciones
│   ├── formatter.js          # Formateo para Roam
│   ├── processing.js         # Lógica de procesamiento
│   ├── styles.js             # CSS del modal
│   ├── roam/
│   │   ├── parser.js         # Parser de bloques
│   │   └── inserter.js       # Inserción con rollback
│   ├── ui.js                 # Modal y componentes UI
│   ├── index.js              # Entrada, registro comandos
├── build.ps1             # Script de build
├── chatbot-roam-plugin.js    # Bundle final
└── README.md
```

### Build

```powershell
.\build.ps1
```

## 📄 Licencia

MIT
