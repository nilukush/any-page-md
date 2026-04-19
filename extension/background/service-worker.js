// PageMD Background Service Worker
// Handles clipboard operations, notifications, and keyboard shortcuts

const API_URL = 'https://pagemd.vercel.app/api/convert';

// Listen for messages from popup and keyboard shortcuts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[PageMD Background] Received message:', message.action);

  switch (message.action) {
    case 'copy':
      copyToClipboard(message.text)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response

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

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    // Use the Clipboard API
    await navigator.clipboard.writeText(text);
    console.log('[PageMD Background] Copied to clipboard');
  } catch (error) {
    console.error('[PageMD Background] Clipboard error:', error);

    // Fallback: Create a temporary text area
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      console.log('[PageMD Background] Copied using fallback method');
    } catch (fallbackError) {
      throw new Error('Failed to copy to clipboard');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Show desktop notification
function showNotification(title, message, type = 'basic') {
  const options = {
    type: 'basic',
    iconUrl: type === 'success' ? '/icons/icon128.png' : '/icons/icon128.png',
    title: title,
    message: message,
    priority: type === 'error' ? 2 : 1
  };

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

// Convert current tab to markdown
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
