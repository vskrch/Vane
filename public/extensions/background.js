// Perplexica Chrome Extension Background Script
chrome.runtime.onInstalled.addListener(() => {
  console.log('Perplexica extension installed');
});

// Add context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'searchWithPerplexica',
    title: 'Search with Perplexica',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'searchWithPerplexica') {
    const query = encodeURIComponent(info.selectionText);
    chrome.tabs.create({
      url: `https://perplexica-9d84002fd261.herokuapp.com/search?q=${query}`
    });
  }
});
