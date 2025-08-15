'use strict';

// ===== Schema (default settings) =====
const schema = {
  // Units
  isPercents: false,
  isDays: true,
  isWeeks: false,

  // Base
  calcFromDay: false,
  calcBaseDay: null,

  // Icon (badge)
  useWhiteColor: false,

  // Overlay
  overlayEnabled: false,
  overlayPosition: 'top',   // 'top' | 'bottom'
  overlaySize: 'm',         // 's' | 'm' | 'l'
  overlayTheme: 'system',   // 'light' | 'dark' | 'system'
  overlayOpacity: 1,
  overlayClickAction: 'none', // kept for compatibility, not used
  hideOnDomains: '',

  // New: D日 HH:MM:SS
  overlayShowHMS: false
};

// ===== Helpers =====
const $ = (id) => document.getElementById(id);
const toggles = [
  'isPercents',
  'isDays',
  'isWeeks',
  'calcFromDay',
  'useWhiteColor',
  'overlayEnabled',
  'overlayShowHMS'
];

function setToggle(id, on) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle('on', !!on);
  el.dataset.value = on ? '1' : '0';
}
function getToggle(id) {
  const el = $(id);
  return el ? (el.dataset.value === '1') : false;
}

// ===== Load/Save =====
function load() {
  chrome.storage.sync.get(Object.keys(schema), (items) => {
    const s = Object.assign({}, schema, items || {});
    toggles.forEach(t => setToggle(t, !!s[t]));

    $('calcBaseDay').value = s.calcBaseDay ? String(s.calcBaseDay).slice(0,10) : '';

    $('overlayPosition').value = s.overlayPosition;
    $('overlaySize').value = s.overlaySize;
    $('overlayTheme').value = s.overlayTheme;
    $('overlayOpacity').value = s.overlayOpacity;
    $('hideOnDomains').value = s.hideOnDomains || '';
  });
}

function save() {
  const payload = {
    isPercents: getToggle('isPercents'),
    isDays: getToggle('isDays'),
    isWeeks: getToggle('isWeeks'),

    calcFromDay: getToggle('calcFromDay'),
    calcBaseDay: $('calcBaseDay').value || null,

    useWhiteColor: getToggle('useWhiteColor'),

    overlayEnabled: getToggle('overlayEnabled'),
    overlayPosition: $('overlayPosition').value,
    overlaySize: $('overlaySize').value,
    overlayTheme: $('overlayTheme').value,
    overlayOpacity: Number($('overlayOpacity').value),
    overlayClickAction: 'none',
    hideOnDomains: $('hideOnDomains').value,

    overlayShowHMS: getToggle('overlayShowHMS')
  };

  chrome.storage.sync.set(payload);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  // Toggle clicks
  toggles.forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('click', () => {
      setToggle(id, !getToggle(id));
      // Instant save for immediate feedback
      save();
    });
  });

  // Buttons
  $('save').addEventListener('click', save);
  $('reset').addEventListener('click', () => {
    chrome.storage.sync.set(schema, load);
  });

  // Instant save on inputs
  ['calcBaseDay','overlayPosition','overlaySize','overlayTheme','overlayOpacity','hideOnDomains']
    .forEach(id => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', save);
      el.addEventListener('change', save);
    });

  load();
});
