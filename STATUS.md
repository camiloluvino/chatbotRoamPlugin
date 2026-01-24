# Status - Chatbot Roam Plugin

## Versión Actual
**v1.3.7** | Build: 2026-01-24

---

## 🚀 Estado
- **Funcionalidad:** Estable
- **Pruebas:** NotebookLM validado con archivo de usuario (soporte UTF-8 completo).

## Estado de Funcionalidades

### ✅ Funcionando
- Drag & drop de archivos .md
- Auto-detección de tipo de chatbot (Claude, ChatGPT, Gemini, Antigravity, **NotebookLM**)
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
- **v1.3.7:**
  - **Soporte NotebookLM:** Parsing completo de exportaciones de NotebookLM (incluyendo marcadores en chino).
  - **Encoding Fix:** Solución definitiva para caracteres Unicode usando `String.fromCodePoint` para evitar corrupción en build.
  - **Bullet Fix:** Normalización de viñetas de NotebookLM (•, ◦) para listados anidados correctos.
  - **UI Update:** Botón de preset y validación actualizada.
- **v1.3.6:** Fix: La opción "Revisar clasificación" ahora se respeta al cargar archivo.
- **v1.3.3:** Implementado procesamiento asíncrono y batch insertion.

---

## Historial Reciente

| Fecha | Cambio |
|-------|--------|
| 2026-01-24 | v1.3.7: Soporte NotebookLM + Fix encoding UTF-8 + Fix bullets (•, ◦) |
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
