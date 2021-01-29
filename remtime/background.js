'use strict';

function createIcon(hours, fontColor) {
  function createCanvas(iconsize, fontColor) {
    // 時間表示領域のサイズ
    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', iconsize);
    canvas.setAttribute('height', iconsize);

    // 残り時間の設定
    var context = canvas.getContext('2d');
    context.font = 'bold ' + (iconsize * 0.7) + 'px \'Meirio\', \'Ubuntu\', \'Lucida Grande\',';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = fontColor;
    context.fillText(hours, iconsize/2, iconsize/3);
    return context.getImageData(0, 0, iconsize, iconsize);
  }
  return {16: createCanvas(16, fontColor), 48: createCanvas(48, fontColor)};
}

function update() {
  var oneDay = 1000 * 60 * 60 * 24;
  var fontColor = "black";
  var diffTime = 0;

  // 時間差の計算
  chrome.storage.sync.get(['calcFromDay', 'calcBaseDay'], function(settings) {
    if(settings.calcFromDay){
      // カレンダーから指定
      var dayfrom = new Date();
      var dayto = new Date(settings.calcBaseDay);
      if(!isNaN(dayto)) diffTime = dayto - dayfrom + oneDay;
    }
    else {
      // 年末までの日時を求める
      var dayfrom = new Date();
      var dayto = new Date(dayfrom.getFullYear()+1, 0, 1);
      diffTime = dayto - dayfrom;
    };
  });
  // 背景色の設定
  chrome.browserAction.setBadgeBackgroundColor({color: '#222'});
  // 文字色の設定
  chrome.storage.sync.get('useWhiteColor', function(settings) {
    if(settings.useWhiteColor) fontColor = "white";
  });
  // 残り％が選択されている時
  chrome.storage.sync.get('isPercents', function(settings) {
    if(settings.isPercents) {
      var diff = Math.floor((diffTime / oneDay) * 100.0 / 365.0);
      var timeUnit = "%";
      if(diff < 0){
        diff = -1 * diff;
        chrome.browserAction.setBadgeText({text: String(timeUnit) + "経過"});
      }
      else {
        chrome.browserAction.setBadgeText({text: "残" + String(timeUnit)});
      }
      chrome.browserAction.setIcon({imageData: createIcon(diff, fontColor)});
    }
  });
  // 残り日数が選択されている時
  chrome.storage.sync.get('isDays', function(settings) {
    if(settings.isDays) {
      var diff = Math.floor((diffTime / oneDay));
      var timeUnit = "日";
      if(diff < 0){
        diff = -1 * diff;
        chrome.browserAction.setBadgeText({text: String(timeUnit) + "経過"});
      }
      else {
        chrome.browserAction.setBadgeText({text: "残" + String(timeUnit)});
      }
      chrome.browserAction.setIcon({imageData: createIcon(diff, fontColor)});
    }
  });
  // 残り時間が選択されている時
  chrome.storage.sync.get('isWeeks', function(settings) {
    if(settings.isWeeks) {
      var diff = Math.floor((diffTime / oneDay) / 7);
      var timeUnit = "週";
      if(diff < 0){
        diff = -1 * diff;
        chrome.browserAction.setBadgeText({text: String(timeUnit) + "経過"});
      }
      else {
        chrome.browserAction.setBadgeText({text: "残" + String(timeUnit)});
      }
      chrome.browserAction.setIcon({imageData: createIcon(diff, fontColor)});
    }
  });
}

chrome.runtime.onInstalled.addListener(function() {
  update();
  chrome.alarms.create({
    periodInMinutes: 1 //何分ごとに更新を行うか
  });
});

chrome.alarms.onAlarm.addListener(update);
chrome.browserAction.onClicked.addListener(update);
chrome.runtime.onStartup.addListener(update);
chrome.storage.onChanged.addListener(update);
