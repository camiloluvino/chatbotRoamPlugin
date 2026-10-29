# Status - Chatbot Roam Plugin

## Versión actual
**v2.0.0** | 2026-10-29 | rama `claude/practical-gates-5s2tci` (no publicada en `master`)

## Verificación
- `node tests/run-fixtures.js`: 6 de 6 ejemplos coinciden (Claude, Gemini, NotebookLM inglés y chino, genérico, mezcla Claude + Gemini).
- Modal probado en navegador headless con la API de Roam simulada: carga, opciones, vista previa e inserción sin errores.
- **Pendiente: prueba en Roam real.**

## Formatos
| Formato | Estado | Notas |
|---|---|---|
| Claude | Probado con exportación real (extracto) | |
| Gemini | Probado con exportación real (extracto) | |
| NotebookLM (chino) | Probado con exportación real | |
| NotebookLM (inglés) | Probado solo con ejemplo construido | Falta una exportación real que haya fallado |
| Genérico | Probado con ejemplo construido | ChatGPT, Grok, etc. |

## Problemas conocidos
- El nombre del lenguaje de los bloques de código se quita siempre (comportamiento heredado; Roam los inserta sin resaltado).
- Las respuestas consecutivas de Claude se unen antes de limpiar: solo la primera pierde su cita inicial de razonamiento.
- Los prompts de varios párrafos se aplanan en un solo bloque.

## Decisiones pendientes
- Prompts de varios párrafos: ¿un bloque o primer párrafo con hijos?
- Importación incremental: se conserva mientras no se decida otra cosa.

## Historial
### v2.0.0 (2026-10-29) - Simplificación
- Red de seguridad: ejemplos en `test-data/fixtures/`, `tests/run-fixtures.js`, build en Node (`scripts/build.js`).
- Eliminados: Antigravity, formato antiguo de Claude (plaintext, tool calls, MCP), opciones de ChatGPT, editor de clasificación, limpiezas que nunca se ejecutaban.
- Un módulo por formato en `src/formatos/`; detección por archivo.
- Corregido: un archivo de Gemini importado junto a uno de Claude se perdía entero.
- Corregido: los prompts sin respuesta se perdían.
- Corregido: el razonamiento de Claude de una sola línea no se eliminaba.
- Corregido: las fechas de sesión de NotebookLM quedaban como encabezados; las negritas tras paréntesis o comillas se partían en varios bloques.
- Los archivos no reconocidos reciben la limpieza común.
- Modal con cuatro opciones visibles y el formato detectado de cada archivo.
- Versión definida solo en `src/index.js`.

El historial hasta v1.5.5 está en el historial de git de este archivo.
