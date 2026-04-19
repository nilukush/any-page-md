// PageMD Popup Script
// Handles UI interactions and communicates with background service worker

const API_URL = 'https://pagemd.vercel.app/api/convert';

// DOM elements
const urlText = document.getElementById('urlText');
const convertBtn = document.getElementById('convertBtn');
const status = document.getElementById('status');

// Get current tab URL on load
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentUrl = tabs[0]?.url || 'Unknown';
  urlText.textContent = currentUrl;
  urlText.title = currentUrl;
});

// Handle convert button click
convertBtn.addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tabs[0]?.url;

  if (!currentUrl) {
    showError('Could not get current page URL');
    return;
  }

  // Check if it's a valid URL
  if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
    showError('Cannot convert this page. Please navigate to a webpage first.');
    return;
  }

  await convertPage(currentUrl);
});

// Convert page to markdown
async function convertPage(url) {
  setLoading(true);
  clearStatus();

  try {
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

    // Copy to clipboard via messaging to service worker
    await chrome.runtime.sendMessage({
      action: 'copy',
      text: data.markdown
    });

    showSuccess('Markdown copied to clipboard!');

    // Show notification
    await chrome.runtime.sendMessage({
      action: 'notify',
      title: 'PageMD',
      message: 'Markdown copied to clipboard!',
      type: 'success'
    });

  } catch (error) {
    console.error('[PageMD] Conversion error:', error);
    showError(error.message || 'Failed to convert page');

    await chrome.runtime.sendMessage({
      action: 'notify',
      title: 'PageMD Error',
      message: error.message || 'Failed to convert page',
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
}

// UI helper functions
function setLoading(isLoading) {
  convertBtn.disabled = isLoading;
  if (isLoading) {
    convertBtn.textContent = 'Converting...';
    status.className = 'status loading';
    status.textContent = 'Fetching page...';
    // Add spinner element
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    status.prepend(spinner);
  } else {
    convertBtn.textContent = 'Convert to Markdown';
  }
}

function showSuccess(message) {
  status.className = 'status success';
  status.textContent = message;
}

function showError(message) {
  status.className = 'status error';
  status.textContent = message;
}

function clearStatus() {
  status.className = 'status';
  status.textContent = '';
}
