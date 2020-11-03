'use strict';

var radiobutton = document.querySelector('div[id=selectarea]');
var isDays = document.querySelector('input[value=isDays]');
var isPercents = document.querySelector('input[value=isPercents]');

chrome.storage.sync.get('isDays', function(settings) {
  isDays.checked = !!settings.isDays;
  document.querySelector('#loading').setAttribute('done', 'true');
});

chrome.storage.sync.get('isPercents', function(settings) {
  isPercents.checked = !!settings.isPercents;
  document.querySelector('#loading').setAttribute('done', 'true');
});

chrome.storage.onChanged.addListener(function(changes) {
  if(changes.isDays){
    isDays.checked = changes.isDays.newValue;
  }
  if(changes.isPercents){
    isPercents.checked = changes.isPercents.newValue;
  }
});

radiobutton.onchange = function() {
  chrome.storage.sync.set({isDays: isDays.checked, isPercents: isPercents.checked});
};
