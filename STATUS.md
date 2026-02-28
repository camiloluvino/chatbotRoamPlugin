# Status - Chatbot Roam Plugin

## Versión Actual
**v1.4.1** | Build: 2026-02-27

### Resumen de Estado
- **Plugin:** Funcional y estable.
- **Inserción:** Mejorada con robustez ante fallos de la batch API (fallback automático).
- **Pruebas:** Nuevo diseño Solarized/Claude aplicado (v1.4.1)

---

## 🚀 Estado
- **Funcionalidad:** Estable
- **Pruebas:** Nuevo diseño Solarized/Claude aplicado (v1.4.1)

## Estado de Funcionalidades

### ✅ Funcionando
- **Solarized/Claude Design (v1.4.0):** Nuevo diseño minimalista con paleta Solarized Dark y acentos dorados/cyan inspirados en Claude AI.
- **Rate Limit Safe:** Límite estricto de 22 ops/seg para evitar errores de API Roam (v1.3.8)
- **Cancelación Real:** Botón cancelar detiene proceso y limpia basura (v1.3.8)
- Drag & drop de archivos .md
- Auto-detección de tipo de chatbot (Claude, ChatGPT, Gemini, Antigravity, NotebookLM)
- 17 opciones de limpieza configurables (registro centralizado)
- Vista previa antes de insertar
- Inserción jerárquica en Roam
- Preservación de bloques de código
- Indentación bajo headings markdown (#, ##, ###)
- Conversión de tablas Markdown a formato nativo Roam
- Búsqueda incremental en preview
- Editor de Clasificación Manual (v1.3.6)
- Procesamiento asíncrono y por lotes (v1.3.3)

## 📋 Cambios Recientes
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
|-------|--------|
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
