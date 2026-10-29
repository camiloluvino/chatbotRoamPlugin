# Chatbot Roam Plugin

Plugin para Roam Research que importa conversaciones de chatbots, exportadas como `.md` con una extensión de navegador de terceros, y las convierte en bloques de Roam.

El plugin no controla el formato de entrada: se adapta a lo que produce el exportador. Por eso cada formato vive en su propio módulo, y cada cambio se comprueba contra ejemplos reales.

## Formatos soportados

| Formato | Turnos | Limpieza propia |
|---|---|---|
| Claude | `## User:` / `## Assistant:` | Razonamiento (cita inicial y citas con `**Done**`) |
| Gemini | `## User:` / `## Gemini:` | Razonamiento (`> **Thinking steps**`), footer del exportador, adjuntos |
| NotebookLM | `### 🧑 **User**` / `### 🤖 **NotebookLM**` (también español y chino) | Fechas de sesión, fuentes citadas, viñetas, negritas pegadas, escapes |
| Genérico (ChatGPT, Grok, otros) | `## Prompt:` / `## Response:` | Solo la limpieza común |

La limpieza común se aplica a todos: imágenes base64, tablas Markdown a `{{[[table]]}}`, neutralización de `[[ ]]` y `::`.

## Uso

1. Selecciona en Roam el bloque bajo el cual insertar.
2. `Ctrl+Shift+I` o "Importar Conversacion de Chatbot" en el Command Palette.
3. Arrastra uno o más `.md`. Cada archivo se detecta por separado y el modal muestra su formato.
4. Ajusta las opciones si hace falta y revisa la vista previa.
5. "Insertar en Roam". Cada archivo queda bajo un bloque con su nombre.

Opciones visibles: quitar el razonamiento del modelo, neutralizar `[[ ]]` y `::` en las respuestas, quitar las fuentes citadas (NotebookLM) y quitar fechas sueltas. El resto de la limpieza se aplica siempre.

La importación incremental permite buscar el último prompt ya importado y cortar desde ahí.

La inserción va en lotes de 50 bloques respetando el límite de Roam (1500 mutaciones por minuto). Si falla o se cancela, se borran los bloques ya creados.

## Instalación

Copia `loader.js` en un bloque `{{[[roam/js]]}}`. Carga siempre la versión publicada en GitHub Pages (rama `master`).

Para probar otra rama sin publicarla, cambia temporalmente la URL del loader por:
`https://cdn.jsdelivr.net/gh/camiloluvino/chatbotRoamPlugin@<rama>/chatbot-roam-plugin.js`

## Desarrollo

```
src/
├── limpieza-comun.js     # Limpieza válida para cualquier formato
├── formatos/
│   ├── claude.js         # Detección, marcadores de turno y limpieza propia
│   ├── gemini.js
│   ├── notebooklm.js
│   ├── generico.js       # Respaldo para archivos no reconocidos
│   └── registro.js       # Orden de detección
├── opciones.js           # Une opciones comunes y de cada formato
├── processing.js         # Separa turnos, limpia y formatea cada archivo
├── formatter.js          # Indentación de la respuesta (headings, listas, código, tablas)
├── roam/parser.js        # Texto indentado a árbol de bloques
├── roam/inserter.js      # Inserción por lotes con rollback
├── styles.js, ui.js      # Modal
└── index.js              # Registro del comando
test-data/fixtures/       # Exportaciones de ejemplo (un .md o una carpeta de varios)
tests/expected/           # Árbol de bloques esperado para cada ejemplo
```

```bash
node scripts/build.js          # genera chatbot-roam-plugin.js (o .\build.ps1)
node tests/run-fixtures.js     # compara cada ejemplo con su salida esperada
node tests/run-fixtures.js --update   # acepta las salidas actuales como esperadas
```

Ver `AI_INSTRUCTIONS.md` para las reglas de trabajo.

## Licencia

MIT
