chrome.action.onClicked.addListener((tab) => {
  // Evita tentar injetar em páginas internas do Chrome (ex: chrome://extensions)
  if (!tab.url || tab.url.startsWith("chrome://")) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});
