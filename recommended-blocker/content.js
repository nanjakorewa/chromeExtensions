// =====================
// Utilities
// =====================
const onDOMChange = (fn) => {
  const mo = new MutationObserver(() => fn());
  mo.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', fn);
  document.addEventListener('readystatechange', fn);
  window.addEventListener('yt-navigate-finish', fn);
  fn();
};

const hide = (el) => {
  if (!el) return;
  el.style.setProperty('display', 'none', 'important');
  el.style.setProperty('visibility', 'hidden', 'important');
  el.setAttribute('data-no-reco', '1');
};

const debounce = (fn, ms = 100) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

// =====================
// Config (kept in sync with options.js)
// =====================
let muteConfig = {
  keywords: ['ネタバレ'],
  hideYouTubeRecs: true,
  hideHighLikeRatio: true,
  blurTwitterImages: false,
  usePresetAbusive: false,
  usePresetSensitive: false,
  wholeWord: false,
  useRegex: false,
  matchHashtags: true,
  dryRun: false
};
let compiledPatterns = [];

// =====================
// Presets (internal; merged at runtime only)
// =====================
const SENSITIVE_PRESET = [
  '/r[\\s\\-_]*1?8\\b/iu',
  '/18\\s*禁|成人\\s*向け/iu',
  '/裏\\s*(?:垢|アカ)(?:女子)?/iu',
  '/え(?:っち|ち|ちえち)/iu',
  '/エッチ|エロ(?:垢|漫画|動画)?/iu',
  '/(?:無修正|モザイク)/iu',
  '/(?:抜ける|抜いた|オカズ)/iu',
  '/ヌード|下着販売|自撮り販売/iu',
  '/パパ活|裏バイト|出会い系|オフパコ|セフレ/iu',
  '/有料\\s*(?:プラン|販売)|鍵垢/iu',
  '/nsfw(?:art|artist)?/iu',
  '/lewds?|lewd(?:art)?/iu',
  '/hentai|ecchi|rule\\s*34/iu',
  '/only\\s*fans|onlyfans|fanbox|fantia|skeb\\s*nsfw/iu',
  '/porn|p[o0]rn|pr0n|xxx/iu',
  '/(?:xvideos|xhamster|pornhub)/iu',
  '/cam(?:girl|model)/iu',
  '/nud(?:e|ity)|topless|boobs?|tits?|areola|nipple/iu',
  '/explicit\\s*content|sexual\\s*content|18\\+/iu',
  '/おっぱい|巨乳|貧乳|乳首|乳房|谷間/iu',
  '/パンチラ|露出|(?:ド)?スケベ|性(?:的|行為|癖|器)/iu',
  '/フェチ|脚フェチ|足フェチ|脇フェチ/iu',
  '/コスプレ\\s*エロ|過激/iu',
  '/オナ(?:ニ|ニー)?|自慰/iu',
  '/手コキ|口コキ|寝取/iu',
  '/連絡先\\s*dm|dm\\s*(?:ください|for)/iu',
  '/spicy\\s*(?:content|pics|links)/iu',
  '/link\\s*in\\s*bio/iu',
  '/customs?\\s*open/iu',
  '/裏垢|裏アカ|野獣|まんこ|あなる|アナル|死ね/iu',
];

const ABUSIVE_PRESET = [
  '/死ね|氏ね|しね|くたばれ/iu',
  '/殺す|ころす|ぶっ殺|ぶち殺/iu',
  '/消えろ|黙れ/iu',
  '/クズ|ゴミ|カス|馬鹿|バカ|阿呆|あほ|アホ/iu',
  '/うざい|うぜえ|キモい|きもい/iu',
  '/最低|最悪/iu',
  '/\\bkys\\b|kill\\s*yourself|die\\s*in\\s*a\\s*fire/iu',
  '/asshole|bastard|bitch/iu',
  '/idiot|moron|stupid|loser/iu',
  '/f(?:\\*+|u+)?ck/iu',
  '/sh(?:\\*+|i+)t/iu'
];

// =====================
// Pattern compilation
// =====================
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function parseAsRegexLiteral(line) {
  const m = String(line).trim().match(/^\/(.+)\/([a-z]*)$/i);
  if (!m) return null;
  try {
    return new RegExp(m[1], m[2] || 'iu');
  } catch {
    return null;
  }
}
function compilePatterns() {
  compiledPatterns = [];
  const base = Array.isArray(muteConfig.keywords) ? muteConfig.keywords.slice() : [];
  if (muteConfig.usePresetAbusive) base.push(...ABUSIVE_PRESET);
  if (muteConfig.usePresetSensitive) base.push(...SENSITIVE_PRESET);

  for (const raw0 of base) {
    if (!raw0) continue;
    const raw = String(raw0).trim();

    const lit = parseAsRegexLiteral(raw);
    if (lit) {
      compiledPatterns.push(lit);
      continue;
    }

    let pattern = raw;
    if (muteConfig.useRegex) {
      try {
        compiledPatterns.push(new RegExp(pattern, 'iu'));
        continue;
      } catch {}
    }

    pattern = escapeRegex(raw);
    if (muteConfig.wholeWord) {
      pattern = `(?<![\\p{L}\\p{N}_])${pattern}(?![\\p{L}\\p{N}_])`;
    }
    try {
      compiledPatterns.push(new RegExp(pattern, 'iu'));
    } catch {}
  }
}

// =====================
// Load & react to options
// =====================
async function loadMuteConfig() {
  try {
    const { muteConfig: stored } = await chrome.storage.sync.get({ muteConfig });
    muteConfig = { ...muteConfig, ...(stored || {}) };
  } catch {}
  compilePatterns();
  applyGlobalToggles();
}

if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.muteConfig) {
      muteConfig = { ...muteConfig, ...(changes.muteConfig.newValue || {}) };
      compilePatterns();
      applyGlobalToggles();
      // 再評価（ドライラン表示の付け直し等）
      document.querySelectorAll('article.no-reco-mute-preview').forEach(unmarkPreview);
      tryMuteTweets(document);
      if (!muteConfig.hideYouTubeRecs) unhideYouTubeOnce();
    }
  });
}

// =====================
// Reflect global toggles to <html> (CSS hooks)
// =====================
function applyGlobalToggles() {
  const html = document.documentElement;
  if (muteConfig.hideYouTubeRecs) html.setAttribute('data-hide-yt', '1');
  else html.removeAttribute('data-hide-yt');

  if (muteConfig.blurTwitterImages) html.setAttribute('data-blur-xmedia', '1');
  else html.removeAttribute('data-blur-xmedia');
}

// =====================
// YouTube — hide recommendations (when toggled on)
// =====================
const ytSelectors = [
  '#related',
  'ytd-watch-next-secondary-results-renderer',
  'ytd-compact-radio-renderer',
  'ytd-compact-video-renderer',
  'ytd-compact-playlist-renderer',
  'ytd-browse[page-subtype="home"] #contents',
  'ytd-rich-grid-renderer',
  'ytd-rich-grid-row',
  'ytd-rich-item-renderer',
  'ytd-reel-shelf-renderer',
  'ytd-reel-video-renderer',
  'ytd-shelf-renderer',
  'ytd-horizontal-card-list-renderer',
  'ytd-carousel-header-renderer',
  '.ytp-endscreen-content',
  'ytd-endscreen-renderer',
  '.ytp-pause-overlay',
  '.ytp-pause-overlay-container',
  '.ytp-autonav-endscreen-upnext-container',
  '.ytp-upnext',
  '.ytp-next-button',
  '#chips',
  'ytd-feed-filter-chip-bar-renderer'
];

function removeYouTube() {
  if (!location.hostname.includes('youtube.com')) return;
  if (!muteConfig.hideYouTubeRecs) return;
  ytSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach(hide);
  });
}

function unhideYouTubeOnce() {
  if (!location.hostname.includes('youtube.com')) return;
  ytSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.getAttribute('data-no-reco') === '1') {
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.removeAttribute('data-no-reco');
      }
    });
  });
}

// =====================
// Twitter/X — remove "Trending/What's happening/Who to follow"
// =====================
function removeTwitterXRecommendations() {
  if (!location.hostname.includes('twitter.com') && !location.hostname.includes('x.com')) return;
  const ariaSelectors = [
    '[aria-label^="Timeline: Trending"]',
    '[aria-label^="Timeline: What’s happening"]',
    '[aria-label^="Timeline: What\'s happening"]',
    '[aria-label^="Timeline: Who to follow"]'
  ];
  ariaSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach(hide);
  });
}

// =====================
// Twitter/X — keyword mute (+ dry-run overlay)
// =====================
function textOfTweet(article) {
  const parts = [];
  article.querySelectorAll('[data-testid="tweetText"]').forEach((n) => {
    parts.push(n.innerText || n.textContent || '');
  });
  if (muteConfig.matchHashtags) {
    article
      .querySelectorAll('a[role="link"][href^="/hashtag/"]')
      .forEach((a) => parts.push(a.innerText || a.textContent || ''));
  }
  if (parts.length === 0) {
    parts.push(article.innerText || article.textContent || '');
  }
  return parts.join(' \n ');
}

function shouldMute(text) {
  const t = (text || '').toLowerCase();
  return compiledPatterns.some((re) => re.test(t));
}

// ---- Dry-run overlay (DOM element, stable) ----
function ensureOverlay(el) {
  let ov = el.querySelector(':scope > .no-reco-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'no-reco-overlay';
    el.appendChild(ov);
  }
  return ov;
}
function removeOverlay(el) {
  const ov = el.querySelector(':scope > .no-reco-overlay');
  if (ov) ov.remove();
}
// label-aware preview
function markPreview(el, label = 'Muted (preview)') {
  if (!el) return;
  el.classList.add('no-reco-mute-preview');
  const ov = ensureOverlay(el);
  ov.setAttribute('data-label', label);
  el.setAttribute('data-muted-by-keyword', 'preview');
}
function unmarkPreview(el) {
  if (!el) return;
  removeOverlay(el);
  el.classList.remove('no-reco-mute-preview');
  if (el.getAttribute('data-muted-by-keyword') === 'preview') {
    el.removeAttribute('data-muted-by-keyword');
  }
}

// =====================
// Twitter/X — ratio filter (likes vs RTs)
// =====================
// "1,234" / "2.5K" / "3.1M" / "4.2B" / "2.5万" / "3億" → number
function parseTwitterNumber(text) {
  if (!text) return 0;
  const t = String(text).trim().replace(/,/g, '');
  const mK = t.match(/^([\d.]+)\s*[Kk]$/); if (mK) return parseFloat(mK[1]) * 1_000;
  const mM = t.match(/^([\d.]+)\s*[Mm]$/); if (mM) return parseFloat(mM[1]) * 1_000_000;
  const mB = t.match(/^([\d.]+)\s*[Bb]$/); if (mB) return parseFloat(mB[1]) * 1_000_000_000;
  if (t.endsWith('万')) return parseFloat(t) * 10_000;
  if (t.endsWith('億')) return parseFloat(t) * 100_000_000;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

// 判定のみ返す（RT=0 は 1 扱い）: likes >= max(RT,1) * 200
function isHighLikeRatio(tweet) {
  try {
    const rtBtn   = tweet.querySelector('[data-testid="retweet"]');
    const likeBtn = tweet.querySelector('[data-testid="like"]');
    if (!likeBtn) return false;

    const rtText   = (rtBtn?.innerText || rtBtn?.textContent || '').trim();
    const likeText = (likeBtn?.innerText || likeBtn?.textContent || '').trim();

    const rt    = parseTwitterNumber(rtText);
    const likes = parseTwitterNumber(likeText);

    const rtSafe = rt === 0 ? 1 : rt;
    return likes >= rtSafe * 200;
  } catch {
    return false;
  }
}

// =====================
// Per-tweet evaluation
// =====================
function evaluateTweet(article) {
  const state = article.getAttribute('data-muted-by-keyword');
  if (state === '1') return;

  // 1) Keyword-based filtering
  const kwHit = shouldMute(textOfTweet(article));
  if (muteConfig.dryRun) {
    if (kwHit) markPreview(article, '非表示対称のワード(プレビュー)');
    else unmarkPreview(article);
  } else {
    if (kwHit) {
      unmarkPreview(article);
      hide(article);
      article.setAttribute('data-muted-by-keyword', '1');
    } else {
      unmarkPreview(article);
    }
  }

  // 2) High like/RT ratio filtering (toggle + dry-run)
  if (muteConfig.hideHighLikeRatio && isHighLikeRatio(article)) {
    if (muteConfig.dryRun) {
      markPreview(article, 'センシティブな漫画の可能性あり(プレビュー)');
    } else {
      unmarkPreview(article);
      hide(article);
      article.setAttribute('data-muted-by-ratio', '1');
    }
  }
}

const tryMuteTweets = debounce((root) => {
  if (!location.hostname.includes('twitter.com') && !location.hostname.includes('x.com')) return;
  root.querySelectorAll('article[data-testid="tweet"]').forEach(evaluateTweet);
}, 80);

// =====================
// Router
// =====================
const tick = debounce(() => {
  applyGlobalToggles();
  if (location.hostname.includes('youtube.com')) {
    removeYouTube();
  } else if (location.hostname.includes('twitter.com') || location.hostname.includes('x.com')) {
    removeTwitterXRecommendations();
    tryMuteTweets(document);
  }
}, 80);

// =====================
// Init
// =====================
(async function init() {
  await loadMuteConfig();
  onDOMChange(tick);
})();
