// PageMD Offscreen Document
// Handles clipboard operations in an offscreen document
// This bypasses the focus requirement for Clipboard API

console.log('[PageMD Offscreen] Document loaded');

// Listen for clipboard copy requests from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[PageMD Offscreen] Received message:', message.action);

  if (message.action === 'copy-to-clipboard') {
    copyToClipboard(message.text)
      .then(() => {
        console.log('[PageMD Offscreen] Copy successful');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[PageMD Offscreen] Copy failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  return false;
});

/**
 * Copy text to clipboard using Clipboard API
 * @param {string} text - The text to copy
 */
async function copyToClipboard(text) {
  if (!text) {
    throw new Error('No text provided to copy');
  }

  console.log('[PageMD Offscreen] Copying text to clipboard, length:', text.length);

  // Method 1: Try modern Clipboard API first
  if (typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('[PageMD Offscreen] Copied using Clipboard API');
      return;
    } catch (error) {
      console.warn('[PageMD Offscreen] Clipboard API failed:', error);
      // Fall through to method 2
    }
  }

  // Method 2: Fallback to execCommand
  await copyUsingExecCommand(text);
}

/**
 * Fallback copy method using document.execCommand
 * @param {string} text - The text to copy
 */
function copyUsingExecCommand(text) {
  console.log('[PageMD Offscreen] Trying execCommand fallback');

  return new Promise((resolve, reject) => {
    // Create a temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);

    // Select and copy
    textarea.focus();
    textarea.select();

    let successful = false;
    try {
      successful = document.execCommand('copy');
      console.log('[PageMD Offscreen] execCommand result:', successful);
    } catch (err) {
      console.error('[PageMD Offscreen] execCommand failed:', err);
    }

    // Clean up
    document.body.removeChild(textarea);

    if (successful) {
      resolve();
    } else {
      reject(new Error('execCommand failed'));
    }
  });
}
