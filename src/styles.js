// ============================================================================
// CHATBOT ROAM PLUGIN - STYLES
// CSS styles for the modal interface
// ============================================================================

const ChatbotRoamStyles = {
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
                width: 900px;
                max-width: 90vw;
                max-height: 90vh;
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

            .chatbot-roam-file-error {
                background: rgba(233, 69, 96, 0.1);
                border-color: #e94560;
            }

            .chatbot-roam-file-error .chatbot-roam-dropzone-icon {
                color: #e94560;
                font-size: 36px;
                font-weight: bold;
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
                max-height: 250px;
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

            /* Busqueda incremental */
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

            /* Editor de clasificación manual v2 */
            .chatbot-roam-editor-panel {
                background: rgba(255, 165, 0, 0.08);
                border: 1px solid #FFA500;
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
            }

            .chatbot-roam-editor-header {
                margin-bottom: 12px;
            }

            .chatbot-roam-editor-title {
                display: block;
                color: #FFA500;
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
            }

            .chatbot-roam-editor-subtitle {
                color: #888;
                font-size: 12px;
            }

            .chatbot-roam-editor-stats {
                color: #aaa;
                font-size: 11px;
                margin-bottom: 10px;
                padding: 6px 10px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }

            .chatbot-roam-editor-list {
                max-height: 400px;
                overflow-y: auto;
            }

            .chatbot-roam-editor-item {
                display: flex;
                flex-direction: column;
                padding: 8px 12px;
                margin-bottom: 6px;
                border-radius: 6px;
                border-left: 4px solid;
                position: relative;
            }

            .chatbot-roam-editor-item.prompt {
                background: rgba(66, 133, 244, 0.15);
                border-left-color: #4285F4;
            }

            .chatbot-roam-editor-item.response {
                background: rgba(76, 175, 80, 0.15);
                border-left-color: #4CAF50;
            }

            .chatbot-roam-editor-item.modified {
                box-shadow: 0 0 8px rgba(255, 165, 0, 0.5);
            }

            .chatbot-roam-editor-item-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
            }

            .chatbot-roam-editor-num {
                color: #666;
                font-size: 11px;
                font-weight: 600;
            }

            .chatbot-roam-editor-icon {
                font-size: 12px;
            }

            .chatbot-roam-editor-tipo {
                font-weight: 600;
                font-size: 11px;
            }

            .chatbot-roam-editor-item.prompt .chatbot-roam-editor-tipo {
                color: #4285F4;
            }

            .chatbot-roam-editor-item.response .chatbot-roam-editor-tipo {
                color: #4CAF50;
            }

            .chatbot-roam-editor-mcp {
                background: #e94560;
                color: white;
                font-size: 9px;
                padding: 2px 5px;
                border-radius: 3px;
                font-weight: 600;
            }

            .chatbot-roam-editor-line {
                color: #666;
                font-size: 10px;
                margin-left: auto;
            }

            .chatbot-roam-editor-extracto {
                color: #999;
                font-size: 11px;
                font-family: 'Consolas', 'Monaco', monospace;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding-right: 70px;
            }

            .chatbot-roam-editor-buttons {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                gap: 4px;
            }

            .chatbot-roam-editor-swap-btn,
            .chatbot-roam-editor-chain-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #444;
                color: #aaa;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chatbot-roam-editor-swap-btn:hover {
                background: #FFA500;
                border-color: #FFA500;
                color: white;
            }

            .chatbot-roam-editor-chain-btn {
                font-size: 11px;
                background: rgba(255, 165, 0, 0.15);
                border-color: #FFA500;
                color: #FFA500;
            }

            .chatbot-roam-editor-chain-btn:hover {
                background: #e94560;
                border-color: #e94560;
                color: white;
            }

            .chatbot-roam-editor-actions {
                display: flex;
                gap: 10px;
                margin-top: 12px;
                justify-content: flex-end;
            }

            .chatbot-roam-editor-btn-continue {
                background: #4CAF50;
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
            }

            .chatbot-roam-editor-btn-continue:hover {
                background: #45a049;
            }

            .chatbot-roam-editor-btn-skip {
                background: transparent;
                border: 1px solid #444;
                color: #aaa;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }

            .chatbot-roam-editor-btn-skip:hover {
                border-color: #666;
                color: #fff;
            }

            .chatbot-roam-editor-btn-restore {
                background: transparent;
                border: 1px solid #e94560;
                color: #e94560;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }

            .chatbot-roam-editor-btn-restore:hover:not(:disabled) {
                background: #e94560;
                color: white;
            }

            .chatbot-roam-editor-btn-restore:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
        `;
    }
};
