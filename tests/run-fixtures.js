// Pruebas de regresion con ejemplos reales de exportaciones
// Pasa cada ejemplo de test-data/fixtures/ por el bundle y compara el arbol de bloques
// resultante con tests/expected/<nombre>.txt
//
// Uso:
//   node tests/run-fixtures.js            compara y muestra diferencias
//   node tests/run-fixtures.js --update   reescribe las salidas esperadas
//
// Un ejemplo es un archivo .md (se importa solo) o una carpeta (sus .md se importan juntos).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(ROOT, 'chatbot-roam-plugin.js');
const FIXTURES_DIR = path.join(ROOT, 'test-data', 'fixtures');
const EXPECTED_DIR = path.join(__dirname, 'expected');
const UPDATE = process.argv.includes('--update');

function loadPlugin() {
    let uidCounter = 0;
    const context = vm.createContext({
        window: {
            roamAlphaAPI: {
                util: { generateUID: () => 'uid' + (++uidCounter) },
                ui: { commandPalette: { addCommand() { }, removeCommand() { } } }
            }
        },
        console: { log() { }, info() { }, warn() { }, error: console.error },
        performance: { now: () => Date.now() },
        setTimeout: setTimeout
    });
    const code = fs.readFileSync(BUNDLE, 'utf8') +
        '\n;({ Processing: ChatbotRoamProcessing, Opciones: ChatbotRoamOpciones, Parser: ChatbotRoamParser, UI: ChatbotRoamUI })';
    return vm.runInContext(code, context, { filename: 'chatbot-roam-plugin.js' });
}

function readFixtures() {
    return fs.readdirSync(FIXTURES_DIR).sort().map(entry => {
        const full = path.join(FIXTURES_DIR, entry);
        if (fs.statSync(full).isDirectory()) {
            const files = fs.readdirSync(full).filter(f => f.endsWith('.md')).sort()
                .map(f => ({ name: f, content: fs.readFileSync(path.join(full, f), 'utf8') }));
            return { name: entry, files: files };
        }
        return { name: entry.replace(/\.md$/, ''), files: [{ name: entry, content: fs.readFileSync(full, 'utf8') }] };
    });
}

// Reproduce el flujo del modal: une los archivos, detecta el formato, aplica el preset,
// procesa y arma el arbol que se insertaria en Roam
async function runPipeline(plugin, files) {
    if (typeof plugin.Processing.procesarArchivos === 'function') {
        const r = await plugin.Processing.procesarArchivos(files);
        return { header: r.resumen, resultado: r.resultado };
    }
    const content = files.map(f => ':::FILE_BOUNDARY:' + f.name + ':::\n' + f.content).join('\n\n');
    const tipo = plugin.Processing.detectarTipoChatbot(content);
    const opciones = plugin.Opciones.getPreset(tipo);
    const r = await plugin.Processing.procesarConOpcionesIndividuales(content, opciones);
    return { header: 'tipo: ' + tipo, resultado: r.resultado };
}

function buildTree(plugin, resultado) {
    const rawBloques = plugin.Parser.parseToBlockStructure(resultado.split('\n'));
    // Agrupar bajo el bloque de cada archivo, como hace el modal al insertar
    const bloques = [];
    let currentFileBlock = null;
    for (const bloque of rawBloques) {
        if (bloque.text && bloque.text.startsWith('📁 ')) {
            currentFileBlock = { text: '**' + bloque.text + '**', children: [] };
            bloques.push(currentFileBlock);
        } else if (currentFileBlock) {
            currentFileBlock.children.push(bloque);
        } else {
            bloques.push(bloque);
        }
    }
    return bloques;
}

function renderTree(bloques, depth, lines) {
    for (const b of bloques) {
        const texto = b.text.replace(/\n/g, '\\n');
        lines.push('  '.repeat(depth) + '- ' + texto);
        renderTree(b.children || [], depth + 1, lines);
    }
    return lines;
}

async function renderFixture(plugin, fixture) {
    const { header, resultado } = await runPipeline(plugin, fixture.files);
    if (!resultado) return header + '\n(sin resultado)\n';
    const tree = buildTree(plugin, resultado);
    return header + '\n' + renderTree(tree, 0, []).join('\n') + '\n';
}

function firstDifference(expected, actual) {
    const a = expected.split('\n');
    const b = actual.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) {
            return '    linea ' + (i + 1) + '\n    esperado: ' + (a[i] === undefined ? '(fin)' : a[i]) +
                '\n    obtenido: ' + (b[i] === undefined ? '(fin)' : b[i]);
        }
    }
    return '';
}

async function main() {
    const plugin = loadPlugin();
    if (!fs.existsSync(EXPECTED_DIR)) fs.mkdirSync(EXPECTED_DIR);
    let failures = 0;

    for (const fixture of readFixtures()) {
        const actual = await renderFixture(plugin, fixture);
        const expectedPath = path.join(EXPECTED_DIR, fixture.name + '.txt');

        if (UPDATE) {
            fs.writeFileSync(expectedPath, actual, 'utf8');
            console.log('actualizado  ' + fixture.name);
            continue;
        }
        if (!fs.existsSync(expectedPath)) {
            failures++;
            console.log('SIN ESPERADO ' + fixture.name + ' (correr con --update)');
            continue;
        }
        const expected = fs.readFileSync(expectedPath, 'utf8');
        if (expected === actual) {
            console.log('ok           ' + fixture.name);
        } else {
            failures++;
            console.log('DIFERENTE    ' + fixture.name + '\n' + firstDifference(expected, actual));
        }
    }

    if (!UPDATE) {
        console.log(failures === 0 ? '\nTodos los ejemplos coinciden.' : '\n' + failures + ' ejemplo(s) con diferencias.');
        process.exitCode = failures === 0 ? 0 : 1;
    }
}

main().catch(err => { console.error(err); process.exitCode = 1; });
