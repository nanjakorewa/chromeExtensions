(() => {
  'use strict';

  const oneDayMs = 1000 * 60 * 60 * 24;

  const defaults = {
    // Overlay core
    overlayEnabled: false,
    overlayPosition: 'top',       // 'top' | 'bottom'
    overlaySize: 'm',             // 's' | 'm' | 'l'
    overlayTheme: 'system',       // 'light' | 'dark' | 'system'
    overlayOpacity: 1,
    hideOnDomains: '',

    // Units
    isPercents: false,
    isDays: true,
    isWeeks: false,

    // Base date
    calcFromDay: false,
    calcBaseDay: null,

    // Modes
    overlayShowHMS: false         // If true, show timer every second
  };

  const state = { ...defaults };

  const rootId = '__leftdays-root';
  let root, wrap, bar;
  let chipLabelDays, chipTimer, chipDays, chipWeeks, chipPerc;
  let sepA, sepB;
  let timerId = null;

  function getDomain(url) {
    try { return new URL(url).hostname; } catch { return location.hostname; }
  }

  function domainIsHidden(domain, patterns) {
    const list = (patterns || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!list.length) return false;
    return list.some(p => {
      if (p.startsWith('*.')) {
        const base = p.slice(2);
        return domain === base || domain.endsWith('.' + base);
      }
      return domain === p;
    });
  }

  function ensureRoot() {
    if (document.getElementById(rootId)) return;

    root = document.createElement('div');
    root.id = rootId;
    root.className = '__leftdays-root __pos-top';

    wrap = document.createElement('div');
    wrap.className = '__leftdays-wrap';

    bar = document.createElement('div');
    bar.className = '__leftdays-bar';
    bar.style.position = 'relative';

    // NEW: single-line label for destination
    chipLabelDays = document.createElement('div');
    chipLabelDays.className = '__leftdays-chip __label';
    chipLabelDays.innerHTML = `<span class="__num" data-role="label-days">—</span>`;

    // HMS timer: "D日 HH:MM:SS"
    chipTimer = document.createElement('div');
    chipTimer.className = '__leftdays-chip __timer';
    chipTimer.innerHTML = `<span class="__num" data-role="timer">--日 --:--:--</span>`;

    // Original unit chips (fallback when Days is OFF)
    chipDays  = document.createElement('div');
    chipDays.className = '__leftdays-chip';
    chipDays.innerHTML = `<span class="__num" data-role="num-days">--</span><span class="__unit">日</span>`;

    chipWeeks = document.createElement('div');
    chipWeeks.className = '__leftdays-chip';
    chipWeeks.innerHTML = `<span class="__num" data-role="num-weeks">--</span><span class="__unit">週</span>`;

    chipPerc  = document.createElement('div');
    chipPerc.className = '__leftdays-chip';
    chipPerc.innerHTML = `<span class="__num" data-role="num-perc">--</span><span class="__unit">％</span>`;

    sepA = document.createElement('div'); sepA.className = '__sep';
    sepB = document.createElement('div'); sepB.className = '__sep';

    // Hide button only
    const hideBtn = document.createElement('button');
    hideBtn.className = '__leftdays-btn __leftdays-hide';
    hideBtn.title = 'このドメインで非表示';
    hideBtn.textContent = 'かくす';
    hideBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const domain = getDomain(location.href);
      const list = (state.hideOnDomains || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!list.includes(domain)) list.push(domain);
      chrome.storage.sync.set({ hideOnDomains: list.join(', ') });
    });

    // Order: Label  |  Timer  |  (Days/Weeks/% fallback)  | Hide
    bar.append(chipLabelDays, sepA, chipTimer, sepB, chipDays, chipWeeks, chipPerc, hideBtn);
    wrap.append(bar);
    root.append(wrap);
    document.documentElement.append(root);
  }

  function applyTheme() {
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = state.overlayTheme === 'system' ? (sysDark ? 'dark' : 'light') : state.overlayTheme;
    root.classList.toggle('__leftdays-theme-dark', theme === 'dark');
  }

  function applyPosition() {
    root.classList.toggle('__pos-top', state.overlayPosition === 'top');
    root.classList.toggle('__pos-bottom', state.overlayPosition === 'bottom');
  }

  function applySize() {
    bar.classList.remove('__leftdays-size-s', '__leftdays-size-l');
    if (state.overlaySize === 's') bar.classList.add('__leftdays-size-s');
    if (state.overlaySize === 'l') bar.classList.add('__leftdays-size-l');
  }

  function applyOpacity() {
    bar.style.setProperty('--bar-opacity', String(state.overlayOpacity));
  }

  function computeDiff() {
    const now = new Date();
    let diffTime = 0;
    if (state.calcFromDay && state.calcBaseDay) {
      const to = new Date(state.calcBaseDay);
      if (!Number.isNaN(to.valueOf())) {
        diffTime = to - now + oneDayMs; // include the target day itself
      }
    } else {
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
      diffTime = endOfYear - now;
    }
    return diffTime;
  }

  function getTargetLabelText() {
    if (state.calcFromDay && state.calcBaseDay) {
      const d = new Date(state.calcBaseDay);
      if (!Number.isNaN(d.valueOf())) {
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const dd = d.getDate();
        return `${y}年${m}月${dd}日まで`;
      }
    }
    return '年末まで';
  }

  function formatTimer(ms) {
    const abs = Math.abs(ms);
    const d = Math.floor(abs / oneDayMs);
    const h = Math.floor((abs % oneDayMs) / (1000*60*60));
    const m = Math.floor((abs % (1000*60*60)) / (1000*60));
    const s = Math.floor((abs % (1000*60)) / 1000);
    return `${d}日 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function renderNumbers() {
    const diffTime = computeDiff();

    const labelEl = bar.querySelector('[data-role="label-days"]');
    if (labelEl) labelEl.textContent = getTargetLabelText();

    // 1) HMS mode: show label + timer together
    if (state.overlayShowHMS) {
      chipLabelDays.style.display = ''; // ラベルは消さない
      sepA.style.display = '';          // 区切り表示
      chipTimer.style.display = '';     // タイマー表示
      // ほかは隠す
      sepB.style.display = 'none';
      chipDays.style.display  = 'none';
      chipWeeks.style.display = 'none';
      chipPerc.style.display  = 'none';

      const tEl = bar.querySelector('[data-role="timer"]');
      if (tEl) tEl.textContent = formatTimer(diffTime);
      return;
    }

    // 2) Days on: single-line "ラベル + 日数"
    if (state.isDays) {
      const days = Math.floor(diffTime / oneDayMs);

      // 「年末まで 123日」形式にまとめて表示
      if (labelEl) labelEl.textContent = `${getTargetLabelText()} ${Math.abs(days)}日`;

      chipLabelDays.style.display = '';
      sepA.style.display = 'none';
      chipTimer.style.display = 'none';

      // 他は隠す
      sepB.style.display = 'none';
      chipDays.style.display  = 'none';
      chipWeeks.style.display = 'none';
      chipPerc.style.display  = 'none';
      return;
    }

    // 3) Fallback (Days OFF): Weeks/% only
    chipLabelDays.style.display = 'none';
    sepA.style.display = 'none';
    chipTimer.style.display = 'none';

    const uWeeks = !!state.isWeeks;
    const uPerc  = !!state.isPercents;

    const days = Math.floor(diffTime / oneDayMs);
    const weeks = Math.floor(days / 7);
    const perc = Math.floor((diffTime / oneDayMs) * 100.0 / 365.0);

    chipDays.style.display  = 'none';
    chipWeeks.style.display = uWeeks ? '' : 'none';
    chipPerc.style.display  = uPerc  ? '' : 'none';
    sepB.style.display = (uWeeks && uPerc) ? '' : 'none';

    if (uWeeks) bar.querySelector('[data-role="num-weeks"]').textContent = String(Math.abs(weeks));
    if (uPerc)  bar.querySelector('[data-role="num-perc"]').textContent  = String(Math.abs(perc));
  }

  function startTimer() {
    stopTimer();
    const interval = state.overlayShowHMS ? 1000 : 60 * 1000;
    timerId = setInterval(renderNumbers, interval);
  }
  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function applyTheme() {
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = state.overlayTheme === 'system' ? (sysDark ? 'dark' : 'light') : state.overlayTheme;
    root.classList.toggle('__leftdays-theme-dark', theme === 'dark');
  }

  function applyPosition() {
    root.classList.toggle('__pos-top', state.overlayPosition === 'top');
    root.classList.toggle('__pos-bottom', state.overlayPosition === 'bottom');
  }

  function applySize() {
    bar.classList.remove('__leftdays-size-s', '__leftdays-size-l');
    if (state.overlaySize === 's') bar.classList.add('__leftdays-size-s');
    if (state.overlaySize === 'l') bar.classList.add('__leftdays-size-l');
  }

  function applyOpacity() {
    bar.style.setProperty('--bar-opacity', String(state.overlayOpacity));
  }

  function applyVisibility() {
    const domain = getDomain(location.href);
    const hidden = domainIsHidden(domain, state.hideOnDomains);
    root.style.display = (state.overlayEnabled && !hidden) ? '' : 'none';
  }

  function applyAll() {
    ensureRoot();
    applyTheme();
    applyPosition();
    applySize();
    applyOpacity();
    renderNumbers();
    applyVisibility();
    if (state.overlayEnabled) startTimer(); else stopTimer();
  }

  // Init
  chrome.storage.sync.get(Object.keys(defaults), (items) => {
    Object.assign(state, defaults, items || {});
    ensureRoot();
    applyAll();
  });

  // React to settings changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    let needRestart = false;
    for (const [k, v] of Object.entries(changes)) {
      state[k] = v.newValue;
      if (k === 'overlayShowHMS') needRestart = true;
    }
    applyAll();
    if (needRestart && state.overlayEnabled) startTimer();
  });
})();
