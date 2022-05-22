document.querySelector('#right').onclick = () => {
    chrome.storage.sync.set({autofill: 'right'}, () => {
      chrome.tabs.create({url: 'options.html'});
    });
  };