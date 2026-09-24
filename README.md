# Chatbot Roam Plugin

Plugin para Roam Research que permite importar conversaciones exportadas de chatbots (Claude, ChatGPT, Gemini) directamente a tu graph mediante drag & drop.

## ✨ Características

- 🎯 **Jerarquía Precisa en Negritas (v1.5.5)** - Resuelve la indentación progresiva y anidamiento involuntario en líneas de títulos en negrita (`**título**`), manteniéndolas en el mismo nivel jerárquico junto a sus listas hijas.
- ⚡ **Rendimiento Ultra Liviano (v1.5.4)** - Eliminación del `backdrop-filter: blur()` y fondo translúcido pesado, aceleración de inserción hasta 10x (delay base de 250ms), conteo lineal $O(N)$ de bloques, búsqueda con debounce y navegación sin rebuilds de DOM.
- 📊 **Tablas Nativas de Roam (v1.5.3)** - Conversión e inserción jerárquica precisa de tablas Markdown en contenedores `{{[[table]]}}`, resolviendo el anidamiento de columnas y filas.
- 🛡️ **Inserción Robusta Anti-Orphans (v1.5.3)** - Registro incremental de UIDs en tiempo real para garantizar rollback íntegro ante fallas intermedias y detección insensible a mayúsculas/minúsculas de rate limits.
- 💬 **Preservación de Respuestas de IA (v1.5.3)** - Protección contra pérdida de datos cuando el prompt queda vacío tras la limpieza (ej: solo imágenes o timestamps eliminados), anidando la respuesta bajo `* [sin texto]`.
- 📁 **Multi-file Drag & Drop** - Arrastra múltiples archivos .md simultáneamente (v1.4.2)
- 🗂️ **Agrupación Jerárquica** - Organiza automáticamente cada conversación bajo un bloque con su nombre de archivo.
- 🤖 **Multi-chatbot** - Soporta Claude, ChatGPT, Google Gemini, Antigravity y NotebookLM
- 🔍 **Auto-detección** - Detecta el tipo de chatbot y aplica el preset correspondiente
- 🎛️ **18 opciones de limpieza** - Configura exactamente qué limpiar
- 👁️ **Vista previa** - Previsualiza el resultado antes de insertar
- ⚡ **Inserción directa** - Inserta como hijo del bloque seleccionado
- 💻 **Preserva code blocks** - Los bloques de código se insertan correctamente formateados y protegidos de neutralización
- 🛡️ **Zero-Backtick Bundle (v1.5.1)** - Compatibilidad nativa estricta con bloques `{{[[roam/js]]}}` sin interferir con el parser de Roam
- ⚠️ **Diagnóstico de Advertencias Mejorado (v1.4.9)** - Muestra mensajes detallados y descriptivos en el dropzone cuando un archivo requiere atención
- 🔄 **Editor de Clasificación Seguro (v1.4.9)** - Intercambio de roles (Prompt/Response) sin corrupción de texto ni desajuste de índices
- 📐 **Indentación bajo headings** - El contenido bajo headings markdown (`#`, `##`, `###`) se anida automáticamente
- 🚀 **Rate Limit Adaptativo y Ágil (v1.5.4)** - Inserción veloz con delay de 250ms entre lotes para importaciones de hasta 1,000 bloques, activando espaciado dinámico seguro únicamente ante cargas muy masivas para respetar el límite de 1500 mutaciones/60s.
- 🤖 **NotebookLM Multilingüe (v1.5.2)** - Soporte completo para exportaciones en inglés (`### 🧑 **User**` / `### 🤖 **NotebookLM**`), español y chino, con limpieza de `Exported at:`, fechas de sección, bloque `Thoughts` y filtrado de citas `> **Sources:**`.
- 🤖 **Soporte Gemini Exporter V2** - Reconocimiento del nuevo formato de exportación (`## User:` / `## Gemini:`) y eliminación automática de bloques de pensamiento (`> **Thinking steps**`).
- 🤖 **Soporte Claude V2** - Reconocimiento automático del nuevo formato de exportación (`## User:`), timestamps en blockquotes y eliminación de bloques de pensamiento en blockquotes (v1.4.7).
- 🧹 **NotebookLM Pro** - Resolución de colisiones sintácticas (`**Título**Texto`) y soporte de jerarquía automática para líneas en negrita (v1.4.6).
- 🧹 **NotebookLM Limpio** - Elimina escapes visuales molestos (ej: `1\.` a `1.`).
- 🔗 **Neutralización de Sintaxis Roam** - Evita que se creen atributos (`::`) o páginas (`[[ ]]`) accidentalmente al importar texto (v1.4.5), protegiendo bloques de código.
- 🎨 **Diseño Solarized/Claude (v1.4.1)** - Interfaz minimalista con paleta Solarized Dark y acentos dorados inspirados en Claude AI.
- 🛑 **Cancelación Segura** - Detén la importación en cualquier momento con rollback automático.

## 🚀 Instalación

1. En tu graph de Roam, crea una página `{{[[roam/js]]}}`
2. Crea un bloque de código JavaScript
3. Copia y pega el contenido de `chatbot-roam-plugin.js`
4. El plugin se activará automáticamente

## 📖 Uso

1. **Abre el modal**: `Ctrl+Shift+I` o busca "Importar Conversación" en el Command Palette
2. **Arrastra tus archivos** .md exportados (puedes seleccionar varios a la vez)
3. **Ajusta opciones** si es necesario (auto-detecta y aplica preset)
4. **Revisa la vista previa**
5. **Selecciona un bloque** en Roam donde insertar
6. **Click en "Insertar en Roam"**

> **Nota sobre velocidad:** La inserción se realiza en lotes de 50 bloques con un delay ágil de ~250ms para conversaciones estándar (<1,000 bloques), tardando solo unos segundos. Para importaciones masivas (>1,000 bloques), el plugin calcula automáticamente un retraso seguro para proteger la cuota oficial de Roam (1500 mutaciones/60s).

> **Nota sobre cancelación:** Si cancelas durante la inserción, el plugin intentará borrar los bloques que ya insertó. Este proceso de limpieza también es lento para ser seguro. **¡No cierres el navegador mientras dice "Limpiando..."!**

## 🧹 Opciones de Limpieza

| Opción | Descripción |
|--------|-------------|
| Bloques plaintext (Claude) | Elimina bloques ````plaintext |
| Bloques de pensamiento (Claude V2) | Elimina blockquotes iterativos de pensamiento |
| Logs de búsqueda | Elimina project_knowledge_search |
| Bloques Thinking (Gemini) | Elimina `> Thinking:` blockquotes |
| Ejecución de código / Tools (Gemini) | Elimina bloques y salidas de ejecución de código Python (`?code_reference`, `?code_stdout`) |
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
| Separar títulos colisionados | Corrige `**Título**Descripción` en NotebookLM |
| Neutralizar sintaxis Roam | Rompe `::` y `[[ ]]` para evitar conflictos en Roam |

## 🔄 Editor de Clasificación (Opcional)

Algunos exportadores pueden invertir el orden de los mensajes (confundir Prompt con Response). Para verificar esto manualmente antes de procesar:

1. Marca la opción **"Revisar clasificación (Prompt/Response)"** en el modal (ahora destacada en naranja).
2. Puedes marcarla **antes o después** de cargar el archivo.
3. Se abrirá el **Editor de Clasificación** donde podrás verificar y corregir visualmente.
4. Si encuentras errores, usa los botones **[⇄]** o **[↓↓]** para corregirlos.


## 🔧 Desarrollo

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
