# Guías de Codificación - Chatbot Roam Plugin

Este documento establece las convenciones y principios para contribuir al desarrollo de este plugin.

## 📅 Encabezados de Archivo

**OBLIGATORIO**: Todo archivo JavaScript debe incluir un encabezado con la fecha de última modificación.

El script `build.ps1` genera automáticamente este encabezado en el bundle final:

```javascript
// CHATBOT ROAM PLUGIN v1.0.0
// Importador de conversaciones de chatbots (Claude, ChatGPT, Gemini) a Roam
// Uso: Ctrl+Shift+I o Command Palette
// Generated: YYYY-MM-DD HH:mm:ss
```

Los archivos fuente en `src/` deben mantener comentarios descriptivos al inicio indicando su propósito.

## 🏗️ Arquitectura Modular

El proyecto sigue una arquitectura de separación de responsabilidades:

| Archivo | Responsabilidad |
|---------|-----------------|
| `patterns.js` | Definiciones de regex (constantes) |
| `cleaners.js` | Funciones de limpieza de texto |
| `processing.js` | Lógica de extracción y procesamiento |
| `ui.js` | Interfaz de usuario y manejo del DOM |
| `index.js` | Inicialización y registro de comandos |

**Principio**: Cada módulo debe ser independiente y testeable. Evitar dependencias circulares.

## 🔤 Convenciones de Nombrado

- **Funciones públicas**: `camelCase` descriptivo (ej: `eliminarImagenesEmbedidas`)
- **Funciones privadas UI**: Prefijo `_` (ej: `_parseToBlockStructure`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `INDENT_BASE`, `BT3`)
- **Regex patterns**: `UPPER_SNAKE_CASE` descriptivo (ej: `MCP_TOOL_CALLS`)

## 💬 Idioma

- **Código**: Español para funciones y variables relacionadas con la lógica de negocio
- **Comentarios**: Español
- **Nombres técnicos**: Inglés cuando sea estándar (ej: `children`, `text`, `uid`)

## ⚠️ Manejo de Backticks

Roam Research tiene comportamiento especial con backticks. **SIEMPRE** usar:

```javascript
const BACKTICK = String.fromCharCode(96);
const BT3 = BACKTICK + BACKTICK + BACKTICK;
const BT4 = BACKTICK + BACKTICK + BACKTICK + BACKTICK;
```

**NUNCA** escribir backticks literales en strings, ya que Roam puede interpretarlos incorrectamente.

## 📐 Indentación y Jerarquía

El sistema de indentación para Roam usa espacios que luego se convierten en jerarquía:

| Espacios | Nivel | Uso |
|----------|-------|-----|
| 0 (con `* `) | Prompt | Pregunta del usuario |
| 4 | Respuesta | Contenido de nivel 1 |
| 8 | Bajo heading | Contenido bajo un heading `#` |

## 🔄 Proceso de Build

1. Modificar archivos en `src/`
2. Ejecutar `.\build.ps1` desde `src/`
3. El bundle se genera en `chatbot-roam-plugin.js`
4. Probar en Roam antes de hacer commit

## ✅ Checklist Pre-Commit

- [ ] El código compila sin errores (`build.ps1` ejecuta correctamente)
- [ ] Probado en Roam Research con un archivo de ejemplo
- [ ] Comentarios actualizados si se modificó lógica compleja
- [ ] README actualizado si se agregó funcionalidad nueva

## 🐛 Debugging

Para debug en Roam:
- Usar `console.log()` para verificar flujo
- Inspeccionar en DevTools (F12) de Chrome/Brave
- Los errores de inserción aparecen en la consola

## 📝 Historial de Cambios Importantes

- **2025-12-28**: Agregada indentación bajo headings markdown (3 niveles de jerarquía)
- **2025-12-25**: Corregido encoding UTF-8 para caracteres especiales
- **2025-12-24**: Agregado filtro para MCP Tool Calls de Claude
