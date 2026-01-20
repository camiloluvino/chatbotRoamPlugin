# AI Instructions - Chatbot Roam Plugin

Plugin para Roam Research que importa conversaciones exportadas de chatbots (Claude, ChatGPT, Gemini) mediante drag & drop. Limpia metadata, tool calls y bloques de pensamiento, preservando la estructura jerárquica.

---

## Fuente de Verdad

**Archivos fuente**: `src/` (6 módulos JavaScript + 2 en `roam/`)  
**Bundle generado**: `chatbot-roam-plugin.js` (NO editar directamente)

### Flujo de trabajo obligatorio
1. Editar archivos en `src/`
2. Ejecutar `.\build.ps1` desde `src/`
3. Probar en Roam con archivo de ejemplo
4. Commit

> [!CAUTION]
> NUNCA edites `chatbot-roam-plugin.js` directamente. Los cambios se pierden en el próximo build.

---

## Arquitectura

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Patterns | `patterns.js` | Regex compilados y constantes |
| Cleaners | `cleaners.js` | Funciones de limpieza de texto |
| Opciones | `opciones-limpieza.js` | **Registro centralizado de opciones de limpieza** |
| Formatter | `formatter.js` | Formatea respuestas para estructura de bloques Roam |
| Processing | `processing.js` | Extracción y procesamiento de conversaciones |
| Styles | `styles.js` | CSS del modal |
| Parser | `roam/parser.js` | Parsea texto a estructura de bloques |
| Inserter | `roam/inserter.js` | Inserta bloques en Roam con rollback |
| UI | `ui.js` | Modal, eventos, vista previa |
| Plugin | `index.js` | Inicialización y registro de comandos |

### Flujo de control
```
index.js → Registra comando "Importar Conversacion de Chatbot"
  → Usuario activa (Ctrl+Shift+I)
  → ChatbotRoamUI.openModal()
    → Drag & drop archivo .md
    → Detecta tipo chatbot → Aplica preset
    → ¿Opción "Revisar Clasificación" activa? → Sí: Editor de Clasificación
    → ChatbotRoamProcessing.procesarConOpcionesIndividuales() [ASYNC]
    → Preview → Insertar en Roam [BATCHED]
```

---

## Decisiones de Diseño

1. **JavaScript vanilla**: Sin dependencias npm. El código se concatena en un solo bundle.

2. **Objetos globales por módulo**: `ChatbotRoamPatterns`, `ChatbotRoamCleaners`, `ChatbotRoamOpciones`, `ChatbotRoamFormatter`, `ChatbotRoamProcessing`, `ChatbotRoamStyles`, `ChatbotRoamParser`, `ChatbotRoamInserter`, `ChatbotRoamUI`, `ChatbotRoamPlugin`.

3. **Orden de concatenación**: El build respeta dependencias:
   ```
   patterns.js → cleaners.js → opciones-limpieza.js → formatter.js → 
   processing.js → styles.js → roam/parser.js → roam/inserter.js → ui.js → index.js
   ```

4. **Distribución via GitHub Pages**: `loader.js` carga el plugin desde `https://camiloluvino.github.io/chatbotRoamPlugin/`

---

## Principios Operativos

### Backticks (CRÍTICO)
Roam interpreta backticks de forma especial. **NUNCA** escribir backticks literales en strings NI EN COMENTARIOS.

```javascript
// ✅ CORRECTO
const BACKTICK = String.fromCharCode(96);
const BT3 = BACKTICK + BACKTICK + BACKTICK;
// Buscar bloque (BT4 + lang ... BT4)

// ❌ INCORRECTO - Rompe el código en Roam
const BT3 = '```';
// Buscar bloque (````lang ... ````)
```

### Convenciones de nombrado
- **Funciones públicas**: `camelCase` en español (`eliminarImagenesEmbedidas`)
- **Funciones privadas UI**: Prefijo `_` (`_parseToBlockStructure`)
- **Constantes**: `UPPER_SNAKE_CASE` (`INDENT_BASE`, `BT3`)
- **Regex patterns**: `UPPER_SNAKE_CASE` (`MCP_TOOL_CALLS`)

### Versionado
La versión `1.0.0` está definida en 3 lugares (mantener sincronizados):
- `src/patterns.js` → `ChatbotRoamPatterns.VERSION`
- `src/index.js` → `ChatbotRoamPlugin.VERSION`  
- `src/build.ps1` → `$version`

### Idioma del código
- Funciones y variables: **Español**
- Nombres técnicos estándar: **Inglés** (`children`, `text`, `uid`)
- Comentarios: **Español**

---

## Contexto Técnico

### Roam Alpha API
El plugin depende de `window.roamAlphaAPI` para:
- `ui.commandPalette.addCommand()` - Registrar comandos
- `ui.getFocusedBlock()` - Obtener bloque seleccionado
- `data.block.create()` - Crear bloques

### Formato de entrada
Archivos `.md` con marcadores:
```markdown
## Prompt:
12/28/2024, 10:30:00 a.m.
[contenido del prompt]

## Response:
[contenido de la respuesta]
```

### Sistema de indentación
| Espacios | Nivel | Uso |
|----------|-------|-----|
| 0 (con `* `) | Prompt | Pregunta del usuario |
| 4 | Respuesta | Contenido nivel 1 |
| 8 | Bajo heading | Contenido bajo `#`, `##`, `###` |
| 4, 8, 12, 16... | Tabla Roam | `{{[[table]]}}` con columnas anidadas |

### Flujo de datos del pipeline
```
cleaners.js → formatter.js → parser.js → inserter.js (Recursivo + Batching + Rollback)
```

> [!IMPORTANT]
> **Testing E2E obligatorio**: Cuando se modifica cualquier módulo del pipeline, probar el flujo COMPLETO hasta `parser.js`. Tests unitarios que pasan en módulos individuales NO garantizan que el sistema funcione end-to-end.

#### Tablas Roam
Las tablas Markdown se convierten a formato Roam en `cleaners.js` y mantienen su estructura anidada. `parser.js` tiene lógica especial para detectar `{{[[table]]}}` y construir la jerarquía de columnas usando `_parseIndentedBlocks()`.

---

## Fragilidades y Errores Comunes

### Errores que una IA podría cometer

1. **Escribir backticks literales** → Plugin no funciona en Roam
2. **Editar bundle en lugar de fuentes** → Cambios se pierden
3. **Olvidar ejecutar build.ps1** → Bundle desactualizado
4. **Cambiar orden en build.ps1** → Rompe dependencias entre módulos
5. **No probar en Roam** → Bugs pasan a producción

### Puntos frágiles del sistema

1. **Regex MCP Tool Calls**: Historial de bugs con patrones complejos. Probar exhaustivamente cualquier cambio.

2. **Orden de ejecución de cleaners en `opciones-limpieza.js`**: Los cleaners se ejecutan en el orden en que están definidos. MCP Tool Calls debe ejecutarse ANTES que plaintext para encontrar el patrón completo.

3. **`_parseToBlockStructure()`**: Maneja jerarquía de 3 niveles. Errores aquí corrompen la estructura del graph.

4. **Marcador `[CODE]` y `{{NL}}`**: Sistema frágil para preservar bloques de código multilínea.

5. **Encoding UTF-8**: Problemas históricos con caracteres especiales (flechas →, acentos). El build usa UTF-8 sin BOM.

6. **Editor de Clasificación**: Opcional (checkbox "Revisar clasificación"). Permite corregir manualmente la clasificación Prompt/Response antes de procesar. Botón [⇄] intercambia uno, botón [↓↓] invierte desde ese punto.

### Checklist pre-commit
- [ ] El código compila sin errores (`build.ps1` ejecuta correctamente)
- [ ] Probado en Roam Research con un archivo de ejemplo
- [ ] Comentarios actualizados si se modificó lógica compleja
- [ ] README actualizado si se agregó funcionalidad nueva
- [ ] **STATUS.md actualizado** (ver regla abajo)

---

## ⚠️ REGLA IMPERATIVA: Documentar Modificaciones

> [!CAUTION]
> **TODA modificación al código DEBE registrarse en `STATUS.md`**. No hay excepciones.

### Qué hacer después de CUALQUIER cambio:

1. **Actualizar `STATUS.md` → Historial Reciente** con:
   - Fecha (`YYYY-MM-DD`)
   - Descripción breve del cambio

2. **Si el cambio amerita nueva versión**, actualizar:
   - `STATUS.md` → Versión Actual
   - `src/patterns.js` → `VERSION`
   - `src/index.js` → `VERSION`
   - `src/build.ps1` → `$version`

### Ejemplo de entrada en Historial:
```markdown
| 2026-01-08 | Ampliado tamaño del modal para mejor visualización |
```

### Por qué es imperativo:
- Sin registro, se pierde trazabilidad de cambios
- Facilita debugging cuando algo deja de funcionar
- El timestamp de `build.ps1` NO es suficiente (solo indica cuándo, no qué)
