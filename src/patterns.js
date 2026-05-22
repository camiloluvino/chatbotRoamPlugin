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
    VERSION: "1.4.7",

    // IMAGENES BASE64
    IMAGEN_COMPLETA: /!\[[^\]]*\]\(data:image\/[^)]*\)/g,
    IMAGEN_TRUNCADA: /!\[[^\]]*\]\(data:image\/[^\n)]*(?=\n|$)/g,

    // FORMATO MARKDOWN
    LINEAS_VACIAS_EXCESIVAS: /\n{3,}/g,
    CODIGO_CUATRO_BACKTICKS: new RegExp(BT4 + "(\\w+)", "g"),
    CODIGO_TRES_BACKTICKS: new RegExp(BT3 + "(\\w+)", "g"),

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

    // THOUGHT PROCESSES
    // Claude - bloques plaintext
    PLAINTEXT_BLOCKS_CLAUDE: new RegExp(BT4 + "plaintext[\\s\\S]*?" + BT4, "g"),

    // ChatGPT - Thought process generico
    THOUGHT_PROCESS_GENERICO: new RegExp(BT4 + "plaintext\\s*Thought process:[\\s\\S]*?" + BT4, "g"),

    // TOOL CALLS (CLAUDE)
    TOOL_CALLS_COMPLETO: new RegExp("\\*\\*\\w+\\*\\*\\s*\\*Request\\*\\s*" + BT4 + "(?:javascript|json)[\\s\\S]*?" + BT4 + "\\s*\\*Response\\*\\s*" + BT4 + "(?:plaintext|text)[\\s\\S]*?" + BT4, "g"),
    TOOL_CALLS_SIMPLE: /\*\*\w+\*\*\s*(?=\*Request\*|$)/g,

    // MCP Tool calls (Claude con MCP)
    MCP_TOOL_CALLS: new RegExp("\\*\\*[\\w-]+:[\\w_]+\\*\\*[\\s\\n]*\\*Request\\*[\\s\\n]*" + BT4 + "(?:javascript|json|plaintext)[\\s\\S]*?" + BT4 + "[\\s\\n]*\\*Response\\*[\\s\\n]*" + BT4 + "(?:javascript|json|plaintext|text)[\\s\\S]*?" + BT4, "g"),

    // MCP Tool Header (para detectar bloques mal clasificados)
    MCP_TOOL_HEADER: /\*\*[\w-]+:[\w_]+\*\*/,

    // ANTIGRAVITY FORMAT
    ANTIGRAVITY_PROMPT_MARKER: /^### User Input$/gm,
    ANTIGRAVITY_RESPONSE_MARKER: /^### Planner Response$/gm,
    ANTIGRAVITY_ACTIONS: /^\*(?:Listed directory|Viewed|Searched filesystem|Searched|Edited relevant file|Edited|Grep searched|Checked command status|Checked command|User accepted the command|User accepted)[^\n]*$/gm,
    ANTIGRAVITY_HEADER: /^# Chat Conversation\s*\n+Note: _This is purely[^_]*_\s*\n*/gm,
    ANTIGRAVITY_SYSTEM_MESSAGE: /^This is a system-generated message[^\n]*$/gm,
    CCI_LINKS: /\(cci:\d+:\/\/file:\/\/\/[^)]+\)/g,
    TIMESTAMP_HORA_SUELTA: /^\d{1,2}:\d{2}\s+[ap]\.m\.$/,

    // NOTEBOOKLM FORMAT - Using runtime-generated constants
    NOTEBOOKLM_PROMPT_MARKER: null,    // Initialized below
    NOTEBOOKLM_RESPONSE_MARKER: null,  // Initialized below
    NOTEBOOKLM_PROMPT_STR: null,       // For string matching
    NOTEBOOKLM_RESPONSE_STR: null,     // For string matching

    // DETECCION DE TIPO DE CHATBOT
    DETECT_ANTIGRAVITY: /^### (?:User Input|Planner Response)$/m,
    DETECT_CLAUDE_TOOLS: /\*\*\w+\*\*\s*\*Request\*/,
    DETECT_GEMINI_THINKING: /^>\s*Thinking:/m,

    // Helper getters for backtick strings
    get BT3() { return BT3; },
    get BT4() { return BT4; },

    // Helper for NotebookLM detection
    isNotebookLM(content) {
        return content.includes(this.NOTEBOOKLM_PROMPT_STR) ||
            content.includes(this.NOTEBOOKLM_RESPONSE_STR);
    }
};

// Initialize NotebookLM patterns after object creation (using runtime-generated strings)
ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR = '### ' + NOTEBOOKLM_PERSON + ' **' + NOTEBOOKLM_USER + '**';
ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_STR = '### ' + NOTEBOOKLM_ROBOT + ' **' + NOTEBOOKLM_ASSISTANT + '**';
ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_MARKER = new RegExp('^' + ChatbotRoamPatterns.NOTEBOOKLM_PROMPT_STR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'gm');
ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_MARKER = new RegExp('^' + ChatbotRoamPatterns.NOTEBOOKLM_RESPONSE_STR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'gm');
