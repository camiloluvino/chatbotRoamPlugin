# Status - Chatbot Roam Plugin

## Versión Actual
**v1.1.1** | Build: 2026-01-02 02:15

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
- Búsqueda incremental en preview
- Cortar desde posición encontrada
- Loader para auto-update desde GitHub Pages

### 🔧 Estable pero sensible
- Filtro MCP Tool Calls (historial de bugs, probar cambios)
- Parsing de bloques de código multilínea

---

## Historial Reciente

| Fecha | Cambio |
|-------|--------|
| 2026-01-02 | Fix build desactualizado que no incluía MCP Tool Calls |
| 2025-12-30 | Refactorización: opciones de limpieza centralizadas en `opciones-limpieza.js` |
| 2025-12-30 | Agregado soporte para Antigravity (error handling con rollback) |
| 2025-12-28 | Agregada indentación bajo headings markdown (3 niveles) |

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
