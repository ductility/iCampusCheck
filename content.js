var getCookie = function(name) {
    var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return value? value[2] : null;
};
console.log("getcookie ok");
chrome.storage.sync.get('autofill', data => {
    if (data.autofill) {
      const el = document.querySelector('input[name=q]');
      if (el) el.value = data.autofill;
    }
  });