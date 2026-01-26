# Problema: Conversión de Tablas Markdown a Roam - Documentación Completa

> [!NOTE]
> **RESUELTO** (2026-01-18) - El fix está en `parser.js` v1.3.2
> 
> **Causa raíz**: `parser.js` solo manejaba 4 y 8 espacios de indentación, descartando líneas con 12+ espacios silenciosamente.
> 
> **Solución**: Nueva función `_parseIndentedBlocks()` que construye jerarquía basada en indentación arbitraria para tablas Roam.

## Contexto del Proyecto

**Plugin:** chatbotRoamPlugin  
**Ubicación:** `c:\Users\redk8\OneDrive\Documentos\proyectosVibeCoding\proyectosRoamEnhance\chatbotRoamPlugin`  
**Propósito:** Procesar exports de conversaciones de chatbots (Claude, ChatGPT, Gemini, Antigravity) y formatearlos para importar a Roam Research.

## El Problema

Cuando una respuesta de chatbot contiene una tabla en formato Markdown, el plugin la convierte incorrectamente a bullets planos en lugar de generar una tabla nativa de Roam.

### Input (tabla Markdown en respuesta de chatbot):

```markdown
| Nodo | Tipo | Grado de desarrollo |
|------|------|---------------------|
| CLM - "problema de la comunidad" | Desarrollado | Alto |
| CLM - línea de erosión | Desarrollado | Alto - 5 EVD |
```

### Output Actual (INCORRECTO):

```
- {{[[table]]}}
- - Nodo
- - Tipo
- - Grado de desarrollo
- - CLM - "problema de la comunidad"
- - Desarrollado
- - Alto
```

Cada línea se convierte en un bullet separado, perdiendo la estructura jerárquica.

### Output Esperado (CORRECTO para Roam):

```
{{[[table]]}}
    - Nodo
        - Tipo
            - Grado de desarrollo
    - CLM - "problema de la comunidad"
        - Desarrollado
            - Alto
    - CLM - línea de erosión
        - Desarrollado
            - Alto - 5 EVD
```

En Roam, las tablas usan `{{[[table]]}}` y cada columna se anida un nivel más profundo (4 espacios por nivel).

---

## Arquitectura del Plugin

### Flujo de Procesamiento

```
1. Input: archivo .md exportado de chatbot
   ↓
2. processing.js → extraerConversacionRaw()
   Extrae pares prompt/respuesta
   ↓
3. processing.js → _limpiarRespuesta()
   Aplica cleaners de opciones-limpieza.js
   ↓
4. formatter.js → formatResponseLines()
   Formatea cada línea para estructura Roam
   ↓
5. roam/parser.js → parseToBlockStructure()
   Convierte líneas en estructura jerárquica de bloques
   ↓
6. Output: texto formateado listo para Roam
```

### Archivos Relevantes

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/cleaners.js` | Funciones de limpieza (eliminar metadata, tool calls, etc.) |
| `src/opciones-limpieza.js` | Registro de opciones toggleables |
| `src/formatter.js` | Formatea texto para estructura de bloques Roam |
| `src/processing.js` | Orquesta el pipeline completo |
| `src/roam/parser.js` | Convierte líneas en estructura jerárquica |

---

## Lo Que Intentamos

### Intento 1: Agregar conversión de tablas en cleaners.js

**Ubicación:** `src/cleaners.js`, función `convertirTablasMarkdownARoam()`

**Lógica implementada:**
```javascript
convertirTablasMarkdownARoam(texto) {
    // 1. Detectar tabla Markdown: línea que empieza/termina con |
    // 2. Verificar que siguiente línea sea separador |---|---|
    // 3. Recolectar todas las filas de la tabla
    // 4. Generar estructura Roam:
    //    {{[[table]]}}
    //        - Header1
    //            - Header2
    //                - Header3
    //        - Row1Col1
    //            - Row1Col2
    //                - Row1Col3
}
```

**Resultado:** La conversión de tabla funcionó correctamente en aislamiento (verificado con tests de Node.js), PERO...

### El Problema Real: formatter.js destruye la estructura

Después de que `cleaners.js` genera la tabla Roam correctamente:

```
{{[[table]]}}
    - Nodo
        - Tipo
            - Grado
```

El `formatter.js` lo procesa línea por línea en `formatResponseLines()` y:
- Detecta `{{[[table]]}}` como "texto normal" → le agrega `* ` al frente
- Detecta `    - Nodo` como lista → pero pierde la indentación original
- El resultado son bullets planos sin jerarquía

### Intento 2: Modificar formatter.js para preservar tablas Roam

**Cambios realizados:**
```javascript
formatResponseLines(responseLimpio) {
    // ...
    var enTablaRoam = false;
    
    for (var j = 0; j < lineasResponse.length; j++) {
        // NUEVO: Detectar inicio de tabla Roam
        if (lineaStripped === '{{[[table]]}}') {
            enTablaRoam = true;
            resultado.push(indentTabla + lineaStripped); // Sin bullet
            continue;
        }
        
        // NUEVO: Preservar estructura de tabla
        if (enTablaRoam) {
            if (!lineaStripped) {
                enTablaRoam = false; // Fin de tabla
            } else if (linea.match(/^\s+- /)) {
                resultado.push(indentTabla + linea); // Preservar indentación
                continue;
            }
        }
        // ... resto del procesamiento normal
    }
}
```

**Resultado en tests de Node.js:** ✅ Funcionó correctamente

**Resultado en Roam:** ❌ No funcionó (según el usuario)

---

## Diagnóstico Pendiente

El test en Node.js muestra output correcto:
```
        {{[[table]]}}
            - Nodo
                - Tipo
                    - Grado
            - CLM - problema
                - Desarrollado
                    - Alto
```

Pero en Roam no funciona. Posibles causas:

1. **El build no se aplicó correctamente** - El archivo `chatbot-roam-plugin.js` puede no reflejar los cambios
2. **Hay otro punto del pipeline que modifica el output** - Quizás `roam/parser.js` o `roam/inserter.js`
3. **El problema está en cómo Roam interpreta el texto** - Quizás necesita formato diferente

---

## Formato de Tablas en Roam (Referencia)

Según `Roam_Markdown_Cheatsheet.md`:

```
{{[[table]]}}
    - Header 1
        - Header 2
            - Header 3
    - Row 1 Label
        - Cell 1.1
            - Cell 1.2
    - Row 2 Label
        - Cell 2.1
            - Cell 2.2
```

**Reglas:**
- Cada columna se anida UN NIVEL MÁS PROFUNDO que la anterior
- Usar 4 espacios por nivel de indentación
- Máximo recomendado: 5 columnas
- `{{[[table]]}}` es el marcador de tabla

---

## Archivos de Test Creados (Para Referencia)

### test-pipeline.js
Simula el pipeline completo (cleaners → formatter) y compara output original vs corregido.

### test-final.js
Valida que:
- `{{[[table]]}}` no tenga bullet al frente
- Cada línea de tabla preserve su indentación
- El texto antes/después de tablas se procese normalmente

---

## Opciones Para Continuar

1. **Verificar que el build se aplicó:** Revisar `chatbot-roam-plugin.js` líneas ~2985-3050 para confirmar que tiene la lógica de `enTablaRoam`

2. **Revisar roam/parser.js:** Este archivo convierte las líneas formateadas en estructura de bloques. Puede estar modificando la estructura de la tabla.

3. **Revisar roam/inserter.js:** Este archivo inserta los bloques en Roam. Puede haber lógica que afecte las tablas.

4. **Probar output directo:** Generar el output del plugin, copiarlo manualmente, y pegarlo en Roam para ver si el formato es correcto.

5. **Debug con console.log:** Agregar logs en puntos clave del pipeline para ver qué texto pasa por cada etapa.

---

## Código Actual Relevante

### cleaners.js - convertirTablasMarkdownARoam (líneas ~397-502)

```javascript
convertirTablasMarkdownARoam(texto) {
    const lineas = texto.split('\n');
    const resultado = [];
    let i = 0;

    while (i < lineas.length) {
        const linea = lineas[i];
        const lineaStripped = linea.trim();

        if (this._esLineaTablaMarkdown(lineaStripped)) {
            const siguienteLinea = i + 1 < lineas.length ? lineas[i + 1].trim() : '';
            
            if (this._esSeparadorTabla(siguienteLinea)) {
                const tablaLineas = [];
                tablaLineas.push(lineaStripped);
                let j = i + 2;
                while (j < lineas.length && this._esLineaTablaMarkdown(lineas[j].trim())) {
                    tablaLineas.push(lineas[j].trim());
                    j++;
                }
                const tablaRoam = this._convertirTablaARoam(tablaLineas);
                resultado.push(...tablaRoam);
                i = j;
                continue;
            }
        }
        resultado.push(linea);
        i++;
    }
    return resultado.join('\n');
}
```

### formatter.js - formatResponseLines (líneas ~18-120)

```javascript
formatResponseLines(responseLimpio) {
    // ... setup ...
    var enTablaRoam = false;

    for (var j = 0; j < lineasResponse.length; j++) {
        var linea = lineasResponse[j];
        var lineaStripped = linea.trim();

        // Detectar tabla Roam
        if (lineaStripped === '{{[[table]]}}') {
            enTablaRoam = true;
            var indentTabla = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
            resultado.push(indentTabla + lineaStripped);
            continue;
        }

        if (enTablaRoam) {
            if (!lineaStripped) {
                enTablaRoam = false;
                resultado.push('');
                continue;
            }
            if (linea.match(/^\s+- /)) {
                var indentTabla = bajoHeading ? this.INDENT_HEADING : this.INDENT_BASE;
                resultado.push(indentTabla + linea);
                continue;
            } else {
                enTablaRoam = false;
            }
        }
        // ... resto del procesamiento ...
    }
}
```

### opciones-limpieza.js - Opción de conversión (líneas ~160-168)

```javascript
{
    id: 'convertir_tablas_roam',
    label: 'Convertir tablas a Roam',
    chatbots: ['claude', 'chatgpt', 'gemini', 'antigravity'],
    defaultActivo: true,
    aplicarA: 'respuesta',
    cleaner: function (texto) { return ChatbotRoamCleaners.convertirTablasMarkdownARoam(texto); }
}
```

---

## Ejemplo de Input/Output Real

### Input (archivo ejemploProblemaTabla_input.md, extracto):

```markdown
### HORIZONTE A: Cohesión Social / Solidaridad Informal / Lazo Social

**Estado del material en grafo teson (núcleo):**

| Nodo | Tipo | Grado de desarrollo |
|------|------|---------------------|
| CLM - "problema de la comunidad" | Desarrollado | Alto - tiene sub-CLMs |
| CLM - línea de erosión | Desarrollado | Alto - 5 EVD |
```

### Output Esperado:

```
- ok, perfecto, parte con la fase 1
    - ### HORIZONTE A: Cohesión Social / Solidaridad Informal / Lazo Social
        - * **Estado del material en grafo teson (núcleo):**
        - {{[[table]]}}
            - Nodo
                - Tipo
                    - Grado de desarrollo
            - CLM - "problema de la comunidad"
                - Desarrollado
                    - Alto - tiene sub-CLMs
            - CLM - línea de erosión
                - Desarrollado
                    - Alto - 5 EVD
```

### Output Actual (según reporte del usuario):

```
- {{[[table]]}}
- - Nodo
- - Tipo
- - Grado de desarrollo
- - CLM - "problema de la comunidad"
- - Desarrollado
- - Alto
```

Todas las líneas se convierten en bullets planos al mismo nivel.
