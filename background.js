// background.js - Service Worker for Logic Builder Coach Extension

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Logic Builder Coach installed');
    
    // Set default settings
    chrome.storage.sync.set({
      theme: 'light',
      autoDetect: true,
      showHints: true,
      apiKey: '',
      visitedProblems: []
    });
  } else if (details.reason === 'update') {
    console.log('Logic Builder Coach updated');
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.action === 'problemDetected') {
    // Store the current problem in local storage
    chrome.storage.local.set({
      currentProblem: message.problem,
      tabId: sender.tab.id
    });
    
    // Update extension badge
    chrome.action.setBadgeText({
      text: '!',
      tabId: sender.tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#00ff88',
      tabId: sender.tab.id
    });
    
    console.log('Problem stored:', message.problem.title);
  }
  
  return true; // Keep message channel open for async response
});

// Clear badge when tab is updated (navigated away)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({
      text: '',
      tabId: tabId
    });
    
    // Clear stored problem for this tab
    chrome.storage.local.remove(['currentProblem', 'selectedText']);
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  // Clean up any stored data for the closed tab
  chrome.storage.local.get(['tabId'], (data) => {
    if (data.tabId === tabId) {
      chrome.storage.local.remove(['currentProblem', 'selectedText', 'tabId']);
    }
  });
});

// Context menu for selected text analysis (optional feature)
chrome.contextMenus.create({
  id: 'analyzeSelectedText',
  title: 'Analyze with Logic Coach',
  contexts: ['selection'],
  documentUrlPatterns: [
    '*://leetcode.com/*',
    '*://www.leetcode.com/*',
    '*://www.geeksforgeeks.org/*',
    '*://www.hackerrank.com/*',
    '*://codeforces.com/*',
    '*://www.codechef.com/*'
  ]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeSelectedText') {
    // Store selected text for analysis
    chrome.storage.local.set({
      selectedText: info.selectionText,
      tabId: tab.id
    });
    
    // Update badge to indicate text selected
    chrome.action.setBadgeText({
      text: 'T',
      tabId: tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#4ECDC4',
      tabId: tab.id
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will be handled by the popup, but we can add logic here if needed
  console.log('Extension icon clicked on tab:', tab.id);
});