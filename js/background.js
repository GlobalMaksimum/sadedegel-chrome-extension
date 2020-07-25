// Add event listener for browser icon click 
chrome.browserAction.onClicked.addListener(buttonClicked)

function buttonClicked(tab) {
    //send message from background script to content script
    let msg = {
        url: tab.url
    }
    chrome.tabs.sendMessage(tab.id, msg);
}

