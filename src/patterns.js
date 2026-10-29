// CHATBOT ROAM PLUGIN - PATTERNS
// Regex patterns ported from Python chatbotRoam/patterns.py
// NOTE: Using RegExp constructor to avoid backtick issues in Roam

// Helper: backtick constants (char code 96)
const BT3 = String.fromCharCode(96, 96, 96);
const BT4 = String.fromCharCode(96, 96, 96, 96);

// Helper: NotebookLM markers (generated at runtime to avoid encoding issues)
// Person emoji: U+1F9D1, Robot emoji: U+1F916
// Chinese: 用户 (user) = U+7528 U+6237, 助手 (assistant) = U+52A9 U+624B
const NOTEBOOKLM_PERSON = String.fromCodePoint(0x1F9D1);
const NOTEBOOKLM_ROBOT = String.fromCodePoint(0x1F916);
const NOTEBOOKLM_USER = String.fromCharCode(0x7528, 0x6237);
const NOTEBOOKLM_ASSISTANT = String.fromCharCode(0x52A9, 0x624B);

const ChatbotRoamPatterns = {
    // Version info
    VERSION: "1.5.5",

    // IMAGENES BASE64
    IMAGEN_COMPLETA: /!\[[^\]]*\]\(data:image\/[^)]*\)/g,
    IMAGEN_TRUNCADA: /!\[[^\]]*\]\(data:image\/[^\n)]*(?=\n|$)/g,

    // FORMATO MARKDOWN
    LINEAS_VACIAS_EXCESIVAS: /\n{3,}/g,
    CODIGO_CUATRO_BACKTICKS: new RegExp(BT4 + "[^\\n\\r\\x60]+", "g"),
    CODIGO_TRES_BACKTICKS: new RegExp(BT3 + "[^\\n\\r\\x60]+", "g"),

    // TIMESTAMPS
    TIMESTAMP_COMPLETO: /^\d{1,2}\/\d{1,2}\/\d{4},\s+\d{1,2}:\d{2}:\d{2}\s+[ap]\.m\.$/,
    TIMESTAMP_FECHA: /^\d{1,2}\/\d{1,2}\/\d{4}/,
    // Timestamp en formato blockquote (nuevo formato Claude): > 5/20/2026 22:35:00
    TIMESTAMP_BLOCKQUOTE: /^>\s*\d{1,2}\/\d{1,2}\/\d{4},?\s+\d{1,2}:\d{2}(:\d{2})?/,

    // MARCADORES DE CONVERSACION
    // Formato clásico: ## Prompt: / ## Response:
    PROMPT_MARKER: /^## Prompt:/gm,
    RESPONSE_MARKER: /^## Response:/gm,
    // Formato Claude V2 (actualización del exportador): ## User: / ## Assistant:
    PROMPT_MARKER_V2: /^## User:/gm,
    RESPONSE_MARKER_V2: /^## Assistant:/gm,
    // Formato Gemini Exporter: ## User: / ## Gemini:
    RESPONSE_MARKER_GEMINI: /^## Gemini:/gm,

    // NOTEBOOKLM FORMAT
    NOTEBOOKLM_PROMPT_MARKER: /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?(?:User|Usuario|\u7528\u6237|Prompt)(?:\*\*)?\s*$/gmi,
    NOTEBOOKLM_RESPONSE_MARKER: /^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?(?:NotebookLM|Assistant|Asistente|\u52A9\u624B|Response)(?:\*\*)?\s*$/gmi,
    NOTEBOOKLM_PROMPT_STR: null,       // For backwards compatibility string matching
    NOTEBOOKLM_RESPONSE_STR: null,     // For backwards compatibility string matching

    // DETECCION DE TIPO DE CHATBOT
    DETECT_GEMINI_THINKING: /^>\s*(?:\*\*Thinking steps\*\*|Thinking:)/m,

    // Helper getters for backtick strings
    get BT3() { return BT3; },
    get BT4() { return BT4; },

    // Helper for NotebookLM detection
    isNotebookLM(content) {
        if (!content) return false;
        if (/source:\s*NotebookLM/i.test(content)) return true;
        if (this.NOTEBOOKLM_PROMPT_MARKER &&
            new RegExp(this.NOTEBOOKLM_PROMPT_MARKER.source, 'mi').test(content) &&
            this.NOTEBOOKLM_RESPONSE_MARKER &&
            new RegExp(this.NOTEBOOKLM_RESPONSE_MARKER.source, 'mi').test(content)) {
            return true;
        }
        if (/^###\s+(?:[^\s*#]+\s+)?(?:\*\*)?NotebookLM(?:\*\*)?\s*$/mi.test(content)) {
            return true;
        }
        return (this.NOTEBOOKLM_PROMPT_STR && content.includes(this.NOTEBOOKLM_PROMPT_STR)) ||
            (this.NOTEBOOKLM_RESPONSE_STR && content.includes(this.NOTEBOOKLM_RESPONSE_STR));
    }
};

// Initialize NotebookLM legacy string patterns after object creation
ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR = '### ' + NOTEBOOKLM_PERSON + ' **' + NOTEBOOKLM_USER + '**';
ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_STR = '### ' + NOTEBOOKLM_ROBOT + ' **' + NOTEBOOKLM_ASSISTANT + '**';
