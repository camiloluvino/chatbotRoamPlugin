// CHATBOT ROAM PLUGIN - UI
// Modal interface with drag and drop and preview

const ChatbotRoamUI = {
    // Estado del modal
    _modalContainer: null,
    _fileContent: null,
    _processedContent: null,
    _originalProcessedContent: null,  // Para restaurar después de cortar
    _currentOpciones: null,
    _savedBlockUid: null,  // Guardar UID del bloque ANTES de abrir modal
    
    // Estado de búsqueda incremental
    _searchMatches: [],      // Posiciones de coincidencias
    _currentMatchIndex: -1,  // Índice actual
    _isCut: false,           // Si ya se cortó

    // ========================================================================
    // ESTILOS CSS
    // ========================================================================
    getStyles() {
        return `
            .chatbot-roam-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chatbot-roam-modal {
                background: #1a1a2e;
                border-radius: 12px;
                width: 700px;
                max-width: 90vw;
                max-height: 85vh;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
            }

            .chatbot-roam-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: #16213e;
                border-bottom: 1px solid #0f3460;
            }

            .chatbot-roam-title {
                color: #e94560;
                font-size: 18px;
                font-weight: 600;
                margin: 0;
            }

            .chatbot-roam-close {
                background: transparent;
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }

            .chatbot-roam-close:hover {
                color: #e94560;
            }

            .chatbot-roam-body {
                padding: 20px;
                overflow-y: auto;
                flex: 1;
            }

            .chatbot-roam-dropzone {
                border: 2px dashed #0f3460;
                border-radius: 8px;
                padding: 40px 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #16213e;
            }

            .chatbot-roam-dropzone:hover,
            .chatbot-roam-dropzone.dragover {
                border-color: #e94560;
                background: rgba(233, 69, 96, 0.1);
            }

            .chatbot-roam-dropzone-icon {
                font-size: 48px;
                margin-bottom: 12px;
            }

            .chatbot-roam-dropzone-text {
                color: #aaa;
                font-size: 14px;
            }

            .chatbot-roam-dropzone-text strong {
                color: #e94560;
            }

            .chatbot-roam-file-loaded {
                background: rgba(76, 175, 80, 0.1);
                border-color: #4CAF50;
            }

            .chatbot-roam-file-loaded .chatbot-roam-dropzone-icon {
                color: #4CAF50;
            }

            .chatbot-roam-section-title {
                color: #e94560;
                font-size: 14px;
                font-weight: 600;
                margin: 20px 0 12px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .chatbot-roam-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px 20px;
            }

            .chatbot-roam-option {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #ccc;
                font-size: 13px;
            }

            .chatbot-roam-option input[type="checkbox"] {
                accent-color: #e94560;
            }

            .chatbot-roam-presets {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                flex-wrap: wrap;
            }

            .chatbot-roam-preset-btn {
                background: #0f3460;
                border: 1px solid #16213e;
                color: #aaa;
                padding: 6px 14px;
                border-radius: 16px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .chatbot-roam-preset-btn:hover {
                background: #e94560;
                color: white;
                border-color: #e94560;
            }

            .chatbot-roam-preview {
                background: #0d1117;
                border: 1px solid #30363d;
                border-radius: 8px;
                padding: 12px;
                max-height: 200px;
                overflow-y: auto;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
                color: #c9d1d9;
                white-space: pre-wrap;
                line-height: 1.5;
            }

            .chatbot-roam-preview-info {
                color: #888;
                font-size: 11px;
                margin-top: 8px;
                font-style: italic;
            }

            .chatbot-roam-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: #16213e;
                border-top: 1px solid #0f3460;
            }

            .chatbot-roam-info {
                color: #888;
                font-size: 12px;
            }

            .chatbot-roam-info strong {
                color: #e94560;
            }

            .chatbot-roam-buttons {
                display: flex;
                gap: 10px;
            }

            .chatbot-roam-btn {
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .chatbot-roam-btn-cancel {
                background: transparent;
                border: 1px solid #444;
                color: #aaa;
            }

            .chatbot-roam-btn-cancel:hover {
                border-color: #666;
                color: #fff;
            }

            .chatbot-roam-btn-insert {
                background: #e94560;
                border: none;
                color: white;
                font-weight: 600;
            }

            .chatbot-roam-btn-insert:hover {
                background: #d63651;
            }

            .chatbot-roam-btn-insert:disabled {
                background: #444;
                cursor: not-allowed;
            }

            .chatbot-roam-hidden-input {
                display: none;
            }

            /* Búsqueda incremental */
            .chatbot-roam-search-section {
                background: #16213e;
                border: 1px solid #0f3460;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
            }

            .chatbot-roam-search-row {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .chatbot-roam-search-input {
                flex: 1;
                background: #0d1117;
                border: 1px solid #30363d;
                border-radius: 4px;
                padding: 8px 12px;
                color: #c9d1d9;
                font-size: 13px;
            }

            .chatbot-roam-search-input:focus {
                outline: none;
                border-color: #e94560;
            }

            .chatbot-roam-search-input::placeholder {
                color: #666;
            }

            .chatbot-roam-search-nav {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .chatbot-roam-search-btn {
                background: #0f3460;
                border: 1px solid #16213e;
                color: #aaa;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chatbot-roam-search-btn:hover:not(:disabled) {
                background: #e94560;
                color: white;
                border-color: #e94560;
            }

            .chatbot-roam-search-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .chatbot-roam-search-count {
                color: #888;
                font-size: 12px;
                min-width: 40px;
                text-align: center;
            }

            .chatbot-roam-cut-btn {
                background: #e94560;
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
            }

            .chatbot-roam-cut-btn:hover {
                background: #d63651;
            }

            .chatbot-roam-cut-btn:disabled {
                background: #444;
                cursor: not-allowed;
            }

            .chatbot-roam-cut-indicator {
                color: #4CAF50;
                font-size: 12px;
                margin-left: 8px;
            }

            /* Preview con highlights */
            .chatbot-roam-preview mark {
                background: rgba(233, 69, 96, 0.3);
                color: inherit;
                padding: 1px 2px;
                border-radius: 2px;
            }

            .chatbot-roam-preview mark.current {
                background: #e94560;
                color: white;
            }
        `;
    },

    // CREAR MODAL
    openModal() {
        if (this._modalContainer) {
            this.closeModal();
        }

        // IMPORTANTE: Capturar el bloque seleccionado ANTES de crear el modal
        const focusedBlock = window.roamAlphaAPI.ui.getFocusedBlock();
        this._savedBlockUid = focusedBlock ? focusedBlock['block-uid'] : null;

        // Inyectar estilos
        const styleId = 'chatbot-roam-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = this.getStyles();
            document.head.appendChild(style);
        }

        // Inicializar opciones por defecto
        this._currentOpciones = ChatbotRoamProcessing.getPresetOpciones('claude');
        this._fileContent = null;
        this._processedContent = null;
        this._originalProcessedContent = null;
        this._searchMatches = [];
        this._currentMatchIndex = -1;
        this._isCut = false;

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
            '<strong>Arrastra un archivo .md aqui</strong><br>' +
            'o haz clic para seleccionar' +
            '</div>' +
            '</div>' +
            '<input type="file" class="chatbot-roam-hidden-input" accept=".md,.txt" data-action="file-input">' +
            '<div class="chatbot-roam-section-title">OPCIONES DE LIMPIEZA</div>' +
            '<div class="chatbot-roam-options">' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_plaintext_claude" checked>' +
            'Bloques plaintext (Claude)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_logs_chatgpt">' +
            'Logs de busqueda' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_thinking_gemini">' +
            'Bloques Thinking (Gemini)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_metadata" checked>' +
            'Timestamps y referencias' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_thought_chatgpt">' +
            'Thought process (ChatGPT)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_footer_gemini">' +
            'Footer Gemini Exporter' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_toolcalls_claude" checked>' +
            'Tool calls (Claude)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_adjuntos_gemini">' +
            'Adjuntos Gemini' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_mcp_toolcalls_claude" checked>' +
            'MCP Tool calls (Claude)' +
            '</label>' +
            '<label class="chatbot-roam-option">' +
            '<input type="checkbox" data-option="eliminar_imagenes" checked>' +
            'Imagenes Base64' +
            '</label>' +
            '</div>' +
            '<div class="chatbot-roam-presets">' +
            '<button class="chatbot-roam-preset-btn" data-preset="claude">Claude</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="chatgpt">ChatGPT</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="gemini">Gemini</button>' +
            '<button class="chatbot-roam-preset-btn" data-preset="limpiar">Limpiar todo</button>' +
            '</div>' +
            '<div class="chatbot-roam-section-title">IMPORTACIÓN INCREMENTAL</div>' +
            '<div class="chatbot-roam-search-section">' +
            '<div class="chatbot-roam-search-row">' +
            '<input type="text" class="chatbot-roam-search-input" data-element="search-input" placeholder="Buscar texto del último prompt importado...">' +
            '<div class="chatbot-roam-search-nav">' +
            '<button class="chatbot-roam-search-btn" data-action="prev-match" disabled title="Anterior">◀</button>' +
            '<span class="chatbot-roam-search-count" data-element="match-count">0/0</span>' +
            '<button class="chatbot-roam-search-btn" data-action="next-match" disabled title="Siguiente">▶</button>' +
            '</div>' +
            '<button class="chatbot-roam-cut-btn" data-action="cut-here" disabled>✂ Cortar aquí</button>' +
            '<span class="chatbot-roam-cut-indicator" data-element="cut-indicator"></span>' +
            '</div>' +
            '</div>' +
            '<div class="chatbot-roam-section-title">VISTA PREVIA</div>' +
            '<div class="chatbot-roam-preview" data-element="preview">' +
            '<span style="color: #666;">Arrastra un archivo para ver la vista previa...</span>' +
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
            const file = e.dataTransfer.files[0];
            if (file) this._handleFile(file);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this._handleFile(file);
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
        searchInput.addEventListener('input', (e) => this._performSearch(e.target.value));
        
        // Navigation buttons
        modal.querySelector('[data-action="prev-match"]').addEventListener('click', () => this._navigateMatch(-1));
        modal.querySelector('[data-action="next-match"]').addEventListener('click', () => this._navigateMatch(1));
        
        // Cut button
        modal.querySelector('[data-action="cut-here"]').addEventListener('click', () => this._cutFromCurrentMatch());

        // ESC to close
        document.addEventListener('keydown', this._handleEsc);
    },

    _handleEsc(e) {
        if (e.key === 'Escape') {
            ChatbotRoamUI.closeModal();
        }
    },

    // ========================================================================
    // FILE HANDLING
    // ========================================================================
    _handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this._fileContent = e.target.result;

            // Detectar tipo de chatbot y aplicar preset
            const tipo = ChatbotRoamProcessing.detectarTipoChatbot(this._fileContent);
            this._applyPreset(tipo);

            // Actualizar dropzone visual
            const dropzone = this._modalContainer.querySelector('[data-action="dropzone"]');
            dropzone.classList.add('chatbot-roam-file-loaded');
            dropzone.querySelector('.chatbot-roam-dropzone-icon').textContent = '✅';
            dropzone.querySelector('.chatbot-roam-dropzone-text').innerHTML = `
                <strong>${file.name}</strong><br>
                <span style="color: #4CAF50;">Archivo cargado (${(file.size / 1024).toFixed(1)} KB)</span>
            `;

            this._processAndPreview();
        };
        reader.readAsText(file);
    },

    // ========================================================================
    // OPTIONS MANAGEMENT
    // ========================================================================
    _applyPreset(preset) {
        if (preset === 'limpiar') {
            this._currentOpciones = {
                eliminar_imagenes: false,
                eliminar_plaintext_claude: false,
                eliminar_thinking_gemini: false,
                eliminar_thought_chatgpt: false,
                eliminar_toolcalls_claude: false,
                eliminar_mcp_toolcalls_claude: false,
                eliminar_logs_chatgpt: false,
                eliminar_metadata: false,
                eliminar_footer_gemini: false,
                eliminar_adjuntos_gemini: false
            };
        } else {
            this._currentOpciones = ChatbotRoamProcessing.getPresetOpciones(preset);
        }

        // Update checkboxes
        this._modalContainer.querySelectorAll('[data-option]').forEach(checkbox => {
            const option = checkbox.dataset.option;
            checkbox.checked = this._currentOpciones[option] || false;
        });

        if (this._fileContent) {
            this._processAndPreview();
        }
    },

    _updateOpciones() {
        this._modalContainer.querySelectorAll('[data-option]').forEach(checkbox => {
            this._currentOpciones[checkbox.dataset.option] = checkbox.checked;
        });

        if (this._fileContent) {
            this._processAndPreview();
        }
    },

    // ========================================================================
    // PROCESSING & PREVIEW
    // ========================================================================
    _processAndPreview() {
        const { resultado, numIntercambios } = ChatbotRoamProcessing.procesarConOpcionesIndividuales(
            this._fileContent,
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
    },

    _updatePreview(content, numIntercambios) {
        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        const previewInfo = this._modalContainer.querySelector('[data-element="preview-info"]');
        const insertBtn = this._modalContainer.querySelector('[data-action="insert"]');

        if (content) {
            // Mostrar contenido completo para poder buscar
            preview.textContent = content;
            const countInfo = numIntercambios !== undefined ? `${numIntercambios} intercambios · ` : '';
            previewInfo.textContent = `${countInfo}${content.length.toLocaleString()} caracteres totales`;
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
        
        this._currentMatchIndex += direction;
        if (this._currentMatchIndex < 0) {
            this._currentMatchIndex = this._searchMatches.length - 1;
        } else if (this._currentMatchIndex >= this._searchMatches.length) {
            this._currentMatchIndex = 0;
        }
        
        this._renderPreviewWithHighlights();
        this._scrollToCurrentMatch();
    },

    _renderPreviewWithHighlights() {
        const preview = this._modalContainer.querySelector('[data-element="preview"]');
        const content = this._isCut ? this._processedContent : this._originalProcessedContent;
        
        if (!content) {
            preview.innerHTML = '<span style="color: #666;">Arrastra un archivo para ver la vista previa...</span>';
            this._updateSearchButtons();
            return;
        }

        if (this._searchMatches.length === 0) {
            preview.textContent = content;
            this._updateSearchButtons();
            return;
        }

        // Crear HTML con highlights
        let html = '';
        let lastEnd = 0;
        
        for (let i = 0; i < this._searchMatches.length; i++) {
            const match = this._searchMatches[i];
            // Texto antes del match
            html += this._escapeHtml(content.substring(lastEnd, match.start));
            // Match con highlight
            const isCurrent = i === this._currentMatchIndex;
            const markClass = isCurrent ? 'current' : '';
            const markId = isCurrent ? 'id="current-match"' : '';
            html += `<mark class="${markClass}" ${markId}>${this._escapeHtml(content.substring(match.start, match.end))}</mark>`;
            lastEnd = match.end;
        }
        // Texto después del último match
        html += this._escapeHtml(content.substring(lastEnd));
        
        preview.innerHTML = html;
        this._updateSearchButtons();
    },

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    _scrollToCurrentMatch() {
        const currentMark = this._modalContainer.querySelector('#current-match');
        if (currentMark) {
            currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            countSpan.textContent = `${this._currentMatchIndex + 1}/${this._searchMatches.length}`;
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
        cutIndicator.textContent = '✓ Cortado';
        
        // Contar intercambios restantes
        const lines = this._processedContent.split('\n');
        let numIntercambios = 0;
        for (const line of lines) {
            if (line.startsWith('* ')) numIntercambios++;
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

        try {
            // Parsear el contenido procesado en estructura de bloques
            // Los bloques [CODE] ya tienen {{NL}} en vez de \n gracias a processing.js
            const lineas = this._processedContent.split('\n');
            const bloques = this._parseToBlockStructure(lineas);

            // Insertar bloques recursivamente
            await this._insertBlocksRecursively(parentUid, bloques, 0);

            // Cerrar modal despues de insertar
            this.closeModal();
            console.log('Conversacion insertada en Roam');

        } catch (error) {
            console.error('Error insertando en Roam:', error);
            alert('Error al insertar en Roam: ' + error.message);
        }
    },

    /**
     * Convierte lineas en estructura jerarquica de bloques
     * Maneja bloques de codigo marcados con [CODE]
     */
    _parseToBlockStructure(lineas) {
        var result = [];
        var currentPrompt = null;

        for (var i = 0; i < lineas.length; i++) {
            var linea = lineas[i];
            if (!linea || !linea.trim()) continue;

            // Detectar prompts (nivel 0, empiezan con "* ")
            if (linea.startsWith('* ')) {
                if (currentPrompt) {
                    result.push(currentPrompt);
                }
                currentPrompt = {
                    text: linea.substring(2).trim(),
                    children: []
                };
                continue;
            }

            // Detectar respuestas (indentadas 4 espacios)
            if (linea.startsWith('    ') && currentPrompt) {
                var texto = linea.substring(4);

                // Detectar bloque de codigo combinado
                if (texto.startsWith('[CODE]')) {
                    // Extraer codigo sin el marcador y restaurar los \n
                    var codigo = texto.substring(6);
                    // Restaurar los newlines: {{NL}} -> \n
                    codigo = codigo.replace(/\{\{NL\}\}/g, '\n');
                    if (codigo) {
                        currentPrompt.children.push({
                            text: codigo,
                            children: []
                        });
                    }
                    continue;
                }

                // Linea normal - quitar "* " si es un bullet
                var textoLimpio = texto.startsWith('* ') ? texto.substring(2) : texto;
                if (textoLimpio.trim()) {
                    currentPrompt.children.push({
                        text: textoLimpio.trim(),
                        children: []
                    });
                }
            }
        }

        // Agregar ultimo prompt
        if (currentPrompt) {
            result.push(currentPrompt);
        }

        return result;
    },

    /**
     * Inserta bloques recursivamente en Roam usando la API correcta
     * Detecta headings markdown y los convierte a headings nativos de Roam
     */
    async _insertBlocksRecursively(parentUid, bloques, startOrder) {
        for (var i = 0; i < bloques.length; i++) {
            var bloque = bloques[i];
            var blockUid = window.roamAlphaAPI.util.generateUID();
            var texto = bloque.text;
            var headingLevel = 0;

            // Detectar nivel de heading (### = 3, ## = 2, # = 1)
            if (texto.startsWith('### ')) {
                headingLevel = 3;
                texto = texto.substring(4).trim();
            } else if (texto.startsWith('## ')) {
                headingLevel = 2;
                texto = texto.substring(3).trim();
            } else if (texto.startsWith('# ')) {
                headingLevel = 1;
                texto = texto.substring(2).trim();
            }

            // Crear bloque con o sin heading
            var blockData = {
                location: { "parent-uid": parentUid, order: startOrder + i },
                block: { uid: blockUid, string: texto }
            };

            // Agregar heading si corresponde
            if (headingLevel > 0) {
                blockData.block.heading = headingLevel;
            }

            await window.roamAlphaAPI.data.block.create(blockData);

            // Insertar hijos recursivamente
            if (bloque.children && bloque.children.length > 0) {
                await this._insertBlocksRecursively(blockUid, bloque.children, 0);
            }
        }
    },

    // CLOSE MODAL
    closeModal() {
        const savedUid = this._savedBlockUid;
        if (this._modalContainer) {
            this._modalContainer.remove();
            this._modalContainer = null;
            this._fileContent = null;
            this._processedContent = null;
            this._savedBlockUid = null;
            document.removeEventListener('keydown', this._handleEsc);
        }
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
