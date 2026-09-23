# Status - Chatbot Roam Plugin
 
 ## Versión Actual
- **v1.5.4** | Build: 2026-09-23

### Resumen de Estado
- **Plugin:** Funcional, estable, de alto rendimiento y totalmente compatible con `roam/js`.
- **Rendimiento Ultra Liviano (v1.5.4):** Eliminación total del `backdrop-filter: blur(6px)` y del fondo azul translúcido pesado en el modal overlay, aliviando la composición GPU y cancelando el reflow/repaint continuo del DOM de Roam.
- **Inserción Acelerada Adaptativa (v1.5.4):** Delay base de 250ms por lote para importaciones de hasta 1,000 bloques (~10x más rápido), protegiendo automáticamente la cuota de mutación de Roam solo en importaciones masivas.
- **Conteo Lineal O(N) y Algoritmos Seguros (v1.5.4):** Escaneo acumulativo para conteo de líneas en `extraerTodosLosBloques`, loops seguros reemplazando `push(...spread)` (eliminando riesgo de `RangeError` por stack overflow) y rendimiento fluido en bucles mediante yielding temporal (~16ms).
- **UI Responsiva y Libre de Memory Leaks (v1.5.4):** Debounce en búsqueda de texto y cambio de opciones, navegación de matches sin re-parsear 80KB de HTML en innerHTML, y limpieza estricta de variables de memoria y estilos al cerrar el modal.
- **Compatibilidad Roam/JS:** Eliminación total de template literals / backticks en el bundle para evitar que el parser de bloques de Roam rompa el script.
- **Tablas Nativas Roam Anidadas (v1.5.3):** Corrección definitiva de indentación en `formatter.js` (`indentTablaActual`), anidando correctamente columnas y filas bajo el bloque contenedor `{{[[table]]}}` sin desapilarlas en el parser.
- **Inserción Robusta Anti-Orphans (v1.5.3):** Registro incremental de UIDs en tiempo real dentro de `_executeBatch` para garantizar rollback íntegro si un lote falla a mitad de camino, y detección case-insensitive de errores de rate limit de Roam.
- **Preservación de Respuestas de IA (v1.5.3):** Prevención de descarte silencioso de respuestas extensas cuando el prompt queda vacío tras la limpieza (ej: subida de solo imágenes o filtros de timestamps), utilizando el placeholder `* [sin texto]`.
- **Soporte NotebookLM Mejorado (v1.5.2):** Compatibilidad completa con el nuevo formato de exportación en inglés (`### 🧑 **User**` / `### 🤖 **NotebookLM**`), español y chino retrocompatible. Limpieza mejorada de encabezados `Exported at:`, fechas de sección (`## 📅 Monday...`), bloque `Thoughts` y fuentes `> **Sources:**`.
- **Soporte Gemini Mejorado (v1.5.1):** Jerarquía de bloques multinivel (h1 a h6, sub-headings y listas anidadas), preservación y saneamiento de etiquetas en bloques de código (`limpiar_etiquetas_codigo_gemini`), y eliminación robusta de bloques multilínea de Thinking steps.

---

## 🚀 Estado
- **Funcionalidad:** Estable
- **Pruebas:** Bundle verificado sin backticks, build superado con 0 errores, syntax check con Node.js superado, pruebas de rendimiento y compilación 100% exitosas.

## Estado de Funcionalidades

### ✅ Funcionando
- **Rendimiento Ultra Liviano (v1.5.4):** Sin blur GPU, sin fugas de memoria, navegación de búsqueda instantánea y animaciones ligeras.
- **Inserción Acelerada Adaptativa (v1.5.4):** Inserción 10x más rápida con delay de 250ms entre lotes de 50 bloques.
- **Tablas Roam Nativas Anidadas (v1.5.3):** Jerarquía correcta bajo `{{[[table]]}}` para tablas Markdown importadas.
- **Rollback Anti-Orphans (v1.5.3):** Rastreabilidad en tiempo real de UIDs creados durante ejecución en lote y fallback individual.
- **Protección de Datos en Prompts Vacíos (v1.5.3):** Fallback `* [sin texto]` para preservar respuestas de IA.
- **Soporte NotebookLM Multilingüe (v1.5.2):** Auto-detección y parsing de exportaciones en inglés, español y chino antiguo sin rechazos en dropzone.
- **Jerarquía Multinivel Unificada (v1.5.1):** El parser de Roam y el formateador ahora manejan cualquier profundidad de encabezados markdown (# a ######) y listas anidadas mediante árbol basado en pila (stack).
- **Limpieza de Parámetros en Fences de Código (v1.5.1):** Nueva opción activa por defecto `limpiar_etiquetas_codigo_gemini` para conservar el código y lenguaje en Roam limpiando parámetros internos (`?code_reference`, etc.).
- **Thinking Steps Robusto (v1.5.1):** Soporte para variaciones de formato y líneas intermedias en bloques de pensamiento de Gemini.
- **Zero-Backtick Bundle (v1.5.1):** 0 backticks en todo el código compilado (incluyendo regex y comentarios) para compatibilidad nativa con `{{[[roam/js]]}}`.
- **Diagnóstico Descriptivo de Advertencias (v1.4.9):** El dropzone muestra el detalle exacto de las advertencias encontradas (ej: archivo vacío, estructura no reconocida).
- **Editor de Clasificación Seguro (v1.4.9):** Intercambio de roles Prompt/Response preservando marcadores originales y evitando desfase de índices.
- **Protección de Bloques de Código en Limpieza (v1.4.9):** La neutralización de `::` y `[[ ]]` no altera el contenido dentro de bloques de código (fenced code blocks).
- **Solarized/Claude Design (v1.4.0):** Diseño minimalista con paleta Solarized Dark y acentos dorados/cyan inspirados en Claude AI.
- **Rate Limit Safe:** Límite estricto y delay adaptativo para respetar la cuota oficial de Roam (1500 mutaciones/60s).
- **Cancelación Real con Rollback:** Botón cancelar detiene proceso y elimina bloques creados de forma regulada.
- **Importador Múltiple (v1.4.2):** Carga simultánea de archivos con agrupación jerárquica por nombre de archivo.
- Drag & drop de archivos .md
- Auto-detección de tipo de chatbot (Claude, ChatGPT, Gemini, Antigravity, NotebookLM)
- 18 opciones de limpieza configurables (registro centralizado)
- Vista previa antes de insertar con búsqueda incremental
- Inserción jerárquica en Roam con preservación de bloques de código y tablas Markdown

## 📋 Cambios Recientes
- **v1.5.4 (2026-09-23):**
  - **Eliminación de Backdrop Blur y Fondo Pesado:** Eliminado `backdrop-filter: blur(6px)` y sustituido el fondo Solarized azul translúcido (`rgba(7, 54, 66, 0.85)`) por un overlay oscuro simple (`rgba(0, 0, 0, 0.6)`), reduciendo drásticamente la carga de la GPU.
  - **Optimización de Inserción (Pacing Adaptativo):** Delay entre lotes de mutación reducido a 250ms para chats de hasta 1,000 bloques (~10x más rápido). Cálculo adaptativo para importaciones masivas preservando el límite oficial de 1500 mutaciones/60s.
  - **Eliminación de Doble Procesamiento en Carga:** Corregida condición de carrera en `_handleFiles()` donde `_applyPreset` disparaba un preview asíncrono redundante en paralelo con la llamada principal.
  - **Algoritmo Lineal O(N) en Clasificación:** Reemplazado el cálculo de número de línea por bloque (`substring().split('\n')`) por un cursor lineal acumulativo, ahorrando cientos de megabytes de basura temporal.
  - **Búsqueda y Navegación Ágiles:** Agregado debounce de 250ms en input de búsqueda y actualización de coincidencias mediante toggle de clases CSS sin destruir ni recrear los 80KB de HTML en `innerHTML`.
  - **Prevención de Stack Overflow:** Sustitución de sintaxis `push(...array)` por bucles tradicionales en manejo de pensamiento y tablas Markdown.
  - **Batch DOM en Inversión en Cadena:** `_invertirDesdeAqui()` realiza la inversión lógica primero y actualiza el DOM del panel una sola vez al final.
  - **Limpieza Completa de Memoria:** `closeModal()` ahora nulifica todas las referencias a documentos multi-MB, elimina la etiqueta `<style>` inyectada en `<head>` y cancela temporizadores pendientes.
  - **Optimización en Cleaner MCP Claude:** Eliminadas subcadenas intermedias repetidas sustituyéndolas por navegación mediante cursores numéricos.
  - **CSS Containment y Corrección de Sintaxis:** Contención de layout y estilo en contenedores con scroll pesado y eliminación de llave de cierre huérfana en `styles.js`.
- **v1.5.3 (2026-09-07):**
  - **Corrección Definitiva de Tablas Roam:** Introducción de `indentTablaActual` en `formatter.js` para asegurar que las filas se aniden como hijas directas de `{{[[table]]}}` y sus columnas subsiguientes (8+ espacios), evitando que el parser las desapile como elementos hermanos.
  - **Inserción Robusta Anti-Orphans:** Parámetro `createdUids` en `_executeBatch` que registra cada bloque en tiempo real. En caso de fallo a mitad de un lote en fallback individual, los bloques ya creados son revertidos por el rollback automático.
  - **Detección Normalizada de Rate Limits:** Tratamiento insensible a mayúsculas/minúsculas (`.toLowerCase()`) de mensajes de cuota de Roam en inserción y rollback.
  - **Preservación de Respuestas con Prompt Vacío:** `formatExchange` ahora asigna el placeholder `* [sin texto]` cuando el prompt queda vacío pero la respuesta contiene datos, evitando el descarte silencioso de contenido.
  - **Sincronización de Versiones:** Unificación de versión `1.5.3` en `build.ps1`, `src/index.js`, `src/patterns.js`, y documentación.
- **v1.5.2 (2026-09-02):**
  - **Soporte Nuevo Formato NotebookLM:** Reconocimiento de marcadores en inglés (`### 🧑 **User**` y `### 🤖 **NotebookLM**`), español y chino legacy en validación y extracción.
  - **Limpieza Ampliada NotebookLM:** Detección de línea de exportación `Exported at:`, fechas de sección (`## 📅 ...`), eliminación de `Thoughts` inicial y filtrado de citas `> **Sources:**` / `> **Fuentes:**`.
- **v1.5.1 (2026-08-14):**
  - **Jerarquía Multinivel en Parser & Formatter:** Reemplazo de lógica rígida de 2 niveles por un algoritmo stack-based que soporta headings h1..h6, sub-headings y listas anidadas con sangría precisa en Roam.
  - **Opción de Limpieza de Fences de Código:** Agregada opción `limpiar_etiquetas_codigo_gemini` para sanear delimitadores de código preservando el contenido (` ```python?code_... ` -> ` ```python `).
  - **Filtro Thinking Steps Flexible:** Detección mejorada para saltos de línea internos y variantes de encabezados en el pensamiento de Gemini.
  - **Soporte de Headings h4..h6 en Inserter:** Mapeo de `####`, `#####`, `######` a heading 3 en Roam Alpha API.
  - **Cero Backticks Estricto:** Eliminación de backticks literales en regex (`\x60`) y comentarios en todo el código fuente.
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
| 2026-09-07 | v1.5.3: Corrección definitiva de anidación de tablas Roam, tracking incremental de UIDs anti-orphans en inserción/rollback, rate limit case-insensitive y preservación de respuestas con prompt vacío |
| 2026-09-02 | v1.5.2: Soporte para nuevo formato de exportación NotebookLM (inglés, español y chino retrocompatible), fechas de sección y filtro Thoughts/Sources |
| 2026-08-14 | v1.5.1: Jerarquía multinivel h1..h6 y anidación stack-based en parser/formatter, opción limpiar_etiquetas_codigo_gemini y filtro robusto de Thinking steps |
| 2026-08-14 | v1.5.0: Soporte actualizado Gemini (limpieza de tools/python code execution, omisión de timestamps en respuestas y delimitadores de código limpios) |
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
