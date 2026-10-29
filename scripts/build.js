// Build script for Chatbot Roam Plugin
// Concatena los modulos de src/ en un solo bundle (chatbot-roam-plugin.js)
// Uso: node scripts/build.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const OUTPUT_FILE = path.join(ROOT, 'chatbot-roam-plugin.js');

// Archivos fuente en orden de dependencias
const SOURCE_FILES = [
    'patterns.js',
    'cleaners.js',
    'opciones-limpieza.js',
    'formatter.js',
    'processing.js',
    'styles.js',
    'roam/parser.js',
    'roam/inserter.js',
    'ui.js',
    'index.js'
];

function readVersion() {
    const index = fs.readFileSync(path.join(SRC_DIR, 'index.js'), 'utf8');
    const match = index.match(/VERSION:\s*"([^"]+)"/);
    if (!match) throw new Error('No se encontro VERSION en src/index.js');
    return match[1];
}

function timestamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function build() {
    const version = readVersion();
    let out = '// CHATBOT ROAM PLUGIN v' + version + '\n' +
        '// Importador de conversaciones de chatbots (Claude, Gemini, NotebookLM) a Roam\n' +
        '// Uso: Ctrl+Shift+I o Command Palette\n' +
        '// Generated: ' + timestamp() + '\n\n';

    for (const file of SOURCE_FILES) {
        const filePath = path.join(SRC_DIR, file);
        if (!fs.existsSync(filePath)) throw new Error('Missing file: ' + file);
        out += '\n// --- ' + file + ' ---\n' + fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n') + '\n';
    }

    // Roam rompe los scripts que contienen backticks literales
    const backticks = (out.match(/\x60/g) || []).length;
    if (backticks > 0) throw new Error('El bundle contiene ' + backticks + ' backtick(s); usar String.fromCharCode(96)');

    fs.writeFileSync(OUTPUT_FILE, out, 'utf8');
    console.log('Build v' + version + ' -> ' + path.relative(ROOT, OUTPUT_FILE) +
        ' (' + (out.length / 1024).toFixed(1) + ' KB, ' + out.split('\n').length + ' lineas)');
}

build();
