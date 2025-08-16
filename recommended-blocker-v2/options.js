// Elements
const els = {
  keywords: document.getElementById('keywords'),
  hideHighLikeRatio: document.getElementById('hideHighLikeRatio'),
  usePresetAbusive: document.getElementById('usePresetAbusive'),
  usePresetSensitive: document.getElementById('usePresetSensitive'),
  wholeWord: document.getElementById('wholeWord'),
  useRegex: document.getElementById('useRegex'),
  matchHashtags: document.getElementById('matchHashtags'),
  dryRun: document.getElementById('dryRun'),
  save: document.getElementById('save'),
  status: document.getElementById('status'),
  kwCount: document.getElementById('kwCount'),
  toast: document.getElementById('toast')
};

// 既定はすべてOFF
const DEFAULTS = {
  keywords: [],
  hideHighLikeRatio: false,
  usePresetAbusive: false,
  usePresetSensitive: false,
  wholeWord: false,
  useRegex: false,
  matchHashtags: false,
  dryRun: false
};

function showToast(msg='Saved.') {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 1400);
}
function parseKeywords(text){
  return text.split('\n').map(x=>x.trim()).filter(x=>x && !x.startsWith('#'));
}
function updateCount(){ els.kwCount.textContent = parseKeywords(els.keywords.value).length; }

async function restore(){
  const stored = await chrome.storage.sync.get({ muteConfig: DEFAULTS });
  const cfg = { ...DEFAULTS, ...(stored.muteConfig || {}) };

  els.keywords.value = Array.isArray(cfg.keywords) ? cfg.keywords.join('\n') : '';
  els.hideHighLikeRatio.checked = !!cfg.hideHighLikeRatio;
  els.usePresetAbusive.checked = !!cfg.usePresetAbusive;
  els.usePresetSensitive.checked = !!cfg.usePresetSensitive;
  els.wholeWord.checked = !!cfg.wholeWord;
  els.useRegex.checked = !!cfg.useRegex;
  els.matchHashtags.checked = !!cfg.matchHashtags;
  els.dryRun.checked = !!cfg.dryRun;

  updateCount();
}

async function save(){
  const muteConfig = {
    keywords: parseKeywords(els.keywords.value),
    hideHighLikeRatio: els.hideHighLikeRatio.checked,
    usePresetAbusive: els.usePresetAbusive.checked,
    usePresetSensitive: els.usePresetSensitive.checked,
    wholeWord: els.wholeWord.checked,
    useRegex: els.useRegex.checked,
    matchHashtags: els.matchHashtags.checked,
    dryRun: els.dryRun.checked
  };
  await chrome.storage.sync.set({ muteConfig });
  showToast('保存しました');
}

document.addEventListener('DOMContentLoaded', restore);
els.save.addEventListener('click', save);
els.keywords.addEventListener('input', updateCount);
