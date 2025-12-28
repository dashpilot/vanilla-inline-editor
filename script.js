class InlineRichTextEditor {
	constructor(editorSelector, toolbarSelector, config = {}) {
		// Helper function to find element by ID, class selector, or array of selectors
		const findElement = (selector) => {
			// If selector is an array, try each one until we find a match
			if (Array.isArray(selector)) {
				for (const sel of selector) {
					const element = findElement(sel);
					if (element) {
						return element;
					}
				}
				return null;
			}

			// If selector starts with # or ., use querySelector directly
			if (selector.startsWith('#') || selector.startsWith('.')) {
				return document.querySelector(selector);
			}
			// Otherwise, try as ID first, then as class for backwards compatibility
			return document.getElementById(selector) || document.querySelector(`.${selector}`);
		};

		this.editor = findElement(editorSelector);
		this.toolbar = findElement(toolbarSelector);

		if (!this.editor) {
			console.error(`Editor element with selector "${editorSelector}" not found`);
			return;
		}

		if (!this.toolbar) {
			console.error(`Toolbar element with selector "${toolbarSelector}" not found`);
			return;
		}

		this.config = {
			buttons: config.buttons || this.getDefaultButtons(),
			maxImageWidth: config.maxImageWidth || 1200,
			...config
		};

		this.plusButton = null;
		this.plusMenu = null;
		this.injectEditorStyles();
		this.init();
	}

	injectEditorStyles() {
		// Check if styles are already injected
		if (document.getElementById('inline-editor-styles')) {
			return;
		}

		const style = document.createElement('style');
		style.id = 'inline-editor-styles';
		style.textContent = `
            .editor-toolbar {
                position: fixed;
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 6px 10px;
                display: none;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                pointer-events: auto;
                opacity: 0;
                transform: translateY(-10px);
                transition: opacity 0.2s ease, transform 0.2s ease;
            }

            .editor-toolbar.visible {
                display: flex !important;
                opacity: 1 !important;
                transform: translateY(0) !important;
                visibility: visible !important;
            }

            .toolbar-group {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .toolbar-separator {
                width: 1px;
                height: 24px;
                background-color: #dee2e6;
                margin: 0 4px;
            }

            .toolbar-button {
                background: white;
                border: none;
                border-radius: 6px;
                padding: 6px 10px;
                cursor: pointer;
                font-size: 14px;
                color: #495057;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                transition: all 0.2s ease;
                position: relative;
                min-width: 32px;
                height: 32px;
            }

            .toolbar-button:hover {
                background-color: #e9ecef;
            }

            .toolbar-button.active {
                background-color: #e7f3ff;
                color: #0066cc;
            }

            .toolbar-button:active {
                transform: scale(0.95);
            }

            .toolbar-button i {
                font-size: 16px;
            }

            .toolbar-button .button-label {
                font-weight: 600;
                font-size: 14px;
            }

            .toolbar-dropdown {
                position: relative;
            }

            .toolbar-dropdown-button {
                background: white;
                border: none;
                border-radius: 6px;
                padding: 6px 10px;
                cursor: pointer;
                font-size: 14px;
                color: #495057;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s ease;
                height: 32px;
            }

            .toolbar-dropdown-button:hover {
                background-color: #e9ecef;
            }

            .toolbar-dropdown-button i {
                font-size: 12px;
                opacity: 0.7;
            }

            .toolbar-dropdown-menu {
                position: absolute;
                top: 100%;
                left: 0;
                margin-top: 4px;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                min-width: 120px;
                z-index: 1000;
                display: none;
                padding: 4px;
            }

            .toolbar-dropdown-menu.show {
                display: block;
            }

            .toolbar-dropdown-item {
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 4px;
                font-size: 14px;
                color: #495057;
                transition: background-color 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .toolbar-dropdown-item:hover {
                background-color: #f8f9fa;
            }

            .toolbar-dropdown-item i {
                font-size: 16px;
                width: 16px;
                text-align: center;
            }

            .toolbar-button[data-tooltip] {
                position: relative;
            }

            .toolbar-button[data-tooltip]:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                margin-bottom: 8px;
                padding: 6px 10px;
                background: #212529;
                color: white;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 1001;
                pointer-events: none;
            }

            .toolbar-button[data-tooltip]:hover::before {
                content: '';
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                margin-bottom: 2px;
                border: 4px solid transparent;
                border-top-color: #212529;
                z-index: 1001;
                pointer-events: none;
            }

            .editor-content {
                min-height: 300px;
                padding: 20px;
                outline: none;
                font-size: 16px;
                line-height: 1.6;
                color: #212529;
                position: relative;
            }

            .editor-content:focus {
                outline: none;
            }

            .editor-content p,
            .editor-content h1,
            .editor-content h2 {
                margin: 0 0 12px 0;
                position: relative;
            }

            .editor-content p:last-child,
            .editor-content h1:last-child,
            .editor-content h2:last-child {
                margin-bottom: 0;
            }

            .editor-container {
                position: relative;
            }

            .editor-plus-button {
                position: absolute;
                left: -32px;
                width: 24px;
                height: 24px;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                display: none;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #6c757d;
                font-size: 16px;
                transition: all 0.2s ease;
                z-index: 1000;
            }

            .editor-plus-button:hover {
                background-color: #f8f9fa;
                border-color: #adb5bd;
                color: #495057;
            }

            .editor-plus-button.visible {
                display: flex;
            }

            .plus-menu {
                position: absolute;
                left: -32px;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                min-width: 180px;
                z-index: 1001;
                display: none;
                padding: 4px;
                margin-top: 4px;
            }

            .plus-menu.show {
                display: block;
            }

            .plus-menu-item {
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 4px;
                font-size: 14px;
                color: #495057;
                transition: background-color 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .plus-menu-item:hover {
                background-color: #f8f9fa;
            }

            .plus-menu-item i {
                font-size: 16px;
                width: 20px;
                text-align: center;
            }

            .link-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            .link-modal {
                background: white;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                width: 90%;
                max-width: 400px;
                animation: slideUp 0.2s ease;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .link-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid #e9ecef;
            }

            .link-modal-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #212529;
            }

            .link-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #6c757d;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }

            .link-modal-close:hover {
                background-color: #f8f9fa;
                color: #212529;
            }

            .link-modal-body {
                padding: 20px;
            }

            .link-modal-field {
                margin-bottom: 16px;
            }

            .link-modal-field:last-child {
                margin-bottom: 0;
            }

            .link-modal-field label {
                display: block;
                margin-bottom: 6px;
                font-size: 14px;
                font-weight: 500;
                color: #495057;
            }

            .link-modal-field input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                font-size: 14px;
                font-family: inherit;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            .link-modal-field input:focus {
                outline: none;
                border-color: #0066cc;
                box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
            }

            .file-upload-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }

            .file-upload-button {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                background: #0066cc;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .file-upload-button:hover {
                background: #0052a3;
            }

            .file-upload-button:active {
                background: #003d7a;
            }

            .file-name {
                color: #6c757d;
                font-size: 14px;
            }

            .image-preview {
                text-align: center;
            }

            .image-preview img {
                display: block;
                margin: 0 auto;
            }

            .file-upload-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }

            .file-upload-button {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                background: #0066cc;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .file-upload-button:hover {
                background: #0052a3;
            }

            .file-upload-button:active {
                background: #003d7a;
            }

            .file-name {
                color: #6c757d;
                font-size: 14px;
            }

            .image-preview {
                text-align: center;
            }

            .image-preview img {
                display: block;
                margin: 0 auto;
            }

            .link-modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                padding: 16px 20px;
                border-top: 1px solid #e9ecef;
            }

            .link-modal-footer button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .link-modal-cancel {
                background-color: #f8f9fa;
                color: #495057;
            }

            .link-modal-cancel:hover {
                background-color: #e9ecef;
            }

            .link-modal-insert {
                background-color: #0066cc;
                color: white;
            }

            .link-modal-insert:hover {
                background-color: #0052a3;
            }
        `;

		document.head.appendChild(style);
	}

	getDefaultButtons() {
		return [
			{
				type: 'button',
				id: 'bold',
				icon: 'bi-type-bold',
				tooltip: 'Bold: ⌘ + B',
				action: () => this.formatText('bold'),
				command: 'bold',
				keyboardShortcut: { key: 'b', metaKey: true }
			},
			{
				type: 'button',
				id: 'italic',
				icon: 'bi-type-italic',
				tooltip: 'Italic: ⌘ + I',
				action: () => this.formatText('italic'),
				command: 'italic',
				keyboardShortcut: { key: 'i', metaKey: true }
			},
			{
				type: 'button',
				id: 'underline',
				icon: 'bi-type-underline',
				tooltip: 'Underline: ⌘ + U',
				action: () => this.formatText('underline'),
				command: 'underline',
				keyboardShortcut: { key: 'u', metaKey: true }
			},
			{
				type: 'button',
				id: 'link',
				icon: 'bi-link-45deg',
				tooltip: 'Insert Link',
				action: () => this.showLinkModal()
			}
		];
	}

	init() {
		this.buildToolbar();
		this.createPlusButton();
		this.setupEventListeners();
		this.updateButtonStates();
		this.hideToolbar();
	}

	createPlusButton() {
		// Create plus button - append to editor container for proper positioning
		this.plusButton = document.createElement('button');
		this.plusButton.className = 'editor-plus-button';
		this.plusButton.innerHTML = '<i class="bi bi-plus"></i>';
		this.plusButton.type = 'button';
		this.editor.parentElement.appendChild(this.plusButton);

		// Create plus menu
		this.plusMenu = document.createElement('div');
		this.plusMenu.className = 'plus-menu';
		this.plusMenu.innerHTML = `
			<div class="plus-menu-item" data-type="h1">
				<i class="bi bi-type-h1"></i>
				<span>Heading 1</span>
			</div>
			<div class="plus-menu-item" data-type="h2">
				<i class="bi bi-type-h2"></i>
				<span>Heading 2</span>
			</div>
			<div class="plus-menu-item" data-type="p">
				<i class="bi bi-paragraph"></i>
				<span>Paragraph</span>
			</div>
			<div class="plus-menu-item" data-type="img">
				<i class="bi bi-image"></i>
				<span>Image</span>
			</div>
		`;
		this.editor.parentElement.appendChild(this.plusMenu);

		// Handle plus button click
		this.plusButton.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.plusMenu.classList.toggle('show');
		});

		// Handle menu item clicks
		this.plusMenu.querySelectorAll('.plus-menu-item').forEach((item) => {
			item.addEventListener('mousedown', (e) => {
				e.preventDefault();
				e.stopPropagation();
			});
			item.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				const type = item.getAttribute('data-type');
				// Store current selection and target element before menu interaction
				const selection = window.getSelection();
				let savedRange = null;
				let savedTargetElement = null;

				if (selection.rangeCount > 0) {
					savedRange = selection.getRangeAt(0).cloneRange();
					let targetElement = savedRange.commonAncestorContainer;
					if (targetElement.nodeType === Node.TEXT_NODE) {
						targetElement = targetElement.parentElement;
					}
					while (targetElement && targetElement !== this.editor) {
						if (['P', 'H1', 'H2', 'DIV'].includes(targetElement.tagName)) {
							savedTargetElement = targetElement;
							break;
						}
						targetElement = targetElement.parentElement;
					}
				}

				this.plusMenu.classList.remove('show');
				this.hidePlusButton();

				// Insert element after a short delay to ensure menu is closed
				setTimeout(() => {
					this.insertBlockElement(type, savedRange, savedTargetElement);
				}, 10);
			});
		});

		// Close menu when clicking outside
		document.addEventListener('click', (e) => {
			if (!this.plusButton.contains(e.target) && !this.plusMenu.contains(e.target)) {
				this.plusMenu.classList.remove('show');
			}
		});
	}

	insertBlockElement(type, savedRange = null, savedTargetElement = null) {
		if (type === 'img') {
			this.showImageModal();
			return;
		}

		// Use saved target element if provided, otherwise find it
		let targetElement = savedTargetElement;

		if (!targetElement) {
			// Use saved range if provided, otherwise get current selection
			let range;
			const selection = window.getSelection();

			if (savedRange) {
				range = savedRange;
			} else if (selection.rangeCount > 0) {
				range = selection.getRangeAt(0);
			} else {
				return;
			}

			targetElement = range.commonAncestorContainer;

			// Find the block element (p, h1, h2, etc.)
			if (targetElement.nodeType === Node.TEXT_NODE) {
				targetElement = targetElement.parentElement;
			}

			while (targetElement && targetElement !== this.editor) {
				if (['P', 'H1', 'H2', 'DIV'].includes(targetElement.tagName)) {
					break;
				}
				targetElement = targetElement.parentElement;
			}
		}

		if (!targetElement || targetElement === this.editor) {
			targetElement = this.editor.querySelector('p') || this.editor;
		}

		// Create new element
		const newElement = document.createElement(type);
		if (type === 'p') {
			newElement.innerHTML = '<br>';
		} else {
			newElement.textContent = '';
		}

		// Insert after the target element
		if (targetElement.parentNode) {
			targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
		} else {
			this.editor.appendChild(newElement);
		}

		// Focus the new element and place cursor
		this.editor.focus();
		requestAnimationFrame(() => {
			const newRange = document.createRange();
			newRange.selectNodeContents(newElement);
			newRange.collapse(true);
			const sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(newRange);
			this.editor.focus();
			setTimeout(() => {
				this.checkAndShowPlusButton();
			}, 10);
		});
	}

	showImageModal() {
		// Create modal for image upload
		const modal = document.createElement('div');
		modal.className = 'link-modal-overlay';
		modal.innerHTML = `
			<div class="link-modal">
				<div class="link-modal-header">
					<h3>Upload Image</h3>
					<button class="link-modal-close" type="button">&times;</button>
				</div>
				<div class="link-modal-body">
					<div class="link-modal-field">
						<label for="image-alt">Alt Text</label>
						<input type="text" id="image-alt" placeholder="Image description">
					</div>
					<div class="file-upload-wrapper">
						<input type="file" id="image-file" accept="image/*" style="display: none;">
						<button type="button" class="file-upload-button" id="file-upload-trigger">
							<i class="bi bi-upload"></i> Choose Image
						</button>
						<span class="file-name" id="file-name"></span>
					</div>
					<div class="image-preview" id="image-preview" style="display: none; margin-top: 12px;">
						<img id="preview-img" style="max-width: 100%; max-height: 200px; border-radius: 4px;">
					</div>
				</div>
				<div class="link-modal-footer">
					<button class="link-modal-cancel" type="button">Cancel</button>
					<button class="link-modal-insert" type="button" disabled>Upload & Insert</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		const fileInput = modal.querySelector('#image-file');
		const fileUploadTrigger = modal.querySelector('#file-upload-trigger');
		const fileName = modal.querySelector('#file-name');
		const altInput = modal.querySelector('#image-alt');
		const preview = modal.querySelector('#image-preview');
		const previewImg = modal.querySelector('#preview-img');
		const insertButton = modal.querySelector('.link-modal-insert');

		// Trigger file input when button is clicked
		fileUploadTrigger.addEventListener('click', () => {
			fileInput.click();
		});

		// Preview image when file is selected
		fileInput.addEventListener('change', (e) => {
			const file = e.target.files[0];
			if (file && file.type.startsWith('image/')) {
				fileName.textContent = file.name;
				const reader = new FileReader();
				reader.onload = (event) => {
					previewImg.src = event.target.result;
					preview.style.display = 'block';
					insertButton.disabled = false;
				};
				reader.readAsDataURL(file);
			} else {
				preview.style.display = 'none';
				fileName.textContent = '';
				insertButton.disabled = true;
			}
		});

		// Close handlers
		const closeModal = () => {
			document.body.removeChild(modal);
		};

		modal.querySelector('.link-modal-close').addEventListener('click', closeModal);
		modal.querySelector('.link-modal-cancel').addEventListener('click', closeModal);
		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				closeModal();
			}
		});

		// Insert image handler
		insertButton.addEventListener('click', async () => {
			const file = fileInput.files[0];
			const altText = altInput.value.trim();

			if (!file) {
				alert('Please select an image file');
				return;
			}

			// Show loading state
			insertButton.disabled = true;
			insertButton.textContent = 'Processing...';

			try {
				// Resize image using Pica
				const resizedDataUrl = await this.resizeImage(file, this.config.maxImageWidth);

				this.editor.focus();

				const selection = window.getSelection();
				let targetElement = null;

				if (selection.rangeCount > 0) {
					const range = selection.getRangeAt(0);
					targetElement = range.commonAncestorContainer;

					// Find the block element
					if (targetElement.nodeType === Node.TEXT_NODE) {
						targetElement = targetElement.parentElement;
					}

					while (targetElement && targetElement !== this.editor) {
						if (['P', 'H1', 'H2', 'DIV'].includes(targetElement.tagName)) {
							break;
						}
						targetElement = targetElement.parentElement;
					}
				}

				if (!targetElement || targetElement === this.editor) {
					targetElement = this.editor.querySelector('p') || this.editor;
				}

				// Create image element
				const img = document.createElement('img');
				img.src = resizedDataUrl;
				img.alt = altText || 'Image';
				img.style.maxWidth = '100%';
				img.style.height = 'auto';
				img.contentEditable = 'false';

				// Insert after the target element
				if (targetElement.parentNode) {
					targetElement.parentNode.insertBefore(img, targetElement.nextSibling);
				} else {
					this.editor.appendChild(img);
				}

				closeModal();
				this.hidePlusButton();
			} catch (error) {
				console.error('Error processing image:', error);
				alert('Error processing image. Please try again.');
				insertButton.disabled = false;
				insertButton.textContent = 'Upload & Insert';
			}
		});

		// Handle Escape key
		altInput.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				closeModal();
			}
		});
	}

	async resizeImage(file, maxWidth) {
		return new Promise((resolve, reject) => {
			// Check if Pica is available
			if (typeof pica === 'undefined') {
				// Fallback: use canvas without Pica
				const reader = new FileReader();
				reader.onload = (e) => {
					const img = new Image();
					img.onload = () => {
						const canvas = document.createElement('canvas');
						let width = img.width;
						let height = img.height;

						// Calculate new dimensions
						if (width > maxWidth) {
							height = (height * maxWidth) / width;
							width = maxWidth;
						}

						canvas.width = width;
						canvas.height = height;

						const ctx = canvas.getContext('2d');
						ctx.drawImage(img, 0, 0, width, height);

						resolve(canvas.toDataURL('image/jpeg', 0.9));
					};
					img.onerror = reject;
					img.src = e.target.result;
				};
				reader.onerror = reject;
				reader.readAsDataURL(file);
			} else {
				// Use Pica for high-quality resizing
				const reader = new FileReader();
				reader.onload = (e) => {
					const img = new Image();
					img.onload = () => {
						let width = img.width;
						let height = img.height;

						// Calculate new dimensions
						if (width > maxWidth) {
							height = (height * maxWidth) / width;
							width = maxWidth;
						}

						// Create source and destination canvases
						const sourceCanvas = document.createElement('canvas');
						sourceCanvas.width = img.width;
						sourceCanvas.height = img.height;
						const sourceCtx = sourceCanvas.getContext('2d');
						sourceCtx.drawImage(img, 0, 0);

						const destCanvas = document.createElement('canvas');
						destCanvas.width = width;
						destCanvas.height = height;

						// Use Pica to resize - check if pica is a function or an object
						const picaInstance = typeof pica === 'function' ? new pica() : pica;

						if (picaInstance && typeof picaInstance.resize === 'function') {
							picaInstance
								.resize(sourceCanvas, destCanvas, {
									quality: 3,
									alpha: false,
									unsharpAmount: 80,
									unsharpRadius: 0.6,
									unsharpThreshold: 2
								})
								.then(() => {
									resolve(destCanvas.toDataURL('image/jpeg', 0.9));
								})
								.catch(reject);
						} else {
							// Fallback to canvas if Pica API is not available
							const ctx = destCanvas.getContext('2d');
							ctx.drawImage(img, 0, 0, width, height);
							resolve(destCanvas.toDataURL('image/jpeg', 0.9));
						}
					};
					img.onerror = reject;
					img.src = e.target.result;
				};
				reader.onerror = reject;
				reader.readAsDataURL(file);
			}
		});
	}

	showPlusButton(element) {
		if (!this.plusButton || !element) return;

		const rect = element.getBoundingClientRect();
		const editorRect = this.editor.getBoundingClientRect();
		const containerRect = this.editor.parentElement.getBoundingClientRect();

		// Position the plus button to the left of the element, relative to editor container
		// Use negative left positioning but ensure container allows overflow
		const topOffset = rect.top - containerRect.top + this.editor.scrollTop;
		this.plusButton.style.top = `${topOffset}px`;
		this.plusButton.style.left = '-32px';
		this.plusButton.classList.add('visible');

		// Position menu below button
		this.plusMenu.style.top = `${topOffset + 24}px`;
		this.plusMenu.style.left = '-32px';
	}

	hidePlusButton() {
		if (this.plusButton) {
			this.plusButton.classList.remove('visible');
		}
		if (this.plusMenu) {
			this.plusMenu.classList.remove('show');
		}
	}

	checkAndShowPlusButton() {
		// Don't show plus button if toolbar is visible (text is selected)
		if (this.toolbar.classList.contains('visible')) {
			this.hidePlusButton();
			return;
		}

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			this.hidePlusButton();
			return;
		}

		const range = selection.getRangeAt(0);
		if (!range || !range.collapsed) {
			// Text is selected, hide plus button
			this.hidePlusButton();
			return;
		}

		// Cursor is collapsed (no selection)
		let element = range.commonAncestorContainer;

		if (element.nodeType === Node.TEXT_NODE) {
			element = element.parentElement;
		}

		// Find the block element
		while (element && element !== this.editor) {
			if (['P', 'H1', 'H2', 'DIV'].includes(element.tagName)) {
				// Check if cursor is at the start of the element
				const rangeAtStart = document.createRange();
				rangeAtStart.selectNodeContents(element);
				rangeAtStart.collapse(true);

				// Show plus button if cursor is at the start or if element is empty
				const isAtStart = range.compareBoundaryPoints(Range.START_TO_START, rangeAtStart) === 0;
				const isEmpty = element.textContent.trim() === '';

				if (isAtStart || isEmpty) {
					this.showPlusButton(element);
					return;
				}
				break;
			}
			element = element.parentElement;
		}

		this.hidePlusButton();
	}

	buildToolbar() {
		this.toolbar.innerHTML = '';

		this.config.buttons.forEach((buttonConfig) => {
			if (buttonConfig.type === 'separator') {
				this.toolbar.appendChild(this.createSeparator());
			} else if (buttonConfig.type === 'group') {
				this.toolbar.appendChild(this.createButtonGroup(buttonConfig));
			} else if (buttonConfig.type === 'dropdown') {
				this.toolbar.appendChild(this.createDropdown(buttonConfig));
			} else if (buttonConfig.type === 'button') {
				this.toolbar.appendChild(this.createButton(buttonConfig));
			}
		});
	}

	createSeparator() {
		const separator = document.createElement('div');
		separator.className = 'toolbar-separator';
		return separator;
	}

	createButton(config) {
		const button = document.createElement('button');
		button.className = 'toolbar-button';
		button.id = `btn-${config.id}`;
		button.type = 'button';

		if (config.tooltip) {
			button.setAttribute('data-tooltip', config.tooltip);
		}

		if (config.icon) {
			const icon = document.createElement('i');
			icon.className = `bi ${config.icon}`;
			button.appendChild(icon);
		}

		if (config.label) {
			const label = document.createElement('span');
			label.className = 'button-label';
			label.textContent = config.label;
			button.appendChild(label);
		}

		button.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			config.action();
			this.updateButtonStates();
			// Keep toolbar visible after formatting
			setTimeout(() => {
				const selection = window.getSelection();
				if (selection.rangeCount > 0 && !selection.isCollapsed) {
					const range = selection.getRangeAt(0);
					this.showToolbar(range);
				}
			}, 0);
		});

		// Store config for state updates
		button._config = config;

		return button;
	}

	createDropdown(config) {
		const container = document.createElement('div');
		container.className = 'toolbar-dropdown';

		const button = document.createElement('button');
		button.className = 'toolbar-dropdown-button';
		button.type = 'button';
		button.id = `btn-${config.id}`;

		if (config.icon) {
			const icon = document.createElement('i');
			icon.className = `bi ${config.icon}`;
			button.appendChild(icon);
		}

		const label = document.createElement('span');
		label.className = 'dropdown-label';
		label.textContent = config.label;
		button.appendChild(label);

		const chevron = document.createElement('i');
		chevron.className = 'bi bi-chevron-down';
		button.appendChild(chevron);

		const menu = document.createElement('div');
		menu.className = 'toolbar-dropdown-menu';

		config.options.forEach((option) => {
			const item = document.createElement('div');
			item.className = 'toolbar-dropdown-item';

			// Add icon if option has one
			if (option.icon) {
				const itemIcon = document.createElement('i');
				itemIcon.className = `bi ${option.icon}`;
				item.appendChild(itemIcon);
			}

			const itemLabel = document.createElement('span');
			itemLabel.textContent = option.label;
			item.appendChild(itemLabel);

			item.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				config.action(option.value);
				label.textContent = option.label;

				// Update icon if option has one
				if (option.icon) {
					const icon = button.querySelector('i.bi:not(.bi-chevron-down)');
					if (icon) {
						icon.className = `bi ${option.icon}`;
					}
				}

				menu.classList.remove('show');
				this.updateButtonStates();
				// Keep toolbar visible after formatting
				setTimeout(() => {
					const selection = window.getSelection();
					if (selection.rangeCount > 0 && !selection.isCollapsed) {
						const range = selection.getRangeAt(0);
						this.showToolbar(range);
					}
				}, 0);
			});
			menu.appendChild(item);
		});

		button.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			menu.classList.toggle('show');
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', (e) => {
			if (!container.contains(e.target)) {
				menu.classList.remove('show');
			}
		});

		container.appendChild(button);
		container.appendChild(menu);

		// Store config
		button._config = config;
		button._label = label;

		return container;
	}

	createButtonGroup(config) {
		const group = document.createElement('div');
		group.className = `toolbar-group ${config.id}-group`;

		if (config.id === 'alignment') {
			group.classList.add('alignment-group');
		}

		config.buttons.forEach((buttonConfig) => {
			group.appendChild(this.createButton(buttonConfig));
		});

		return group;
	}

	formatText(command, value = null) {
		this.editor.focus();

		if (value !== null) {
			document.execCommand(command, false, value);
		} else {
			document.execCommand(command, false);
		}

		this.updateButtonStates();

		// Maintain selection and toolbar visibility
		setTimeout(() => {
			this.handleSelectionChange();
		}, 0);
	}

	showLinkModal() {
		const selection = window.getSelection();
		let url = '';
		let linkText = '';
		let existingLinkNode = null;
		let savedRange = null;

		// Store the current selection and link node BEFORE opening modal
		if (selection.rangeCount > 0 && !selection.isCollapsed) {
			savedRange = selection.getRangeAt(0).cloneRange();
			linkText = savedRange.toString();

			// Check if the selection is inside a link - store the link node reference
			let node = savedRange.commonAncestorContainer;
			if (node.nodeType === Node.TEXT_NODE) {
				node = node.parentNode;
			}

			while (node && node !== this.editor) {
				if (node.tagName === 'A') {
					existingLinkNode = node;
					url = node.getAttribute('href') || '';
					break;
				}
				node = node.parentNode;
			}
		}

		// Create modal
		const modal = document.createElement('div');
		modal.className = 'link-modal-overlay';
		modal.innerHTML = `
            <div class="link-modal">
                <div class="link-modal-header">
                    <h3>Insert Link</h3>
                    <button class="link-modal-close" type="button">&times;</button>
                </div>
                <div class="link-modal-body">
                    <div class="link-modal-field">
                        <label for="link-text">Text</label>
                        <input type="text" id="link-text" value="${linkText}" placeholder="Link text">
                    </div>
                    <div class="link-modal-field">
                        <label for="link-url">URL</label>
                        <input type="url" id="link-url" value="${url}" placeholder="https://example.com">
                    </div>
                </div>
                <div class="link-modal-footer">
                    <button class="link-modal-cancel" type="button">Cancel</button>
                    <button class="link-modal-insert" type="button">Insert</button>
                </div>
            </div>
        `;

		document.body.appendChild(modal);

		// Focus on URL input
		const urlInput = modal.querySelector('#link-url');
		setTimeout(() => urlInput.focus(), 100);

		// Close handlers
		const closeModal = () => {
			document.body.removeChild(modal);
		};

		modal.querySelector('.link-modal-close').addEventListener('click', closeModal);
		modal.querySelector('.link-modal-cancel').addEventListener('click', closeModal);
		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				closeModal();
			}
		});

		// Insert link handler
		modal.querySelector('.link-modal-insert').addEventListener('click', () => {
			const text = modal.querySelector('#link-text').value.trim();
			const linkUrl = modal.querySelector('#link-url').value.trim();

			if (!linkUrl) {
				alert('Please enter a URL');
				return;
			}

			this.editor.focus();

			// Use the saved link node and range from before modal opened
			if (existingLinkNode) {
				// Update existing link in place - no replacement, just update attributes
				existingLinkNode.setAttribute('href', linkUrl);
				if (text) {
					existingLinkNode.textContent = text;
				}
				existingLinkNode.setAttribute('target', '_blank');
				existingLinkNode.setAttribute('rel', 'noopener noreferrer');

				// Select the updated link
				const newRange = document.createRange();
				newRange.selectNodeContents(existingLinkNode);
				const sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(newRange);
			} else if (savedRange) {
				// Create new link - wrap the saved range
				const link = document.createElement('a');
				link.href = linkUrl;
				link.target = '_blank';
				link.rel = 'noopener noreferrer';

				try {
					// Extract content from saved range
					const contents = savedRange.extractContents();

					// Put content in link
					if (contents.childNodes.length > 0) {
						while (contents.firstChild) {
							link.appendChild(contents.firstChild);
						}
					} else {
						link.textContent = text || savedRange.toString() || linkUrl;
					}

					// Override with text if provided
					if (text) {
						link.textContent = text;
					}

					// Insert at the saved range position
					savedRange.insertNode(link);

					// Select the new link
					const newRange = document.createRange();
					newRange.selectNodeContents(link);
					const sel = window.getSelection();
					sel.removeAllRanges();
					sel.addRange(newRange);
				} catch (e) {
					// Fallback
					link.textContent = text || savedRange.toString() || linkUrl;
					savedRange.insertNode(link);
				}
			} else {
				// No selection - insert link at cursor
				const link = document.createElement('a');
				link.href = linkUrl;
				link.textContent = text || linkUrl;
				link.target = '_blank';
				link.rel = 'noopener noreferrer';

				const range = document.createRange();
				const sel = window.getSelection();
				if (sel.rangeCount > 0) {
					range.setStart(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
				} else {
					range.setStart(this.editor, 0);
				}
				range.collapse(true);
				range.insertNode(link);
			}

			closeModal();
			this.updateButtonStates();
			setTimeout(() => {
				this.handleSelectionChange();
			}, 0);
		});

		// Handle Enter key
		modal.querySelectorAll('input').forEach((input) => {
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					modal.querySelector('.link-modal-insert').click();
				} else if (e.key === 'Escape') {
					e.preventDefault();
					closeModal();
				}
			});
		});
	}

	updateButtonStates() {
		// Get all buttons
		const allButtons = Array.from(this.toolbar.querySelectorAll('.toolbar-button'));

		// STEP 1: Force remove ALL active states - do this multiple times to be sure
		allButtons.forEach((button) => {
			button.classList.remove('active');
		});
		allButtons.forEach((button) => {
			button.classList.remove('active');
		});

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			return;
		}

		const range = selection.getRangeAt(0);

		// STEP 2: Check formatting buttons (bold, italic, underline) - these can be active simultaneously
		allButtons.forEach((button) => {
			const config = button._config;
			if (config && config.command && !config.command.startsWith('justify')) {
				try {
					const isActive = document.queryCommandState(config.command);
					if (isActive) {
						button.classList.add('active');
					}
				} catch (e) {
					// Ignore errors
				}
			}
		});
	}

	setupEventListeners() {
		// Show/hide toolbar based on selection - use selectionchange for better detection
		document.addEventListener('selectionchange', () => {
			requestAnimationFrame(() => {
				this.handleSelectionChange();
				this.checkAndShowPlusButton();
			});
		});

		// Also listen to mouse and keyboard events
		this.editor.addEventListener('mouseup', (e) => {
			requestAnimationFrame(() => {
				setTimeout(() => {
					this.handleSelectionChange();
					this.checkAndShowPlusButton();
				}, 100);
			});
		});
		this.editor.addEventListener('keyup', (e) => {
			requestAnimationFrame(() => {
				setTimeout(() => {
					this.handleSelectionChange();
					this.checkAndShowPlusButton();
				}, 50);
			});
		});

		// Handle Enter key to show plus button on new paragraph
		this.editor.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				setTimeout(() => {
					this.checkAndShowPlusButton();
				}, 10);
			}
		});

		// Also listen on mousemove while selecting (for drag selection)
		let isSelecting = false;
		this.editor.addEventListener('mousedown', () => {
			isSelecting = true;
		});
		this.editor.addEventListener('mousemove', () => {
			if (isSelecting) {
				requestAnimationFrame(() => {
					this.handleSelectionChange();
				});
			}
		});
		this.editor.addEventListener('mouseup', () => {
			isSelecting = false;
		});

		// Hide toolbar when clicking outside
		document.addEventListener('mousedown', (e) => {
			if (!this.toolbar.contains(e.target) && !this.editor.contains(e.target)) {
				this.hideToolbar();
			}
			// Hide plus button when clicking outside editor
			if (
				!this.editor.contains(e.target) &&
				!this.plusButton.contains(e.target) &&
				!this.plusMenu.contains(e.target)
			) {
				this.hidePlusButton();
			}
		});

		// Hide toolbar on scroll
		let scrollTimeout;
		window.addEventListener(
			'scroll',
			() => {
				clearTimeout(scrollTimeout);
				scrollTimeout = setTimeout(() => {
					this.hideToolbar();
				}, 100);
			},
			true
		);

		// Handle keyboard shortcuts
		this.editor.addEventListener('keydown', (e) => {
			this.config.buttons.forEach((buttonConfig) => {
				if (buttonConfig.keyboardShortcut) {
					const shortcut = buttonConfig.keyboardShortcut;
					const metaKey = shortcut.metaKey && (e.metaKey || e.ctrlKey);
					const ctrlKey = shortcut.ctrlKey && (e.ctrlKey || e.metaKey);
					const shiftKey = shortcut.shiftKey && e.shiftKey;
					const altKey = shortcut.altKey && e.altKey;

					if (e.key.toLowerCase() === shortcut.key.toLowerCase()) {
						if (metaKey || ctrlKey) {
							if (!shiftKey && !altKey) {
								e.preventDefault();
								buttonConfig.action();
								this.updateButtonStates();
							}
						}
					}
				}
			});
		});
	}

	handleSelectionChange() {
		try {
			const selection = window.getSelection();

			if (!selection || selection.rangeCount === 0) {
				this.hideToolbar();
				return;
			}

			const range = selection.getRangeAt(0);

			if (!range) {
				this.hideToolbar();
				return;
			}

			// Check if selection is collapsed (no text selected)
			if (selection.isCollapsed || range.collapsed) {
				this.hideToolbar();
				return;
			}

			// Check if selection is within the editor
			const container = range.commonAncestorContainer;

			if (!container) {
				this.hideToolbar();
				return;
			}

			// More robust check for editor containment
			let isInEditor = false;

			// Check if the start and end containers are within the editor
			const startContainer = range.startContainer;
			const endContainer = range.endContainer;

			// Helper function to check if a node is in the editor
			const nodeInEditor = (node) => {
				if (!node) return false;
				if (node === this.editor) return true;
				if (node.nodeType === Node.TEXT_NODE) {
					return this.editor.contains(node.parentNode) || node.parentNode === this.editor;
				}
				return this.editor.contains(node);
			};

			isInEditor =
				nodeInEditor(startContainer) || nodeInEditor(endContainer) || nodeInEditor(container);

			if (isInEditor) {
				// Verify the selection actually has content
				const selectedText = range.toString().trim();
				if (selectedText.length > 0) {
					this.showToolbar(range);
					this.updateButtonStates();
					this.hidePlusButton(); // Hide plus button when text is selected
				} else {
					this.hideToolbar();
				}
			} else {
				this.hideToolbar();
			}
		} catch (e) {
			console.error('Error in handleSelectionChange:', e);
			this.hideToolbar();
		}
	}

	showToolbar(range) {
		if (!range || !this.toolbar) {
			return;
		}

		const rect = range.getBoundingClientRect();

		// Ensure toolbar has content before measuring
		if (this.toolbar.children.length === 0) {
			return;
		}

		// Make toolbar visible temporarily to measure it (but keep it visually hidden)
		this.toolbar.style.display = 'flex';
		this.toolbar.style.visibility = 'hidden';
		this.toolbar.style.opacity = '0';
		this.toolbar.style.top = '0';
		this.toolbar.style.left = '0';
		this.toolbar.style.position = 'fixed';

		// Force a reflow to get accurate measurements
		void this.toolbar.offsetHeight;

		const toolbarRect = this.toolbar.getBoundingClientRect();
		const toolbarHeight = toolbarRect.height || 40; // fallback height
		const toolbarWidth = toolbarRect.width || 200; // fallback width

		// Position toolbar above the selection (centered)
		// Using fixed positioning, so use getBoundingClientRect coordinates directly
		let top = rect.top - toolbarHeight - 12;
		let left = rect.left + rect.width / 2 - toolbarWidth / 2;

		// Keep toolbar within viewport
		const padding = 10;
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// Horizontal constraints
		if (left < padding) {
			left = padding;
		} else if (left + toolbarWidth > viewportWidth - padding) {
			left = viewportWidth - toolbarWidth - padding;
		}

		// Vertical constraints - if toolbar would go above viewport, show it below selection
		if (rect.top - toolbarHeight - 12 < padding) {
			top = rect.bottom + 12;
		}

		// Apply position and make visible
		this.toolbar.style.top = `${top}px`;
		this.toolbar.style.left = `${left}px`;
		this.toolbar.style.visibility = 'visible';
		this.toolbar.style.display = 'flex';
		this.toolbar.classList.add('visible');
	}

	hideToolbar() {
		this.toolbar.classList.remove('visible');
		this.toolbar.style.display = 'none';
	}
}

// Initialize the editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	const editor = new InlineRichTextEditor('editor', 'toolbar');

	// Example: You can customize the buttons by passing a config
	// const customEditor = new InlineRichTextEditor('editor', 'toolbar', {
	//     buttons: [
	//         {
	//             type: 'button',
	//             id: 'bold',
	//             label: 'B',
	//             icon: 'bi-type-bold',
	//             tooltip: 'Bold',
	//             action: () => editor.formatText('bold'),
	//             command: 'bold'
	//         }
	//     ]
	// });
});
