'use strict';
var optionSettingArea = document.querySelector('div[id=settingoption]');
var useWhiteColor = document.querySelector('input[value=useWhiteColor]');
var listInline = document.querySelector('input[value=listInline]');
var areaType = document.querySelector('div[id=areatype]');
var kibsType = document.querySelector('div[id=kibsType]');
var userId = document.querySelector('input[name=userid]');

// load setting
areaType.onchange = function() {
  chrome.storage.sync.set({
    areaType: document.querySelector('input[name="areatype"]:checked').value,
  });
};
optionSettingArea.onchange = function() {
  chrome.storage.sync.set({
    useWhiteColor: useWhiteColor.checked,
  });
};
userId.onchange = function() {
  chrome.storage.sync.set({
    userId: userId.value,
  });
};

// chrome.storage.sync.get
chrome.storage.sync.get('useWhiteColor', function(settings) {
  useWhiteColor.checked = !!settings.useWhiteColor;
});
chrome.storage.sync.get('areaType', function(settings) {
  var checkedValue = settings.areaType;
  if(checkedValue)
    document.querySelector('input[value="'+checkedValue+'"]').checked = true;
});
chrome.storage.sync.get('userId', function(settings) {
  userId.value = settings.userId;
});