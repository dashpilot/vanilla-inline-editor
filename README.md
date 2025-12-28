# Vanilla Inline Editor

A lightweight, vanilla JavaScript inline rich text editor with a floating toolbar that appears when text is selected.

## Features

- **Floating Toolbar**: Appears above selected text for quick formatting
- **Text Formatting**: Bold, italic, underline (⌘+B, ⌘+I, ⌘+U)
- **Links**: Insert and edit links with a modal dialog
- **Block Elements**: Insert headings, paragraphs, and images via the plus button
- **Image Upload**: Upload and resize images automatically (uses Pica library)
- **Keyboard Shortcuts**: Standard shortcuts for common formatting commands
- **Zero Dependencies**: Pure vanilla JavaScript (uses Bootstrap Icons via CDN)

## Usage

Simply open `index.html` in your browser. The editor is initialized automatically.

To customize the editor, pass a configuration object:

```javascript
const editor = new InlineRichTextEditor('editor', 'toolbar', {
    buttons: [...], // Custom button configuration
    maxImageWidth: 1200 // Maximum image width for resizing
});
```

## Requirements

- Bootstrap Icons (loaded via CDN)
- Pica library for image resizing (loaded via CDN)
