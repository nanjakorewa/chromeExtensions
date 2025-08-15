'use strict';

const $ = (id) => document.getElementById(id);

function setToggle(el, on) {
  el.classList.toggle('on', !!on);
  el.dataset.value = on ? '1' : '0';
}
function getToggle(el) { return el.dataset.value === '1'; }

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(
    ['overlayEnabled','overlayPosition','isPercents','isDays','isWeeks'],
    (s) => {
      setToggle($('overlayEnabled'), !!s.overlayEnabled);
      $('overlayPosition').value = s.overlayPosition || 'top';
      $('isPercents').checked = !!s.isPercents;
      $('isDays').checked = (s.isDays ?? true);
      $('isWeeks').checked = !!s.isWeeks;
    }
  );

  $('overlayEnabled').addEventListener('click', () => {
    const on = !getToggle($('overlayEnabled'));
    setToggle($('overlayEnabled'), on);
    chrome.storage.sync.set({ overlayEnabled: on });
  });

  $('overlayPosition').addEventListener('change', (e) => {
    chrome.storage.sync.set({ overlayPosition: e.target.value });
  });

  ['isPercents','isDays','isWeeks'].forEach(id => {
    $(id).addEventListener('change', () => {
      chrome.storage.sync.set({
        isPercents: $('isPercents').checked,
        isDays: $('isDays').checked,
        isWeeks: $('isWeeks').checked,
      });
    });
  });

  $('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
