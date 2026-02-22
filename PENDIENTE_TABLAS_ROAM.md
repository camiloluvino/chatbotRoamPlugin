# TAREA PENDIENTE: Conversión de Tablas Markdown → Roam

## Objetivo
Convertir tablas en formato Markdown (`| col | col |`) al formato nativo de tablas Roam (`{{[[table]]}}` con bloques anidados).

## El problema original
Cuando Claude/ChatGPT/Gemini generan tablas en sus respuestas, usan formato Markdown estándar:
```
| Nodo | Tipo | Estado |
|------|------|--------|
| CLM  | Alto | Activo |
```

Pero Roam NO renderiza tablas Markdown. Roam necesita una estructura de bloques anidados:
```
{{[[table]]}}
    Nodo         ← fila 1, columna 1
        Tipo     ← fila 1, columna 2
            Estado   ← fila 1, columna 3
    CLM          ← fila 2, columna 1
        Alto     ← fila 2, columna 2
            Activo   ← fila 2, columna 3
```

