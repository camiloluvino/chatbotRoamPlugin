# Cheatsheet - Chatbot Roam Plugin

## 🛑 ANTES DE ESCRIBIR CÓDIGO

```
□ ¿Estoy editando en src/ y NO en chatbot-roam-plugin.js?
□ ¿Hay backticks literales? (strings O comentarios → usar BT3/BT4)
□ ¿El orden de ejecución importa? (cleaners se procesan en orden de aparición)
□ ¿Mi regex afecta otros patrones existentes?
```

## 🛑 DESPUÉS DE ESCRIBIR CÓDIGO

```
□ Ejecutar build.ps1 desde src/
□ Probar en Roam con archivo de ejemplo REAL
□ Verificar que el plugin carga sin errores en consola
```

## ⚠️ TRAMPAS CONOCIDAS

| Trampa | Consecuencia | Solución |
|--------|--------------|----------|
| Backticks en comentarios | Roam rompe el código | Escribir `(BT4 + lang ... BT4)` |
| Editar bundle directamente | Cambios se pierden | Siempre editar `src/` |
| Cleaner A elimina lo que B necesita | Cleaner B falla silencioso | Revisar orden en `opciones-limpieza.js` |
| Regex `\s*` para saltos de línea | No matchea `\n\n` | Usar `[\s\n]*` |

## 🔧 REFERENCIA RÁPIDA

```javascript
// Backticks seguros
const BT3 = String.fromCharCode(96, 96, 96);
const BT4 = String.fromCharCode(96, 96, 96, 96);

// Acceso a constantes
ChatbotRoamPatterns.BT3
ChatbotRoamPatterns.BT4
```
