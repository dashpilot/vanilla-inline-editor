# Vanilla Inline Editor

A lightweight, vanilla JavaScript inline rich text editor with a floating toolbar that appears when text is selected.

## Features

- **Floating Toolbar**: Appears above selected text for quick formatting
- **Text Formatting**: Bold, italic, underline (⌘+B, ⌘+I, ⌘+U)
- **Links**: Insert and edit links with a modal dialog
- **Block Elements**: Insert headings, paragraphs, and images via the plus button
- **Image Upload**: Upload and resize images automatically (uses Pica library)
- **Standalone Image Editor**: Separate `VanillaImage` class for editing layout images (click to replace)
- **Keyboard Shortcuts**: Standard shortcuts for common formatting commands
- **Zero Dependencies**: Pure vanilla JavaScript (uses Bootstrap Icons via CDN)

## Usage

Simply open `index.html` in your browser. The editor is initialized automatically.

### Basic Initialization

The editor can be initialized with ID selectors, class selectors, or an array of selectors:

```javascript
// Toolbar is created dynamically - only editor selector is required
const editor = new VanillaInline('editor');

// Using class selectors
const editor = new VanillaInline('.editor-content');

// Using ID selectors with hash notation
const editor = new VanillaInline('#editor');

// Using an array of selectors for the editor (tries each one until a match is found)
const editor = new VanillaInline(['.editor-content', '#editor', 'editor']);

// Optional: Provide a toolbar selector if you want to use an existing toolbar element
const editor = new VanillaInline('editor', '.custom-toolbar');

// If toolbar selector doesn't exist, it will be created automatically with the specified class/id
const editor = new VanillaInline('editor', '#my-toolbar');
```

### Customization

To customize the editor, pass a configuration object:

```javascript
const editor = new VanillaInline('#editor', null, {
    buttons: [...], // Custom button configuration
    maxImageWidth: 1200 // Maximum image width for resizing
});
```

**Notes**:

- The toolbar selector is **optional**. If not provided or not found, the toolbar will be created dynamically and appended to the document body.
- **Editor elements are automatically configured**: When you provide an editor selector, the editor automatically sets `contentEditable="true"` and `spellcheck="false"` on the matching element(s). You don't need to set these attributes in your HTML.
- When using a **class selector** (starting with `.`), all matching elements will be made editable. The first element will be used as the primary editor for toolbar interactions.
- If you pass a selector without a prefix (`#` for ID or `.` for class), it will first try to find an element by ID, then by class name for backwards compatibility.
- When using an array of selectors, each selector is tried in order until a matching element is found. This is useful for providing fallback selectors.
- The toolbar uses fixed positioning, so it can be placed anywhere in the DOM and will still appear correctly above selected text.

### Standalone Image Editor

For images that are part of the page layout (not within editable text content), use the `VanillaImage` class:

```javascript
// Initialize standalone image editor for layout images
const imageEditor = new VanillaImage('.image');

// Or with custom configuration
const imageEditor = new VanillaImage('.image', {
	maxImageWidth: 1200 // Maximum image width for resizing
});
```

This allows users to click on images to replace them without making the images part of a text editor. Perfect for card images, hero images, or any standalone images in your layout.

**Example**: Combining both editors for a card-based layout:

```javascript
// Text content is editable
const editor = new VanillaInline('.card-content');

// Images are separately editable (click to replace)
const imageEditor = new VanillaImage('.image');
```

## Requirements

- Bootstrap Icons (loaded via CDN)
- Pica library for image resizing (loaded via CDN)
