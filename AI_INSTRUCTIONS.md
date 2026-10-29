# AI Instructions - Chatbot Roam Plugin

Plugin para Roam Research que importa conversaciones de chatbots exportadas como `.md` por una extensión de terceros. El plugin es el eslabón entre ese exportador y Roam: no controla el formato de entrada, se adapta a él.

Uso real: Claude y Gemini (la mayor parte), NotebookLM con frecuencia. Otros chatbots, poco; para ellos basta el formato genérico.

---

## Fuente de verdad

- **Fuentes**: `src/`
- **Bundle generado**: `chatbot-roam-plugin.js` (NO editar directamente)
- **Ejemplos**: `test-data/fixtures/` y sus salidas esperadas en `tests/expected/`

### Flujo de trabajo obligatorio
1. Editar archivos en `src/`
2. `node scripts/build.js` (o `.\build.ps1`, que lo llama)
3. `node tests/run-fixtures.js`
   - Si un cambio de salida es intencional, revisar el diff y aceptarlo con `--update`
   - Si no es intencional, es un error
4. Actualizar `STATUS.md`
5. Commit

GitHub Pages publica `master`: lo que llega ahí es lo que el usuario carga en Roam. Trabajar en ramas y probar con la URL de jsDelivr del README antes de fusionar.

---

## Arquitectura

| Archivo | Responsabilidad |
|---|---|
| `limpieza-comun.js` | `ChatbotRoamComun`: constantes y limpieza válida para todo formato (imágenes, tablas, neutralización, formato de código) |
| `formatos/<nombre>.js` | Un objeto por formato: `id`, `nombre`, `MARCADOR_PROMPT`, `MARCADOR_RESPUESTA`, `detectar(contenido)`, `opciones`, y opcionalmente `limpiezaArchivo` y `limpiezaFinalRespuesta` |
| `formatos/registro.js` | `ChatbotRoamFormatos`: orden de detección (el genérico al final) |
| `opciones.js` | `ChatbotRoamOpciones`: une opciones comunes y del formato, defaults, aplicación, casillas |
| `processing.js` | `procesarArchivos(archivos, opciones)`: por archivo detecta formato, separa turnos, limpia y formatea |
| `formatter.js` | Indentación de las respuestas (headings, negritas, listas, código, tablas) |
| `roam/parser.js` | Texto indentado a árbol de bloques |
| `roam/inserter.js` | Inserción por lotes con rate limit y rollback |
| `styles.js`, `ui.js` | Modal |
| `index.js` | Registro del comando; única definición de `VERSION` |

El orden de concatenación está en `scripts/build.js` y respeta dependencias.

### Cuando el exportador cambia
Tocar solo el archivo del formato afectado. Agregar un ejemplo real (recortado) a `test-data/fixtures/`, generar su salida esperada, revisarla a mano y aceptarla.

### Opciones
Cada opción tiene `id`, `label`, `visible`, `defaultActivo`, `aplicarA` (`'archivo'`, `'prompt'`, `'respuesta'` o `'ambos'`) y `cleaner`. Solo las `visible: true` aparecen en el modal; el resto se aplica siempre. Opciones de distintos formatos con el mismo `id` comparten casilla (así funciona `eliminar_razonamiento`). Se aplican en este orden: comunes antes, las del formato, comunes después.

---

## Reglas críticas

### Backticks
Roam rompe los scripts que contienen backticks literales, también en comentarios. Usar `String.fromCharCode(96)` o `ChatbotRoamComun.BT3` / `BT4`. `scripts/build.js` falla si encuentra alguno en el bundle.

### No perder contenido en silencio
Los errores más graves de este plugin han sido pérdidas sin aviso (un archivo entero, prompts sin respuesta). Cualquier regla que elimine texto debe mirar señales estructurales del formato, no palabras sueltas: una regla que borraba fechas reconociendo "AM" habría borrado títulos como "## Amistad".

### Estado
`STATUS.md` registra solo lo verificado. No marcar nada como estable sin pasar `run-fixtures.js`, e indicar si se probó en Roam real o no.

---

## Convenciones
- Funciones, variables y comentarios en español; nombres técnicos estándar en inglés (`children`, `text`, `uid`)
- Funciones privadas con prefijo `_`
- Constantes y regex en `UPPER_SNAKE_CASE`

## Contexto técnico

### Sistema de indentación
| Espacios | Nivel | Uso |
|---|---|---|
| 0 (con `* `) | Prompt | Pregunta del usuario |
| 4 | Respuesta | Contenido nivel 1 |
| +4 por heading | Bajo heading | Contenido bajo `#`...`######` y negritas de línea completa |
| 4, 8, 12... | Tabla Roam | `{{[[table]]}}` con columnas anidadas |

Los bloques de código viajan como una sola línea con el marcador `[CODE]` y `{{NL}}` en lugar de saltos de línea; `parser.js` los restaura.

### Roam Alpha API
- `ui.commandPalette.addCommand()` / `removeCommand()`
- `ui.getFocusedBlock()`, `ui.setBlockFocusAndSelection()`
- `data.batch.actions()` con fallback a `createBlock()` / `deleteBlock()`
- `util.generateUID()`
