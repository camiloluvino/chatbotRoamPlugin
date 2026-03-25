const str = `* 📁 chat1.md
* Prompt
    * Response
* 📁 chat2.md
* Prompt 2
    * Response 2`;

const ChatbotRoamParser = {
    parseToBlockStructure(lineas) {
        var result = [];
        var currentPrompt = null;
        var currentHeading = null;
        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (!linea || !linea.trim()) continue;
            if (linea.startsWith('* ')) {
                if (currentPrompt) result.push(currentPrompt);
                currentPrompt = { text: linea.substring(2).trim(), children: [] };
                currentHeading = null;
                continue;
            }
            if (linea.startsWith('    ') && currentPrompt) {
                var texto = linea.substring(4);
                var textoLimpio = texto.startsWith('* ') ? texto.substring(2) : texto;
                if (textoLimpio.trim()) {
                    var nuevoBloque = { text: textoLimpio.trim(), children: [] };
                    currentPrompt.children.push(nuevoBloque);
                }
            }
        }
        if (currentPrompt) result.push(currentPrompt);
        return result;
    }
};

let rawBloques = ChatbotRoamParser.parseToBlockStructure(str.split('\n'));
let bloques = [];
let currentFileBlock = null;

for (let i = 0; i < rawBloques.length; i++) {
    let bloque = rawBloques[i];
    if (bloque.text && bloque.text.startsWith('📁 ')) {
        currentFileBlock = { text: `**${bloque.text}**`, children: [] };
        bloques.push(currentFileBlock);
    } else {
        if (currentFileBlock) currentFileBlock.children.push(bloque);
        else bloques.push(bloque);
    }
}

console.log(JSON.stringify(bloques, null, 2));
