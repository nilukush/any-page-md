// PageMD Background Service Worker
// Handles clipboard operations via offscreen document, notifications, and keyboard shortcuts

const API_URL = 'https://pagemd.vercel.app/api/convert';
const OFFSCREEN_DOCUMENT_URL = 'offscreen/offscreen.html';

// Listen for messages from popup and keyboard shortcuts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[PageMD Background] Received message:', message.action);

  switch (message.action) {
    case 'copy':
      copyToClipboard(message.text)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response

    case 'copy-and-notify':
      // Used from popup: copy to clipboard and show notification
      copyAndNotify(message.text);
      sendResponse({ success: true }); // Immediate response, popup will close
      break;

    case 'notify':
      showNotification(message.title, message.message, message.type);
      sendResponse({ success: true });
      break;

    case 'convert':
      convertCurrentTab()
        .then((result) => sendResponse({ success: true, result }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
  }

  return false;
});

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[PageMD Background] Command received:', command);

  if (command === 'convert-page') {
    try {
      await convertCurrentTab();
    } catch (error) {
      console.error('[PageMD Background] Conversion error:', error);
      showNotification('PageMD Error', error.message, 'error');
    }
  }
});

/**
 * Ensures the offscreen document exists for clipboard operations
 * Creates it if it doesn't exist
 */
async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_URL)]
  });

  if (existingContexts.length > 0) {
    console.log('[PageMD Background] Offscreen document already exists');
    return;
  }

  console.log('[PageMD Background] Creating offscreen document');
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_URL,
    reasons: ['CLIPBOARD'],
    justification: 'Clipboard operations require offscreen document in Manifest V3'
  });
}

/**
 * Copy text to clipboard using offscreen document
 * This is the official Chrome pattern for clipboard operations in MV3
 * @param {string} text - The text to copy
 */
async function copyToClipboard(text) {
  if (!text) {
    throw new Error('No text provided to copy');
  }

  console.log('[PageMD Background] Copying text to clipboard via offscreen, length:', text.length);

  // Ensure offscreen document exists
  await ensureOffscreenDocument();

  // Send copy request to offscreen document
  const response = await chrome.runtime.sendMessage({
    action: 'copy-to-clipboard',
    text: text
  });

  if (!response || !response.success) {
    throw new Error(response?.error || 'Failed to copy to clipboard');
  }

  console.log('[PageMD Background] Clipboard operation successful via offscreen');
}

/**
 * Copy text to clipboard and show notification
 * Simplified with offscreen API - no timing/focus issues
 * @param {string} text - The text to copy
 */
async function copyAndNotify(text) {
  try {
    await copyToClipboard(text);
    showNotification('PageMD', 'Markdown copied to clipboard!', 'success');
    console.log('[PageMD Background] Copy-and-notify completed successfully');
  } catch (error) {
    console.error('[PageMD Background] Copy-and-notify failed:', error);
    showNotification('PageMD Error', error.message, 'error');
  }
}

/**
 * Show desktop notification
 */
function showNotification(title, message, type = 'basic') {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: title,
    message: message,
    priority: type === 'error' ? 2 : 1
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('[PageMD Background] Notification error:', chrome.runtime.lastError);
    } else {
      console.log('[PageMD Background] Notification shown:', notificationId);
    }
  });
}

/**
 * Convert current tab to markdown
 */
async function convertCurrentTab() {
  // Get the active tab in the current window
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url) {
    throw new Error('Could not get current page URL');
  }

  const url = tab.url;

  // Check if it's a valid URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Cannot convert this page. Please navigate to a webpage first.');
  }

  console.log('[PageMD Background] Converting:', url);

  // Call the PageMD API
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  if (!data.markdown) {
    throw new Error('No markdown content returned');
  }

  // Copy to clipboard
  await copyToClipboard(data.markdown);

  // Show notification
  showNotification('PageMD', 'Markdown copied to clipboard!', 'success');

  console.log('[PageMD Background] Conversion complete');
}

// Log installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[PageMD Background] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // Show welcome notification on first install
    showNotification(
      'PageMD Installed!',
      'Click the extension icon or press Ctrl+Shift+M to convert any page to markdown.',
      'success'
    );
  }
});
