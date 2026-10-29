// CHATBOT ROAM PLUGIN - UI
// Modal interface with drag and drop and preview

const ChatbotRoamUI = {
    // Estado del modal
    _modalContainer: null,
    _archivos: null,         // [{ name, content }] de los archivos cargados
    _processedContent: null,
    _originalProcessedContent: null,  // Para restaurar después de cortar
    _currentOpciones: null,
    _savedBlockUid: null,  // Guardar UID del bloque ANTES de abrir modal

    // Estado de búsqueda incremental
    _searchMatches: [],      // Posiciones de coincidencias
    _currentMatchIndex: -1,  // Índice actual
    _isCut: false,           // Si ya se cortó
    _boundEscHandler: null,  // Referencia al handler de ESC para cleanup
    _activeCancelToken: null, // Token para cancelar insercion en curso


    // CREAR MODAL
    openModal() {
        if (this._modalContainer) {
            this.closeModal();
        }

        // IMPORTANTE: Capturar el bloque seleccionado ANTES de crear el modal
        const focusedBlock = window.roamAlphaAPI.ui.getFocusedBlock();
        this._savedBlockUid = focusedBlock ? focusedBlock['block-uid'] : null;

        // Inyectar estilos (usa modulo ChatbotRoamStyles)
        const styleId = 'chatbot-roam-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = ChatbotRoamStyles.getStyles();
            document.head.appendChild(style);
        }

        // Inicializar opciones por defecto
        this._currentOpciones = ChatbotRoamOpciones.getDefaults([ChatbotRoamFormatoClaude]);
        this._archivos = null;
        this._processedContent = null;
        this._originalProcessedContent = null;
        this._searchMatches = [];
        this._currentMatchIndex = -1;
        this._isCut = false;
        this._activeCancelToken = null;

        // Crear modal
        this._modalContainer = document.createElement('div');
        this._modalContainer.className = 'chatbot-roam-overlay';
        this._modalContainer.innerHTML = this._getModalHTML();

        document.body.appendChild(this._modalContainer);
        this._attachEventListeners();
    },

    _getModalHTML() {
        return '<div class="chatbot-roam-modal">' +
            '<div class="chatbot-roam-header">' +
            '<h2 class="chatbot-roam-title">Importar Conversacion de Chatbot</h2>' +
            '<button class="chatbot-roam-close" data-action="close">&times;</button>' +
            '</div>' +
            '<div class="chatbot-roam-body">' +
            '<div class="chatbot-roam-dropzone" data-action="dropzone">' +
            '<div class="chatbot-roam-dropzone-icon">+</div>' +
            '<div class="chatbot-roam-dropzone-text">' +
            '<strong>Arrastra uno o mas archivos .md aqui</strong><br>' +
            'o haz clic para seleccionar' +
            '</div>' +
            '</div>' +
            '<input type="file" class="chatbot-roam-hidden-input" accept=".md,.txt" multiple data-action="file-input">' +
            '<div class="chatbot-roam-section-title">OPCIONES DE LIMPIEZA</div>' +
            '<div class="chatbot-roam-options">' +
            ChatbotRoamOpciones.generarCheckboxesHTML() +
            '</div>' +
            '<div class="chatbot-roam-presets">' +
            '<button class="chatbot-roam-preset-btn" data-preset="claude">Claude</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="gemini">Gemini</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="notebooklm">NotebookLM</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="limpiar">Limpiar todo</button>' +
            '</div>' +
            '<div class="chatbot-roam-section-title">IMPORTACION INCREMENTAL</div>' +
            '<div class="chatbot-roam-search-section">' +
            '<div class="chatbot-roam-search-row">' +
            '<input type="text" class="chatbot-roam-search-input" data-element="search-input" placeholder="Buscar texto del ultimo prompt importado...">' +
            '<div class="chatbot-roam-search-nav">' +
            '<button class="chatbot-roam-search-btn" data-action="prev-match" disabled title="Anterior">&lt;</button>' +
            '<span class="chatbot-roam-search-count" data-element="match-count">0/0</span>' +
            '<button class="chatbot-roam-search-btn" data-action="next-match" disabled title="Siguiente">&gt;</button>' +
            '</div>' +
            '<button class="chatbot-roam-cut-btn" data-action="cut-here" disabled>Cortar aqui</button>' +
            '<span class="chatbot-roam-cut-indicator" data-element="cut-indicator"></span>' +
            '</div>' +
            '</div>' +
            '<div class="chatbot-roam-section-title">VISTA PREVIA</div>' +
            '<div class="chatbot-roam-preview" data-element="preview">' +
            '<span style="color: #666;">Arrastra archivos para ver la vista previa...</span>' +
            '</div>' +
            '<div class="chatbot-roam-preview-info" data-element="preview-info"></div>' +
            '</div>' +
            '<div class="chatbot-roam-footer">' +
            '<div class="chatbot-roam-info">' +
            'Se insertara como hijo del <strong>bloque seleccionado</strong>' +
            '</div>' +
            '<div class="chatbot-roam-buttons">' +
            '<button class="chatbot-roam-btn chatbot-roam-btn-cancel" data-action="close">Cancelar</button>' +
            '<button class="chatbot-roam-btn chatbot-roam-btn-insert" data-action="insert" disabled>Insertar en Roam</button>' +
            '</div>' +
            '</div>' +
            '</div>';
    },

    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================
    _attachEventListeners() {
        const modal = this._modalContainer;

        // Close button and overlay click
        modal.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'close' || e.target.classList.contains('chatbot-roam-overlay')) {
                this.closeModal();
            }
        });

        // Dropzone click
        const dropzone = modal.querySelector('[data-action="dropzone"]');
        const fileInput = modal.querySelector('[data-action="file-input"]');

        dropzone.addEventListener('click', () => fileInput.click());

        // Drag & drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files && files.length > 0) this._handleFiles(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) this._handleFiles(files);
        });

        // Preset buttons
        modal.querySelectorAll('[data-preset]').forEach(btn => {
            btn.addEventListener('click', () => this._applyPreset(btn.dataset.preset));
        });

        // Checkbox changes
        modal.querySelectorAll('[data-option]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this._updateOpciones());
        });

        // Insert button
        modal.querySelector('[data-action="insert"]').addEventListener('click', () => this._insertInRoam());

        // Search functionality
        const searchInput = modal.querySelector('[data-element="search-input"]');
        let searchTimer = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => this._performSearch(e.target.value), 250);
        });

        // Navigation buttons
        modal.querySelector('[data-action="prev-match"]').addEventListener('click', () => this._navigateMatch(-1));
        modal.querySelector('[data-action="next-match"]').addEventListener('click', () => this._navigateMatch(1));

        // Cut button
        modal.querySelector('[data-action="cut-here"]').addEventListener('click', () => this._cutFromCurrentMatch());

        // ESC to close - guardar referencia bound para cleanup
        this._boundEscHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', this._boundEscHandler);
    },

    // ========================================================================
    // FILE HANDLING
    // ========================================================================

    // Constantes de validacion
    MAX_FILE_SIZE_MB: 5,
    VALID_EXTENSIONS: ['.md', '.txt'],

    /**
     * Valida el archivo antes de procesarlo
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    _validateFile(file) {
        // Validar tamaño
        const maxSizeBytes = this.MAX_FILE_SIZE_MB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return {
                valid: false,
                error: 'Archivo muy grande. Maximo ' + this.MAX_FILE_SIZE_MB + 'MB. Tu archivo: ' + (file.size / 1024 / 1024).toFixed(1) + 'MB'
            };
        }

        // Validar extension
        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.VALID_EXTENSIONS.some(ext => fileName.endsWith(ext));
        if (!hasValidExtension) {
            return {
                valid: false,
                error: 'Extension no valida. Se aceptan: ' + this.VALID_EXTENSIONS.join(', ')
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Valida el contenido del archivo
     * @returns {Object} - { valid: boolean, error: string|null, warning: string|null }
     */
    _validateContent(content) {
        // Verificar que no este vacio
        if (!content || content.trim().length === 0) {
            return { valid: false, error: 'El archivo esta vacio.', warning: null };
        }

        // Verificar marcadores de conversacion segun el formato detectado
        const formato = ChatbotRoamFormatos.detectar(content);
        const tienePrompt = new RegExp(formato.MARCADOR_PROMPT.source, formato.MARCADOR_PROMPT.flags).test(content);
        const tieneResponse = new RegExp(formato.MARCADOR_RESPUESTA.source, formato.MARCADOR_RESPUESTA.flags).test(content);

        if (!tienePrompt && !tieneResponse) {
            return {
                valid: false,
                error: 'El archivo no parece ser una conversacion exportada. No se encontraron marcadores de conversacion.',
                warning: null
            };
        }

        // Warning si falta alguno
        let warning = null;
        if (!tienePrompt) {
            warning = 'Advertencia: No se encontraron marcadores de Prompt (ej: "## User:" o "## Prompt:")';
        } else if (!tieneResponse) {
            warning = 'Advertencia: No se encontraron marcadores de Respuesta (ej: "## Response:", "## Assistant:" o "## Gemini:")';
        }

        return { valid: true, error: null, warning: warning };
    },

    /**
     * Muestra error en la dropzone
     */
    _showDropzoneError(message) {
        const dropzone = this._modalContainer.querySelector('[data-action="dropzone"]');
        dropzone.classList.remove('chatbot-roam-file-loaded');
        dropzone.classList.add('chatbot-roam-file-error');
        dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = '!';
        dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML =
            '<strong style="color: #e94560;">Error</strong><br>' +
            '<span style="color: #e94560;">' + message + '</span>';
    },

    _handleFiles(fileList) {
        // Convertir FileList a Array y ordenar alfabeticamente
        const filesArray = Array.from(fileList).sort((a, b) => a.name.localeCompare(b.name));
        
        // Validar todos los archivos individuales
        let totalSize = 0;
        for (const file of filesArray) {
            const fileValidation = this._validateFile(file);
            if (!fileValidation.valid) {
                this._showDropzoneError('Archivo "' + file.name + '" invalido: ' + fileValidation.error);
                return;
            }
            totalSize += file.size;
        }

        // Mostrar estado de carga
        const dropzone = this._modalContainer.querySelector('[data-action="dropzone"]');
        dropzone.classList.remove('chatbot-roam-file-error');
        dropzone.classList.add('chatbot-roam-file-loaded');
        dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = '...';
        dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML = 'Leyendo ' + filesArray.length + ' archivo(s)...';

        // Leer todos de forma asincronica
        const readPromises = filesArray.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve({ name: file.name, content: e.target.result, size: file.size });
                reader.onerror = () => reject('Error leyendo ' + file.name);
                reader.readAsText(file);
            });
        });

        Promise.all(readPromises).then(results => {
            const archivos = [];
            let warnings = [];

            for (const result of results) {
                const contentValidation = this._validateContent(result.content);
                if (!contentValidation.valid) {
                    this._showDropzoneError('Archivo "' + result.name + '" no valido: ' + contentValidation.error);
                    return; // Abortar operacion si un archivo no es valido
                }
                if (contentValidation.warning) warnings.push(result.name + ': ' + contentValidation.warning);

                archivos.push({ name: result.name, content: result.content });
            }

            this._archivos = archivos;

            // Opciones por defecto segun el formato de cada archivo
            const formatos = archivos.map(a => ChatbotRoamFormatos.detectar(a.content));
            this._setOpciones(ChatbotRoamOpciones.getDefaults(formatos));

            // Actualizar dropzone visual final
            dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = 'OK';
            
            let namesText = filesArray.length > 1 ? filesArray.length + ' archivos' : filesArray[0].name;
            let statusText = '<span style="color: #4CAF50;">Cargados (' + (totalSize / 1024).toFixed(1) + ' KB)</span>';
            
            if (warnings.length > 0) {
                const escapedWarnings = warnings.map(w => this._escapeHtml(w));
                statusText += '<br><span style="color: #FFA500; font-size: 11px; font-weight: bold;" title="' + escapedWarnings.join('\n') + '">⚠ ' + warnings.length + ' advertencia(s):</span>';
                statusText += '<br><span style="color: #FFA500; font-size: 10px; display: inline-block; max-width: 90%; text-align: center;">' + escapedWarnings.join('<br>') + '</span>';
            }

            dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML =
                '<strong>' + namesText + '</strong><br>' + statusText;

            this._processAndPreview();
        }).catch(err => {
            this._showDropzoneError('Error fatal: ' + err);
        });
    },

    // ========================================================================
    // OPTIONS MANAGEMENT
    // ========================================================================
    _applyPreset(preset) {
        if (preset === 'limpiar') {
            this._setOpciones(ChatbotRoamOpciones.getDefaults([]));
        } else {
            this._setOpciones(ChatbotRoamOpciones.getDefaults([ChatbotRoamFormatos.porId(preset)]));
        }

        if (this._archivos) {
            this._processAndPreview();
        }
    },

    /**
     * Fija las opciones activas y actualiza los checkboxes
     */
    _setOpciones(opciones) {
        this._currentOpciones = opciones;
        this._modalContainer.querySelectorAll('[data-option]').forEach(checkbox => {
            checkbox.checked = this._currentOpciones[checkbox.dataset.option] || false;
        });
    },

    _updateOpciones() {
        this._modalContainer.querySelectorAll('[data-option]').forEach(checkbox => {
            this._currentOpciones[checkbox.dataset.option] = checkbox.checked;
        });

        if (this._archivos) {
            clearTimeout(this._updateTimer);
            this._updateTimer = setTimeout(() => this._processAndPreview(), 300);
        }
    },

    // ========================================================================
    // PROCESSING & PREVIEW
    // ========================================================================
    async _processAndPreview() {
        // Mostrar estado de carga
        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        const insertBtn = this._modalContainer.querySelector('[data-action="insert"]');

        preview.innerHTML = '<span style="color: #4CAF50;">Procesando archivo... por favor espera</span>';
        insertBtn.disabled = true;

        // Bloquear checkboxes
        this._toggleInputs(false);

        try {
            // Dar tiempo al browser para renderizar el mensaje de carga
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            const { resultado, numIntercambios } = await ChatbotRoamProcessing.procesarArchivos(
                this._archivos,
                this._currentOpciones
            );

            this._processedContent = resultado;
            this._originalProcessedContent = resultado;  // Guardar original
            this._isCut = false;
            this._searchMatches = [];
            this._currentMatchIndex = -1;

            // Reset search UI
            const searchInput = this._modalContainer.querySelector('[data-element="search-input"]');
            const cutIndicator = this._modalContainer.querySelector('[data-element="cut-indicator"]');
            if (searchInput) searchInput.value = '';
            if (cutIndicator) cutIndicator.textContent = '';

            this._updatePreview(resultado, numIntercambios);
        } catch (error) {
            console.error(error);
            preview.innerHTML = '<span style="color: #e94560;">Error al procesar: ' + error.message + '</span>';
        } finally {
            this._toggleInputs(true);
        }
    },

    /**
     * Habilita/deshabilita inputs durante procesamiento
     */
    _toggleInputs(enabled) {
        const checkboxes = this._modalContainer.querySelectorAll('input[type="checkbox"]');
        const presets = this._modalContainer.querySelectorAll('.chatbot-roam-preset-btn');
        const fileInput = this._modalContainer.querySelector('.chatbot-roam-hidden-input');

        checkboxes.forEach(cb => cb.disabled = !enabled);
        presets.forEach(btn => btn.disabled = !enabled);
        if (fileInput) fileInput.disabled = !enabled;
    },

    _updatePreview(content, numIntercambios) {
        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        const previewInfo = this._modalContainer.querySelector('[data-element="preview-info"]');
        const insertBtn = this._modalContainer.querySelector('[data-action="insert"]');

        if (content) {
            // Mostrar contenido (truncado si es excesivamente grande para evitar lags de renderizado)
            const MAX_PREVIEW_LIMIT = 80000;
            const isTruncated = content.length > MAX_PREVIEW_LIMIT;
            const displayContent = isTruncated ? content.substring(0, MAX_PREVIEW_LIMIT) + '\n\n... [Vista previa truncada para mejorar rendimiento. El archivo completo se importará correctamente] ...' : content;

            preview.textContent = displayContent;
            const countInfo = numIntercambios !== undefined ? (numIntercambios + ' intercambios · ') : '';
            const truncationInfo = isTruncated ? ' (vista previa truncada)' : '';
            previewInfo.textContent = countInfo + content.length.toLocaleString() + ' caracteres totales' + truncationInfo;
            insertBtn.disabled = false;
        } else {
            preview.innerHTML = '<span style="color: #e94560;">No se encontraron conversaciones en el archivo.</span>';
            previewInfo.textContent = '';
            insertBtn.disabled = true;
        }

        this._updateSearchButtons();
    },

    // ========================================================================
    // BÚSQUEDA INCREMENTAL
    // ========================================================================
    _performSearch(query) {
        if (!this._originalProcessedContent || !query || query.length < 2) {
            this._searchMatches = [];
            this._currentMatchIndex = -1;
            this._renderPreviewWithHighlights();
            return;
        }

        // Buscar todas las ocurrencias (case-insensitive)
        const content = this._originalProcessedContent;
        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();

        this._searchMatches = [];
        let pos = 0;
        while ((pos = lowerContent.indexOf(lowerQuery, pos)) !== -1) {
            this._searchMatches.push({
                start: pos,
                end: pos + query.length
            });
            pos += 1;
        }

        this._currentMatchIndex = this._searchMatches.length > 0 ? 0 : -1;
        this._renderPreviewWithHighlights();

        if (this._currentMatchIndex >= 0) {
            this._scrollToCurrentMatch();
        }
    },

    _navigateMatch(direction) {
        if (this._searchMatches.length === 0) return;

        // Quitar highlight del match actual
        const prevMark = this._modalContainer.querySelector('#current-match');
        if (prevMark) {
            prevMark.classList.remove('current');
            prevMark.removeAttribute('id');
        }

        this._currentMatchIndex += direction;
        if (this._currentMatchIndex < 0) {
            this._currentMatchIndex = this._searchMatches.length - 1;
        } else if (this._currentMatchIndex >= this._searchMatches.length) {
            this._currentMatchIndex = 0;
        }

        // Poner highlight en el nuevo match sin reconstruir todo el innerHTML
        const marks = this._modalContainer.querySelectorAll('.chatbot-roam-preview mark');
        if (marks[this._currentMatchIndex]) {
            marks[this._currentMatchIndex].classList.add('current');
            marks[this._currentMatchIndex].id = 'current-match';
        }

        this._updateSearchButtons();
        this._scrollToCurrentMatch();
    },

    _renderPreviewWithHighlights() {
        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        let content = this._isCut ? this._processedContent : this._originalProcessedContent;

        if (!content) {
            preview.innerHTML = '<span style="color: #666;">Arrastra archivos para ver la vista previa...</span>';
            this._updateSearchButtons();
            return;
        }

        const MAX_PREVIEW_LIMIT = 80000;
        let isTruncated = false;
        if (content.length > MAX_PREVIEW_LIMIT) {
            content = content.substring(0, MAX_PREVIEW_LIMIT);
            isTruncated = true;
        }

        // Filtrar matches que estén dentro del límite de la vista previa visible
        const visibleMatches = this._searchMatches.filter(match => match.end <= MAX_PREVIEW_LIMIT);

        if (visibleMatches.length === 0) {
            preview.textContent = content + (isTruncated ? '\n\n... [Vista previa truncada para mejorar rendimiento] ...' : '');
            this._updateSearchButtons();
            return;
        }

        // Crear HTML con highlights
        let html = '';
        let lastEnd = 0;

        for (let i = 0; i < visibleMatches.length; i++) {
            const match = visibleMatches[i];
            // Texto antes del match
            html += this._escapeHtml(content.substring(lastEnd, match.start));
            // Match con highlight
            const isCurrent = i === this._currentMatchIndex;
            const markClass = isCurrent ? 'current' : '';
            const markId = isCurrent ? 'id="current-match"' : '';
            html += '<mark class="' + markClass + '" ' + markId + '>' + this._escapeHtml(content.substring(match.start, match.end)) + '</mark>';
            lastEnd = match.end;
        }
        // Texto después del último match
        html += this._escapeHtml(content.substring(lastEnd));
        if (isTruncated) {
            html += '\n\n... [Vista previa truncada para mejorar rendimiento] ...';
        }

        preview.innerHTML = html;
        this._updateSearchButtons();
    },

    _escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    _scrollToCurrentMatch() {
        const currentMark = this._modalContainer.querySelector('#current-match');
        if (currentMark) {
            currentMark.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
    },

    _updateSearchButtons() {
        const prevBtn = this._modalContainer.querySelector('[data-action="prev-match"]');
        const nextBtn = this._modalContainer.querySelector('[data-action="next-match"]');
        const cutBtn = this._modalContainer.querySelector('[data-action="cut-here"]');
        const countSpan = this._modalContainer.querySelector('[data-element="match-count"]');

        const hasMatches = this._searchMatches.length > 0;
        const hasMultiple = this._searchMatches.length > 1;

        prevBtn.disabled = !hasMultiple;
        nextBtn.disabled = !hasMultiple;
        cutBtn.disabled = !hasMatches || this._isCut;

        if (hasMatches) {
            countSpan.textContent = (this._currentMatchIndex + 1) + '/' + this._searchMatches.length;
        } else {
            countSpan.textContent = '0/0';
        }
    },

    _cutFromCurrentMatch() {
        if (this._currentMatchIndex < 0 || this._isCut) return;

        const match = this._searchMatches[this._currentMatchIndex];
        const content = this._originalProcessedContent;

        // Encontrar el inicio de la línea que contiene el match
        // Buscamos el "* " que indica un prompt
        let cutPosition = match.start;

        // Buscar hacia atrás el inicio del prompt ("* " al inicio de línea o después de newline)
        while (cutPosition > 0) {
            if (content.substring(cutPosition, cutPosition + 2) === '* ' &&
                (cutPosition === 0 || content[cutPosition - 1] === '\n')) {
                break;
            }
            cutPosition--;
        }

        // Cortar desde esa posición
        this._processedContent = content.substring(cutPosition);
        this._isCut = true;

        // Limpiar búsqueda y actualizar UI
        this._searchMatches = [];
        this._currentMatchIndex = -1;

        const searchInput = this._modalContainer.querySelector('[data-element="search-input"]');
        searchInput.value = '';

        const cutIndicator = this._modalContainer.querySelector('[data-element="cut-indicator"]');
        cutIndicator.textContent = '[OK] Cortado';

        // Contar intercambios restantes
        let numIntercambios = 0;
        let searchPos = 0;
        while (true) {
            const lineStart = searchPos === 0 ? 0 : this._processedContent.indexOf('\n', searchPos - 1) + 1;
            if (lineStart === 0 && searchPos > 0) break;
            if (this._processedContent.charCodeAt(lineStart) === 42 && this._processedContent.charCodeAt(lineStart + 1) === 32) {
                numIntercambios++;
            }
            const nextNewline = this._processedContent.indexOf('\n', lineStart);
            if (nextNewline === -1) break;
            searchPos = nextNewline + 1;
        }

        this._updatePreview(this._processedContent, numIntercambios);
    },

    // ROAM INSERTION
    async _insertInRoam() {
        if (!this._processedContent) return;

        // Usar el bloque guardado al abrir el modal
        if (!this._savedBlockUid) {
            alert('No hay bloque seleccionado. Selecciona un bloque antes de abrir el plugin.');
            return;
        }

        const parentUid = this._savedBlockUid;

        // Parsear el contenido procesado en estructura de bloques
        const lineas = this._processedContent.split('\n');
        let rawBloques = ChatbotRoamParser.parseToBlockStructure(lineas);

        // Agrupar bajo los nodos padre de cada archivo si procede
        let bloques = [];
        let currentFileBlock = null;

        for (let i = 0; i < rawBloques.length; i++) {
            let bloque = rawBloques[i];
            if (bloque.text && bloque.text.startsWith('📁 ')) {
                currentFileBlock = { text: '**' + bloque.text + '**', children: [] };
                bloques.push(currentFileBlock);
            } else {
                if (currentFileBlock) {
                    currentFileBlock.children.push(bloque);
                } else {
                    bloques.push(bloque);
                }
            }
        }

        if (bloques.length === 0) {
            alert('No se generaron bloques para insertar.');
            return;
        }

        // Feedback UI
        const insertBtn = this._modalContainer.querySelector('[data-action="insert"]');
        const originalText = insertBtn.textContent;
        insertBtn.disabled = true;
        insertBtn.textContent = 'Insertando... (0%)';
        this._toggleInputs(false);

        // Crear token de cancelacion
        this._activeCancelToken = { cancelled: false };

        // Insertar usando el Inserter con soporte de rollback, batching y cancelacion
        const result = await ChatbotRoamInserter.insertBlocksRecursively(parentUid, bloques, 0, this._activeCancelToken, (count, total) => {
            // Verificar si el modal aun existe (por si se cancelo y cerro)
            if (!this._modalContainer) return;

            // Actualizar porcentaje
            const percent = Math.round((count / total) * 100);
            insertBtn.textContent = 'Insertando... (' + percent + '%)';
        });

        // Limpiar token
        this._activeCancelToken = null;

        if (result.success) {
            // Cerrar modal tras exito
            this.closeModal();

            // Notificar al usuario (podriamos usar un toast de Roam si existiera API publica, por ahora alert o nada)
            console.log('Chatbot Roam Plugin: ' + result.insertedCount + ' bloques insertados correctamente.');
        } else {
            // Verificar si el modal aun existe antes de intentar actualizar UI
            if (!this._modalContainer) return;

            // Mostrar error y rollback info
            let msg = '';

            if (result.error === 'OPERACION_CANCELADA_POR_USUARIO') {
                msg = 'Operacion cancelada por el usuario.';
            } else {
                msg = 'Error al insertar bloques: ' + result.error;
            }

            if (result.rolledBackCount > 0) {
                msg += '\n\nSe realizo una limpieza automatica (ROLLBACK) eliminando ' + result.rolledBackCount + ' bloques parciales.';
            } else {
                msg += '\n\nNo se insertaron bloques (limpio).';
            }

            alert(msg);

            // Restaurar UI
            insertBtn.disabled = false;
            insertBtn.textContent = originalText;
            this._toggleInputs(true);
        }
    },
    // CLOSE MODAL
    closeModal() {
        const savedUid = this._savedBlockUid;

        // Si hay una insercion activa, cancelarla
        if (this._activeCancelToken) {
            console.log('Cancelando insercion en curso...');
            this._activeCancelToken.cancelled = true;
            // No esperamos al rollback aqui, "fire and forget"
            // El usuario recibe feedback visual inmediato de cierre
        }

        // Limpiar event listener SIEMPRE (incluso si modal ya no existe)
        if (this._boundEscHandler) {
            document.removeEventListener('keydown', this._boundEscHandler);
            this._boundEscHandler = null;
        }

        if (this._modalContainer) {
            this._modalContainer.remove();
            this._modalContainer = null;
            this._archivos = null;
            this._processedContent = null;
            this._originalProcessedContent = null;
            this._searchMatches = [];
            this._currentMatchIndex = -1;
            this._savedBlockUid = null;
        }

        // Limpiar estilos inyectados
        const styleEl = document.getElementById('chatbot-roam-styles');
        if (styleEl) styleEl.remove();

        // Limpiar timers pendientes
        clearTimeout(this._updateTimer);

        // Restaurar foco al bloque original
        if (savedUid) {
            setTimeout(function () {
                window.roamAlphaAPI.ui.setBlockFocusAndSelection({
                    location: { "block-uid": savedUid, "window-id": "main-window" }
                });
            }, 100);
        }
    }
};
