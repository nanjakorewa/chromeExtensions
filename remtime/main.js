'use strict';
// ----------------------------------------
var radioSelectType = document.querySelector('div[id=selectarea]');
var optionSettingArea = document.querySelector('div[id=settingoption]');
var cldArea = document.querySelector('input[type=date]');

var isDays = document.querySelector('input[value=isDays]');
var isPercents = document.querySelector('input[value=isPercents]');
var isWeeks = document.querySelector('input[value=isWeeks]');
var useWhiteColor = document.querySelector('input[value=useWhiteColor]');
var calcFromDay = document.querySelector('input[value=calcFromDay]');
// ----------------------------------------
chrome.storage.sync.get('isDays', function(settings) {
  isDays.checked = !!settings.isDays;
  document.querySelector('#loading').setAttribute('done', 'true');
});
chrome.storage.sync.get('isPercents', function(settings) {
  isPercents.checked = !!settings.isPercents;
  document.querySelector('#loading').setAttribute('done', 'true');
});
chrome.storage.sync.get('isWeeks', function(settings) {
  isWeeks.checked = !!settings.isWeeks;
  document.querySelector('#loading').setAttribute('done', 'true');
});
chrome.storage.sync.get('useWhiteColor', function(settings) {
  useWhiteColor.checked = !!settings.useWhiteColor;
  document.querySelector('#loading').setAttribute('done', 'true');
});
chrome.storage.sync.get('calcFromDay', function(settings) {
  calcFromDay.checked = !!settings.calcFromDay;
  document.querySelector('#loading').setAttribute('done', 'true');
});
chrome.storage.sync.get('calcBaseDay', function(settings) {
  cldArea.value = settings.calcBaseDay;
});

chrome.storage.onChanged.addListener(function(changes) {
  if(changes.isDays){
    isDays.checked = changes.isDays.newValue;
  }
  if(changes.isPercents){
    isPercents.checked = changes.isPercents.newValue;
  }
  if(changes.isWeeks){
    isWeeks.checked = changes.isWeeks.newValue;
  }
  if(changes.useWhiteColor){
    useWhiteColor.checked = changes.useWhiteColor.newValue;
  }
  if(changes.calcFromDay){
    calcFromDay.checked = changes.calcFromDay.newValue;
  }
});
// ----------------------------------------
radioSelectType.onchange = function() {
  chrome.storage.sync.set({
    isDays: isDays.checked,
    isPercents: isPercents.checked,
    isWeeks: isWeeks.checked,
  });
};
optionSettingArea.onchange = function() {
  chrome.storage.sync.set({
    useWhiteColor: useWhiteColor.checked,
    calcFromDay: calcFromDay.checked,
    calcBaseDay: document.querySelector('input[type="date"]').value,
  });
};