# Chatbot Roam Plugin

Plugin para Roam Research que permite importar conversaciones exportadas de chatbots (Claude, ChatGPT, Gemini) directamente a tu graph mediante drag & drop.

## ✨ Características

- 📁 **Drag & Drop** - Arrastra archivos .md directamente al modal
- 🤖 **Multi-chatbot** - Soporta Claude, ChatGPT, Google Gemini y Antigravity
- 🔍 **Auto-detección** - Detecta el tipo de chatbot y aplica el preset correspondiente
- 🎛️ **15 opciones de limpieza** - Configura exactamente qué limpiar
- 👁️ **Vista previa** - Previsualiza el resultado antes de insertar
- ⚡ **Inserción directa** - Inserta como hijo del bloque seleccionado
- 💻 **Preserva code blocks** - Los bloques de código se insertan correctamente formateados
- 📐 **Indentación bajo headings** - El contenido bajo headings markdown (`#`, `##`, `###`) se anida automáticamente
- 🚀 **Alto Rendimiento (v1.3.3)** - Procesamiento asíncrono y por lotes para importar archivos gigantes sin congelar el navegador.

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

## 🔄 Editor de Clasificación (archivos MCP)

Cuando importas un archivo que contiene llamadas MCP de Claude, el exportador de Chrome puede confundir qué mensajes son del usuario (Prompt) y cuáles son de Claude (Response). El plugin detecta esto y muestra un **Editor de Clasificación** antes de procesar:

- **Lista visual** de todos los bloques con colores (🔵 Prompt / 🟢 Response)
- **Botón [⇄]** para intercambiar un bloque individual
- **Botón [↓↓]** para invertir desde ese punto hasta el final (para errores en cadena)
- **Contador** de bloques modificados
- **Restaurar original** si te equivocas

### Uso típico:
1. Arrastra el archivo → aparece el editor
2. Identifica el primer bloque mal clasificado
3. Si los siguientes también están invertidos, usa **[↓↓]** para corregir toda la cadena
4. Click "Continuar" para procesar

## 🔧 Desarrollo

### Estructura

```
chatbotRoamPlugin/
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
│   └── build.ps1             # Script de build
├── chatbot-roam-plugin.js    # Bundle final
└── README.md
```

### Build

```powershell
cd src
.\build.ps1
```

## 📄 Licencia

MIT
