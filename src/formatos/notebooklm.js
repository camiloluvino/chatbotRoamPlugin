// ============================================================================
// CHATBOT ROAM PLUGIN - FORMATO NOTEBOOKLM
// Exportaciones de NotebookLM: cabecera YAML con "source: NotebookLM" y turnos
// "### 🧑 **User**" / "### 🤖 **NotebookLM**" (versiones anteriores en chino
// 用户 / 助手, o en español)
// ============================================================================

const ChatbotRoamFormatoNotebookLM = {
    id: 'notebooklm',
    nombre: 'NotebookLM',

    MARCADOR_PROMPT: /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?(?:User|Usuario|用户|Prompt)(?:\*\*)?\s*$/gmi,
    MARCADOR_RESPUESTA: /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?(?:NotebookLM|Assistant|Asistente|助手|Response)(?:\*\*)?\s*$/gmi,

    detectar(contenido) {
        if (!contenido) return false;
        if (/source:\s*NotebookLM/i.test(contenido)) return true;
        const conPrompt = new RegExp(this.MARCADOR_PROMPT.source, 'mi').test(contenido);
        const conRespuesta = new RegExp(this.MARCADOR_RESPUESTA.source, 'mi').test(contenido);
        if (conPrompt && conRespuesta) return true;
        return /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?NotebookLM(?:\*\*)?\s*$/mi.test(contenido);
    },

    opciones: [
        {
            id: 'separar_headers_colisionados_notebooklm',
            label: 'Separar títulos colisionados',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoNotebookLM.separarHeadersColisionados(texto); }
        },
        {
            id: 'normalizar_vinetas_notebooklm',
            label: 'Normalizar viñetas (•, ◦)',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoNotebookLM.normalizarVinetas(texto); }
        },
        {
            id: 'eliminar_fuentes_notebooklm',
            label: 'Eliminar fuentes/sources (NotebookLM)',
            defaultActivo: true,
            aplicarA: 'respuesta',
            cleaner: function (texto) { return ChatbotRoamFormatoNotebookLM.eliminarFuentes(texto); }
        }
    ],

    /**
     * Limpieza que siempre se aplica al archivo completo, antes de separar los turnos
     */
    limpiezaArchivo(contenido) {
        return this.eliminarFechasDeSesion(contenido);
    },

    /**
     * Elimina los encabezados que separan las sesiones del chat, como
     * "## 📅 Monday, August 31" o "## 🕒 Today • 3:06 PM". Solo considera fecha un
     * encabezado "##" que empieza con un emoji de calendario o reloj, o con un día
     * de la semana, "Today" u "Hoy"; nunca por palabras que aparezcan más adelante.
     */
    eliminarFechasDeSesion(contenido) {
        const emoji = /^##\s+(?:\u{1F4C5}|\u{1F4C6}|\u{1F552}|\u{1F55B}|\u{1F550}|\u{23F0}|\uFFFD)/u;
        const dia = /^##\s+(?:\S+\s+)?(?:Today|Yesterday|Hoy|Ayer|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado|Domingo)\b/i;
        return contenido.split('\n').filter(linea => {
            const l = linea.trim();
            return !(emoji.test(l) || dia.test(l));
        }).join('\n');
    },

    /**
     * Limpieza que siempre se aplica a las respuestas, al final del proceso
     */
    limpiezaFinalRespuesta(texto) {
        return this.limpiarEscapes(texto);
    },

    /**
     * Limpia escapes innecesarios, como "1\." que debería ser "1.",
     * y elimina el prefijo "Thoughts" aislado al inicio de respuestas.
     */
    limpiarEscapes(texto) {
        // Eliminar línea aislada "Thoughts" al inicio de respuesta
        texto = texto.replace(/^Thoughts\s*\n+/i, '');
        // Reemplazar "numero\." por "numero."
        texto = texto.replace(/(\d+)\\\./g, '$1.');
        // Reemplazar "\-" por "-" (por si acaso)
        texto = texto.replace(/\\-/g, '-');
        return texto;
    },

    /**
     * Elimina el bloque de fuentes citado al final de la respuesta.
     * Ejemplo:
     * > **Sources:**
     * > [1] archivo.pdf
     */
    eliminarFuentes(texto) {
        return texto.replace(/> \*\*(?:来源[:：]|Sources[:：]|Fuentes[:：])\*\*(?:\r?\n> \[\d+\].*)*/gi, '');
    },

    /**
     * Separa el texto colisionado tras un cierre de negritas
     * Asegura que el patrón **Texto**Descripción se convierta en **Texto**\nDescripción.
     * Distingue apertura de cierre contando los ** de cada línea, para no romper
     * negritas que se abren tras un paréntesis o comillas, como (**Texto**).
     */
    separarHeadersColisionados(texto) {
        return texto.split('\n').map(linea => {
            let salida = '';
            let abierta = false;
            let i = 0;
            while (i < linea.length) {
                if (linea.startsWith('**', i)) {
                    salida += '**';
                    i += 2;
                    if (abierta && /[A-ZÁÉÍÓÚÑ¿¡]/.test(linea.charAt(i))) salida += '\n';
                    abierta = !abierta;
                    continue;
                }
                salida += linea.charAt(i);
                i++;
            }
            return salida;
        }).join('\n');
    },

    /**
     * Normaliza las viñetas (•, ◦) para asegurar saltos de línea y formato correcto.
     */
    normalizarVinetas(texto) {
        // 1. Reemplazar viñeta sólida "• " por salto + guión "- "
        // Se usa \n- para garantizar que quede en su propia línea
        texto = texto.replace(/• /g, '\n- ');

        // 2. Reemplazar viñeta hueca "◦ " por salto + indentación + guión
        // Se asume nivel 1 de indentación (4 espacios)
        texto = texto.replace(/◦ /g, '\n    - ');

        // Limpieza de posibles saltos dobles introducidos si ya había saltos
        texto = texto.replace(/\n\n- /g, '\n- ');
        texto = texto.replace(/\n\n    - /g, '\n    - ');

        return texto;
    }
};
