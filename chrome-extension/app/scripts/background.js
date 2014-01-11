'use strict';

chrome.runtime.onInstalled.addListener(function (details) {
    console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(function (tabId) {
  console.info('tab update', tabId);
    chrome.pageAction.show(tabId);
});


console.log('background');