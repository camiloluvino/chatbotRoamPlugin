# Plan de simplificación (v2.0.0)

Contexto: el plugin es el eslabón entre un exportador de terceros (que convierte chats del navegador en `.md`) y Roam. Uso real: Claude y Gemini (~90%), NotebookLM con frecuencia. ChatGPT, Grok y otros, muy poco. Antigravity no se usa.

Criterios:
1. Soportar solo lo que el exportador produce hoy para esos formatos.
2. Aislar lo que depende del exportador (un módulo por formato) de lo estable (formatear, armar jerarquía, insertar).
3. Ningún cambio se da por bueno sin pasar `node tests/run-fixtures.js`.

Trabajo en la rama `claude/practical-gates-5s2tci`. GitHub Pages publica `master`, así que el plugin en uso no cambia hasta fusionar. Para probar la rama en Roam:
`https://cdn.jsdelivr.net/gh/camiloluvino/chatbotRoamPlugin@claude/practical-gates-5s2tci/chatbot-roam-plugin.js`

## Etapas

0. **Red de seguridad.** Ejemplos en `test-data/fixtures/`, salidas esperadas en `tests/expected/`, comparación con `tests/run-fixtures.js`, compilación con `scripts/build.js` (Node, equivalente a `build.ps1`).
1. **Poda** (sin cambios de resultado para Claude, Gemini y NotebookLM): Antigravity, formato antiguo de Claude (plaintext, tool calls, MCP, `Thought:`), opciones de ChatGPT, variante antigua de Gemini, editor de clasificación, funciones sin uso, opciones `'none'` / `'preproceso'`.
2. **Reestructuración**: `src/formatos/` con un archivo por formato (detección, marcadores, limpieza propia); limpieza común; formato genérico de respaldo; detección por archivo.
3. **Corrección de fallos**: prompts sin respuesta, razonamiento de Claude de una línea, fechas de sesión de NotebookLM con regla segura, negritas tras paréntesis o comillas, archivo de NotebookLM que falla (pendiente de ejemplo).
4. **Interfaz**: pocas opciones visibles; formato detectado por archivo; recorte de estilos.
5. **Documentación y versión**: `AI_INSTRUCTIONS.md`, `STATUS.md`, versión en un solo lugar.

## Decisiones pendientes

- Prompts largos de varios párrafos: ¿un bloque o primer párrafo con hijos? (por ahora sin cambio)
- Importación incremental (buscar y cortar): ¿se conserva? (por ahora se conserva)
- Opciones visibles: propuesta inicial = razonamiento del modelo, marcas de tiempo, neutralización de `[[ ]]`.
- Ejemplo real de NotebookLM que falle.
