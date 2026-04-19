# PageMD Browser Extension

Convert any webpage to clean, AI-friendly markdown with one click.

## Features

- 🎯 **One-click conversion** — Click the extension icon or press `Ctrl+Shift+M`
- 📋 **Auto-copy to clipboard** — Markdown is automatically copied for easy pasting
- 🔔 **Desktop notifications** — Get confirmation when conversion succeeds
- ⚡ **Keyboard shortcut** — `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac)

## Installation

### Method 1: Load Unpacked (Development)

1. **Generate icon PNG files:**
   - Open `extension/icons/convert.html` in your browser
   - Click "Render & Download PNG" for each icon size (16, 48, 128)
   - Place the downloaded files in `extension/icons/` directory

2. **Load the extension in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension/` directory

3. **Load the extension in Firefox:**
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `extension/manifest.json` file

### Method 2: Chrome Web Store (Coming Soon)

The extension will be published to the Chrome Web Store for easy installation.

## Usage

### Popup Method
1. Navigate to any webpage you want to convert
2. Click the PageMD extension icon in your browser toolbar
3. Click the "Convert to Markdown" button
4. The markdown is automatically copied to your clipboard!

### Keyboard Shortcut
1. Navigate to any webpage you want to convert
2. Press `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac)
3. The markdown is automatically copied to your clipboard!

## Development

### Project Structure

```
extension/
├── manifest.json              # Extension configuration (Manifest V3)
├── popup/
│   ├── index.html            # Popup UI
│   └── index.js              # Popup logic
├── background/
│   └── service-worker.js     # Background service worker
├── icons/
│   ├── convert.html          # Icon converter tool
│   ├── icon16.svg            # 16x16 icon (SVG source)
│   ├── icon48.svg            # 48x48 icon (SVG source)
│   └── icon128.svg           # 128x128 icon (SVG source)
└── README.md                 # This file
```

### Building Icons

The extension requires PNG icons. Use the included converter:

1. Open `extension/icons/convert.html` in a browser
2. Click "Render & Download PNG" for each size
3. Place the PNGs in the `icons/` directory

### Testing

1. Load the unpacked extension
2. Navigate to a test article (e.g., https://example.com)
3. Click the extension icon or press `Ctrl+Shift+M`
4. Verify the markdown is copied to your clipboard
5. Paste into a text editor or Claude chat to verify

## Permissions

The extension requests the following permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Get the URL of the current tab |
| `clipboardWrite` | Copy markdown to clipboard |
| `notifications` | Show success/error notifications |
| `https://pagemd.vercel.app/*` | Access the PageMD API |

## API

The extension uses the PageMD API:

```
POST https://pagemd.vercel.app/api/convert
Content-Type: application/json

{
  "url": "https://example.com/article"
}

Response:
{
  "markdown": "# Article Title\n\nContent...",
  "meta": {
    "title": "Article Title",
    "url": "https://example.com/article",
    "wordCount": 542,
    "excerpt": "A brief excerpt...",
    "extractionTime": "2026-04-19T12:30:00Z"
  }
}
```

## Troubleshooting

### Extension won't load
- Make sure all icon PNG files exist in `icons/` directory
- Check for any syntax errors in JavaScript files
- Check the Chrome Extensions page for error messages

### Conversion fails
- Check that you're on a valid webpage (http:// or https://)
- Check that `https://pagemd.vercel.app` is accessible
- Open the browser console for error messages

### Keyboard shortcut doesn't work
- Check that the shortcut isn't conflicting with other extensions
- Customize the shortcut in `chrome://extensions/shortcuts`

## License

MIT

## Links

- **Production API:** https://pagemd.vercel.app
- **GitHub:** https://github.com/nilukush/any-page-md
