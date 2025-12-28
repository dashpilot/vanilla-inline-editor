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

### Basic Initialization

The editor can be initialized with ID selectors, class selectors, or an array of selectors:

```javascript
// Toolbar is created dynamically - only editor selector is required
const editor = new InlineRichTextEditor('editor');

// Using class selectors
const editor = new InlineRichTextEditor('.editor-content');

// Using ID selectors with hash notation
const editor = new InlineRichTextEditor('#editor');

// Using an array of selectors for the editor (tries each one until a match is found)
const editor = new InlineRichTextEditor(['.editor-content', '#editor', 'editor']);

// Optional: Provide a toolbar selector if you want to use an existing toolbar element
const editor = new InlineRichTextEditor('editor', '.custom-toolbar');

// If toolbar selector doesn't exist, it will be created automatically with the specified class/id
const editor = new InlineRichTextEditor('editor', '#my-toolbar');
```

### Customization

To customize the editor, pass a configuration object:

```javascript
const editor = new InlineRichTextEditor('#editor', null, {
    buttons: [...], // Custom button configuration
    maxImageWidth: 1200 // Maximum image width for resizing
});
```

**Notes**:

- The toolbar selector is **optional**. If not provided or not found, the toolbar will be created dynamically and appended to the document body.
- If you pass a selector without a prefix (`#` for ID or `.` for class), it will first try to find an element by ID, then by class name for backwards compatibility.
- When using an array of selectors, each selector is tried in order until a matching element is found. This is useful for providing fallback selectors.
- The toolbar uses fixed positioning, so it can be placed anywhere in the DOM and will still appear correctly above selected text.

## Requirements

- Bootstrap Icons (loaded via CDN)
- Pica library for image resizing (loaded via CDN)
