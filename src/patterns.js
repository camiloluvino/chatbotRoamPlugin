// CHATBOT ROAM PLUGIN - PATTERNS
// Regex patterns ported from Python chatbotRoam/patterns.py
// NOTE: Using RegExp constructor to avoid backtick issues in Roam

// Helper: backtick constants (char code 96)
const BT3 = String.fromCharCode(96, 96, 96);
const BT4 = String.fromCharCode(96, 96, 96, 96);

const ChatbotRoamPatterns = {
    // Version info
    VERSION: "1.0.0",

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

    // MARCADORES DE CONVERSACION
    PROMPT_MARKER: /^## Prompt:/gm,
    RESPONSE_MARKER: /^## Response:/gm,

    // THOUGHT PROCESSES
    // Claude - bloques plaintext
    PLAINTEXT_BLOCKS_CLAUDE: new RegExp(BT4 + "plaintext[\\s\\S]*?" + BT4, "g"),

    // ChatGPT - Thought process generico
    THOUGHT_PROCESS_GENERICO: new RegExp(BT4 + "plaintext\\s*Thought process:[\\s\\S]*?" + BT4, "g"),

    // TOOL CALLS (CLAUDE)
    TOOL_CALLS_COMPLETO: new RegExp("\\*\\*\\w+\\*\\*\\s*\\*Request\\*\\s*" + BT4 + "(?:javascript|json)[\\s\\S]*?" + BT4 + "\\s*\\*Response\\*\\s*" + BT4 + "(?:plaintext|text)[\\s\\S]*?" + BT4, "g"),
    TOOL_CALLS_SIMPLE: /\*\*\w+\*\*\s*(?=\*Request\*|$)/g,

    // MCP Tool calls (Claude con MCP)
    MCP_TOOL_CALLS: new RegExp("\\*\\*[\\w-]+:[\\w_]+\\*\\*\\s*\\*Request\\*\\s*" + BT4 + "(?:javascript|json|plaintext)[\\s\\S]*?" + BT4 + "\\s*\\*Response\\*\\s*" + BT4 + "(?:javascript|json|plaintext|text)[\\s\\S]*?" + BT4, "g"),

    // DETECCION DE TIPO DE CHATBOT
    DETECT_CLAUDE_TOOLS: /\*\*\w+\*\*\s*\*Request\*/,
    DETECT_GEMINI_THINKING: /^>\s*Thinking:/m,

    // Helper getters for backtick strings
    get BT3() { return BT3; },
    get BT4() { return BT4; }
};
