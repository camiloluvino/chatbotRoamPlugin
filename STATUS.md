# Status - Chatbot Roam Plugin

## Versión Actual
**v1.3.4** | Build: 2026-01-20

---

## Estado de Funcionalidades

### ✅ Funcionando
- Drag & drop de archivos .md
- Auto-detección de tipo de chatbot (Claude, ChatGPT, Gemini, Antigravity)
- 15 opciones de limpieza configurables (registro centralizado)
- Vista previa antes de insertar
- Inserción jerárquica en Roam
- Preservación de bloques de código
- Indentación bajo headings markdown (#, ##, ###)
- **Conversión de tablas Markdown a formato nativo Roam**
- Búsqueda incremental en preview
# Estado del Proyecto: Chatbot Roam Plugin

**Versión Actual:** v1.3.3
**Última Actualización:** 18/01/2026

## 🚀 Estado
- **Funcionalidad:** Estable
- **Pruebas:** Pendiente validación manual de batching y asyncUI.

## 📋 Cambios Recientes
- **v1.3.3:**
  - **Critical Stability:** Implementado procesamiento asíncrono para evitar bloqueos del navegador en archivos grandes.
  - **Batch Insertion:** Inserción de bloques por lotes (50 bloques/50ms) para prevenir crashes en Roam y sobrecarga de API.
  - **Async UI:** Indicadores de carga ("Procesando...", "Insertando X%") y bloqueo de interfaz durante operaciones pesadas.
  - **Rollback Global:** Mejora en la robustez del mecanismo de rollback para soportar múltiples lotes.
- **v1.3.2:** Fix conversión de tablas Markdown a Roam.
- **v1.3.1:** Editor de Clasificación Manual para MCP.

---

## Historial Reciente

| Fecha | Cambio |
|-------|--------|
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
