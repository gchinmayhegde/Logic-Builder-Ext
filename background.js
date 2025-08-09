// Service Worker for Logic Builder Coach Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Logic Builder Coach installed');
  
  // Initialize storage with default settings
  chrome.storage.sync.set({
    theme: 'light',
    autoDetect: true,
    showHints: true,
    apiKey: '',
    visitedProblems: []
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'problemDetected') {
    // Store the detected problem
    chrome.storage.local.set({
      currentProblem: request.problem,
      currentUrl: sender.tab.url,
      timestamp: Date.now()
    });
    
    // Update badge to show problem detected
    chrome.action.setBadgeText({
      text: '!',
      tabId: sender.tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#4CAF50',
      tabId: sender.tab.id
    });
    
    sendResponse({status: 'success'});
  }
  
  if (request.action === 'clearBadge') {
    chrome.action.setBadgeText({
      text: '',
      tabId: sender.tab.id
    });
  }
  
  return true; // Keep message channel open for async response
});

// Handle tab updates to clear badge when navigating away
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const supportedSites = [
      'leetcode.com',
      'geeksforgeeks.org',
      'hackerrank.com',
      'codeforces.com',
      'codechef.com'
    ];
    
    const isSupported = supportedSites.some(site => 
      tab.url && tab.url.includes(site)
    );
    
    if (!isSupported) {
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
    }
  }
});

// Context menu for manual problem selection
chrome.contextMenus.create({
  id: 'analyzeSelection',
  title: 'Analyze with Logic Builder Coach',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeSelection') {
    chrome.storage.local.set({
      selectedText: info.selectionText,
      currentUrl: tab.url,
      timestamp: Date.now()
    });
    
    chrome.action.setBadgeText({
      text: '✓',
      tabId: tab.id
    });
  }
});