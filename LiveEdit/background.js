// Listens for the extension icon click and sends a toggle command to the active tab
chrome.action.onClicked.addListener((tab) => {
  // Ensure we don't try to inject into restricted chrome:// pages
  if (tab.url && !tab.url.startsWith("chrome://")) {
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_EDIT_MODE" }).catch(() => {
      // If the content script isn't ready, inject it dynamically
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      }, () => {
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_EDIT_MODE" });
      });
    });
  }
});