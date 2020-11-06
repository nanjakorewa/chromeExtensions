'use strict';
var optionSettingArea = document.querySelector('div[id=settingoption]');
var useWhiteColor = document.querySelector('input[value=useWhiteColor]');
var listInline = document.querySelector('input[value=listInline]');

chrome.storage.sync.get('useWhiteColor', function(settings) {
  useWhiteColor.checked = !!settings.useWhiteColor;
});
chrome.storage.sync.get('listInline', function(settings) {
  listInline.checked = !!settings.listInline;
});

optionSettingArea.onchange = function() {
  chrome.storage.sync.set({
    useWhiteColor: useWhiteColor.checked,
    listInline: listInline.checked,
  });
};