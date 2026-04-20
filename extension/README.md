# PageMD Browser Extension

Convert any webpage to clean, AI-friendly markdown with one click.

## Features

- 🎯 **One-click conversion** — Click the extension icon or press `Ctrl+Shift+M`
- 📋 **Auto-copy to clipboard** — Markdown is automatically copied for easy pasting
- 🔔 **Desktop notifications** — Get confirmation when conversion succeeds
- ⚡ **Keyboard shortcut** — `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac)

## Installation

### Method 1: Load Unpacked (Development)

1. **Load the extension in Chrome/Vivaldi:**
   - Navigate to `chrome://extensions/` (or `vivaldi://extensions/`)
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension/` directory

2. **Pin the extension (optional):**
   - Click the puzzle piece icon in the toolbar
   - Find PageMD and click the pin icon

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

## Architecture (Manifest V3)

The extension uses Chrome's **Offscreen API** for clipboard operations. Service workers cannot access `navigator.clipboard` or DOM, so we create a hidden offscreen document that has full clipboard access.

```
┌───────────────────────────────────────────────────────────────────┐
│                         EXTENSION FLOW                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Popup/Keyboard         Service Worker      Offscreen Document   │
│       │                        │                    │            │
│       │  1. Fetch API          │                    │            │
│       │───────────────────────>│                    │            │
│       │  2. Return markdown    │                    │            │
│       │<───────────────────────│                    │            │
│       │                        │                    │            │
│       │  3. Send copy command  │ 4. Ensure exists   │            │
│       │───────────────────────>│───────────────────>│ 5. Copy   │
│       │                        │                    │ to clip    │
│       │  6. Success            │<───────────────────│            │
│       │<───────────────────────│                    │            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Why Offscreen API?**
- No focus requirement (unlike script injection)
- No timing race conditions
- Works reliably without active tab dependencies
- Official Chrome pattern for MV3 clipboard operations

## Development

### Project Structure

```
extension/
├── manifest.json              # Extension configuration (Manifest V3)
├── popup/
│   ├── index.html            # Popup UI
│   └── index.js              # Popup logic (API fetch, response validation)
├── background/
│   └── service-worker.js     # Service worker (offscreen API lifecycle)
├── offscreen/
│   ├── offscreen.html        # Hidden document for clipboard access
│   └── offscreen.js          # Clipboard handler (DOM access)
├── icons/
│   ├── convert.html          # Icon converter tool
│   ├── icon16.svg            # 16x16 icon (SVG source)
│   ├── icon48.svg            # 48x48 icon (SVG source)
│   └── icon128.svg           # 128x128 icon (SVG source)
└── README.md                 # This file
```

### Testing

1. Load the unpacked extension
2. Navigate to a test article (e.g., https://example.com)
3. Click the extension icon or press `Ctrl+Shift+M`
4. Verify the markdown is copied to your clipboard
5. Paste into a text editor or Joplin to verify

### Debugging

**To view extension console:**
1. Go to `chrome://extensions/` or `vivaldi://extensions/`
2. Find PageMD extension
3. Click "service worker" to view background script logs
4. For page context logs: Press F12 on the webpage being converted

**Expected console output:**

*Service Worker Console:*
```
[PageMD Background] Creating offscreen document
[PageMD Background] Copying text to clipboard via offscreen, length: XXXX
[PageMD Background] Clipboard operation successful via offscreen
```

*Offscreen Document (check chrome://extensions → service worker → offscreen):*
```
[PageMD Offscreen] Document loaded
[PageMD Offscreen] Received message: copy-to-clipboard
[PageMD Offscreen] Copied using Clipboard API
```

**Common issues:**
- Copy fails silently → Check service worker console for errors
- Offscreen document creation fails → Reload the extension

## Permissions

The extension requests the following permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab URL |
| `offscreen` | Create hidden document for clipboard operations |
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

### Clipboard not working
- **Reload the extension** after code changes (click reload icon in extensions page)
- Check that you're on a valid webpage (http:// or https://, not chrome:// or about:)
- Open the page console (F12) to see clipboard operation logs
- Try the keyboard shortcut `Ctrl+Shift+M` as an alternative

### Conversion fails
- Check that you're on a valid webpage (http:// or https://)
- Check that `https://pagemd.vercel.app` is accessible
- Open the browser console for error messages

### Keyboard shortcut doesn't work
- Check that the shortcut isn't conflicting with other extensions
- Customize the shortcut in `chrome://extensions/shortcuts`

### Icon not visible in toolbar (Vivaldi/Edge)
- Click the puzzle piece icon in the toolbar
- Find PageMD and click "Pin to toolbar"
- The keyboard shortcut will work even if icon is hidden

## License

MIT

## Links

- **Production API:** https://pagemd.vercel.app
- **GitHub:** https://github.com/nilukush/any-page-md
