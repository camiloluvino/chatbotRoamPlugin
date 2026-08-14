# Status - Chatbot Roam Plugin
 
 ## Versión Actual
- **v1.4.9** | Build: 2026-08-14

### Resumen de Estado
- **Plugin:** Funcional, estable y totalmente compatible con `roam/js`.
- **Compatibilidad Roam/JS:** Eliminación total de template literals / backticks en el bundle para evitar que el parser de bloques de Roam rompa el script.
- **Robustez UI & Limpieza:** Mensajes de advertencia descriptivos en el dropzone, intercambio seguro de clasificación sin corrupción de texto y neutralización de sintaxis con protección de bloques de código.

---

## 🚀 Estado
- **Funcionalidad:** Estable
- **Pruebas:** Bundle verificado sin backticks, syntax check superado, estilos y UI validados.

## Estado de Funcionalidades

### ✅ Funcionando
- **Zero-Backtick Bundle (v1.4.9):** 0 backticks en todo el código compilado para compatibilidad nativa con `{{[[roam/js]]}}`.
- **Diagnóstico Descriptivo de Advertencias (v1.4.9):** El dropzone muestra el detalle exacto de las advertencias encontradas (ej: archivo vacío, estructura no reconocida).
- **Editor de Clasificación Seguro (v1.4.9):** Intercambio de roles Prompt/Response preservando marcadores originales y evitando desfase de índices.
- **Protección de Bloques de Código en Limpieza (v1.4.9):** La neutralización de `::` y `[[ ]]` no altera el contenido dentro de bloques de código (fenced code blocks).
- **Solarized/Claude Design (v1.4.0):** Diseño minimalista con paleta Solarized Dark y acentos dorados/cyan inspirados en Claude AI.
- **Rate Limit Safe:** Límite estricto y delay adaptativo para respetar la cuota oficial de Roam (1500 mutaciones/60s).
- **Cancelación Real con Rollback:** Botón cancelar detiene proceso y elimina bloques creados de forma regulada.
- **Importador Múltiple (v1.4.2):** Carga simultánea de archivos con agrupación jerárquica por nombre de archivo.
- Drag & drop de archivos .md
- Auto-detección de tipo de chatbot (Claude, ChatGPT, Gemini, Antigravity, NotebookLM)
- 17 opciones de limpieza configurables (registro centralizado)
- Vista previa antes de insertar con búsqueda incremental
- Inserción jerárquica en Roam con preservación de bloques de código y tablas Markdown

## 📋 Cambios Recientes
- **v1.4.9 (2026-08-14):**
  - **Eliminación Total de Backticks:** Reemplazo integral de template literals por concatenación y `join()` en toda la base de código para compatibilidad estricta con bloques `roam/js`.
  - **Fix de Visibilidad del Modal:** Corrección de la propiedad `position: fixed;` en `.chatbot-roam-overlay` tras la migración de estilos.
  - **Advertencias Descriptivas:** El dropzone ahora lista explícitamente el motivo de cada advertencia en lugar de mostrar un contador genérico.
  - **Fix Editor de Clasificación:** Se añadió `marcadorOriginal` en los bloques y se corrigió la lógica de intercambio para no corromper el contenido de la conversación al alternar entre Prompt y Response.
  - **Neutralización Segura de Sintaxis:** La función `neutralizarSintaxisRoam` ahora segmenta el texto para proteger bloques de código ` ``` ` de modificaciones destructivas.
- **2026-07-29:**
  - **Soporte Gemini Exporter V2:** Reconocimiento del nuevo formato de exportación (`## User:` / `## Gemini:`) y eliminación de bloques de pensamiento en formato `> **Thinking steps**`.
- **v1.4.8:**
  - **Rate Limit Adaptativo:** Agregado cálculo dinámico del delay entre lotes para respetar de forma precisa la cuota de mutación oficial de Roam (1,500 mutaciones por 60 segundos).
  - **Rollback Rate-Limited:** El sistema de rollback tras cancelar o fallar una inserción ahora también está regulado por el rate limit para evitar bloqueos del navegador o de la cuenta.
  - **Optimización de Memoria en Extracción:** Eliminada iteración de código muerto y uso excesivo de `split()` en archivos grandes. Las búsquedas de timestamps ahora ocurren sobre fragmentos limitados de 1,000 bytes.
  - **Filtro de Imágenes Optimizado:** Reemplazado loop caracter por caracter por conteo de coincidencia RegExp nativo.
  - **Preview Truncado e Interfaz Ágil:** La UI de la preview ahora se trunca a 80K caracteres y el escape de HTML evita la creación de elementos DOM temporales.
- **v1.4.6:**
  - **Fix estructural NotebookLM:** Corrección mediante Regex de colisiones entre cierre de negritas y texto descriptivo (`**Título**Texto`).
  - **Jerarquía de Negritas:** Las líneas compuestas íntegramente por negritas ahora actúan como encabezados topológicos, anidando el contenido siguiente automáticamente en Roam.
  - **Parser Update:** El parser de Roam ahora reconoce líneas en negrita como títulos, preservando la anidación y eliminando caracteres de control sobrantes.
- **v1.4.5:**
  - **Neutralización de Sintaxis:** Nueva lógica para romper `::` y `[[ ]]` inyectando espacios.
  - **Comportamiento Diferenciado:** La limpieza es obligatoria para el input del usuario (User Prompt) y opcional (configurable) para la respuesta de la IA.
- **v1.4.2:**
  - **Importador Múltiple:** Soporte para cargar varios archivos .md simultáneamente.
  - **Jerarquía Automática:** Cada archivo importado se anida bajo un bloque padre con el nombre del archivo (`📁 nombre.md`), manteniendo el orden alfabético.
- **v1.4.0:**
  - **Solarized/Claude Design:** Nuevo diseño minimalista con paleta Solarized Dark. Fondo base #002b36, acentos en dorado (#b58900) y cyan (#2aa198). Bordes más sutiles, tipografía más limpia.
- **v1.3.9:**
  - **NotebookLM Formatting:** Limpieza de escapes innecesarios (e.g. `1\.` a `1.`) en exportaciones de NotebookLM para mejorar legibilidad.
  - **Detección Mejorada:** Lógica de detección NotebookLM integrada en el flujo de limpieza principal.
- **v1.3.8:**
  - **Rate Limit Protection:** Velocidad de inserción ajustada a 22 ops/seg (1320/min) para respetar límite de Roam API (1500/min).
  - **Cancelación Segura:** Ahora es posible cancelar una importación en curso. Incluye rollback automático (limpieza de bloques parciales).
  - **Rollback Throttled:** La limpieza tras error/cancelación también respeta la velocidad segura.
- **v1.3.7:**
  - **Soporte NotebookLM:** Parsing completo de exportaciones de NotebookLM (incluyendo marcadores en chino).
  - **Encoding Fix:** Solución definitiva para caracteres Unicode.
  - **Robustez UI:** Uso de escapes Unicode.
- **v1.3.6:** Fix: La opción "Revisar clasificación" ahora se respeta al cargar archivo.

---

## Historial Reciente

| Fecha | Cambio |
| 2026-08-14 | v1.4.9: Zero-backtick bundle para compatibilidad total con roam/js, fix de modal overlay, advertencias descriptivas, fix editor de clasificación y neutralización segura de sintaxis |
| 2026-07-29 | Soporte Gemini Exporter V2 (## User / ## Gemini, y filtro de > **Thinking steps**) |
| 2026-07-05 | v1.4.8: Optimización de rendimiento para archivos grandes y mitigación del rate limit (1500 ops/60s) en inserción y rollback |
| 2026-05-22 | v1.4.7: Soporte para formato Claude V2 (## User/Assistant, timestamps en blockquote y eliminación de bloques de pensamiento en blockquote) |
| 2026-04-16 | v1.4.6: Solución de colisiones estructurales en NotebookLM y soporte de jerarquía para negritas |
| 2026-04-05 | v1.4.5: Neutralización de sintaxis Roam (::, [[ ]]) obligatoria en prompts y opcional en respuestas |
| 2026-03-25 | v1.4.2: Importador múltiple con agrupación jerárquica por archivo |
| 2026-02-27 | v1.4.1: Corregido error "actions of undefined" en inserción mediante fallback robusto en Batch API |
| 2026-02-27 | Limpieza del proyecto: unificado build.ps1 (eliminado build-fixed.ps1), borrado PENDIENTE_TABLAS_ROAM.md, renombrado data/ → test-data/, sincronizada versión a v1.4.0 |
| 2026-02-22 | v1.4.0: Nuevo diseño Solarized/Claude (paleta minimalista con dorados y cyan) |
| 2026-01-26 | Reorganización del proyecto (`docs/`, `data/`) y actualización de documentación |
| 2026-01-25 | v1.3.8: Tasa de 22 ops/s para evitar errores API + Cancelación real con rollback seguro |
| 2026-01-24 | v1.3.7: Soporte NotebookLM + Fix encoding UTF-8 (build.ps1) + Unicode escapes en UI |
| 2026-01-20 | v1.3.6: Fix: La opción "Revisar clasificación" ahora se respeta al cargar archivo |
| 2026-01-20 | v1.3.5: Editor de Clasificación ahora es una opción manual ("Revisar clasificación") desactivada por defecto |
| 2026-01-20 | v1.3.4: Editor de Clasificación ahora aparece siempre (no solo con MCP) |
| 2026-01-18 | v1.3.3: Implementado procesamiento asíncrono y batch insertion para estabilidad. |
| 2026-01-18 | v1.3.2: Fix conversión de tablas - `parser.js` ahora soporta anidación profunda |
| 2026-01-08 | Ampliado tamaño del modal (700→900px) y alturas de preview/editor |
| 2026-01-08 | v1.3.1: Botón "Invertir desde aquí" para corregir errores en cadena |
| 2026-01-07 | v1.3.0: Editor de clasificación manual completo (reempl. detección automática) |
| 2026-01-07 | v1.2.0: Detección de bloques mal clasificados (MCP) |
| 2026-01-02 | Fix: MCP Tool Calls ahora se eliminan correctamente (reordenado cleaners) |
| 2025-12-30 | Refactorización: opciones de limpieza centralizadas en `opciones-limpieza.js` |
| 2025-12-30 | Agregado soporte para Antigravity (error handling con rollback) |
| 2025-12-28 | Agregada indentación bajo headings markdown (3 niveles) |
| 2025-12-25 | Corregido encoding UTF-8 para caracteres especiales |
| 2025-12-24 | Agregado filtro para MCP Tool Calls de Claude |

---

## Problemas Conocidos

- Ninguno reportado actualmente

---

## Próximos Pasos

- (Sin tareas pendientes definidas)

---

## Notas para la IA

### Cómo mantener este documento

Al final de cada sesión de trabajo, actualiza:

1. **Versión**: Si hubo cambios en `$version` de `build.ps1`
2. **Estado de funcionalidades**: Mover items entre secciones según corresponda
3. **Historial reciente**: Agregar entrada con fecha y descripción breve
4. **Problemas conocidos**: Documentar bugs descubiertos
5. **Próximos pasos**: Actualizar tareas pendientes

### Formato de entrada para historial
```markdown
| YYYY-MM-DD | Descripción breve del cambio |
```
