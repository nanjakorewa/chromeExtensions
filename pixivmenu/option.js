'use strict';
var optionSettingArea = document.querySelector('div[id=settingoption]');
var useWhiteColor = document.querySelector('input[value=useWhiteColor]');
var listInline = document.querySelector('input[value=listInline]');
var areaType = document.querySelector('div[id=areatype]');

// load setting
areaType.onchange = function() {
  chrome.storage.sync.set({
    areaType: document.querySelector('input[name="areatype"]:checked').value,
  });
};
optionSettingArea.onchange = function() {
  chrome.storage.sync.set({
    useWhiteColor: useWhiteColor.checked,
    listInline: listInline.checked,
  });
};

// chrome.storage.sync.get
chrome.storage.sync.get('areaType', function(settings) {
  var checkedValue = settings.areaType;
  document.querySelector('input[value="'+checkedValue+'"]').checked = true;
});
chrome.storage.sync.get('useWhiteColor', function(settings) {
  useWhiteColor.checked = !!settings.useWhiteColor;
});
chrome.storage.sync.get('listInline', function(settings) {
  listInline.checked = !!settings.listInline;
});