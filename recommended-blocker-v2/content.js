// =====================
// Utilities
// =====================
const onDOMChange = (fn) => {
  const mo = new MutationObserver(() => fn());
  mo.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', fn);
  document.addEventListener('readystatechange', fn);
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
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

// =====================
// Config (defaults: all OFF)
// =====================
let muteConfig = {
  keywords: [],
  hideHighLikeRatio: false,
  usePresetAbusive: false,
  usePresetSensitive: false,
  wholeWord: false,
  useRegex: false,
  matchHashtags: false,
  dryRun: false
};
let compiledPatterns = [];

// =====================
// Presets
// =====================
const SENSITIVE_PRESET = [
  '/r[\\s\\-_]*1?8\\b/iu','/18\\s*禁|成人\\s*向け/iu','/裏\\s*(?:垢|アカ)(?:女子)?/iu','/え(?:っち|ち|ちえち)/iu',
  '/エッチ|エロ(?:垢|漫画|動画)?/iu','/(?:無修正|モザイク)/iu','/(?:抜ける|抜いた|オカズ)/iu','/ヌード|下着販売|自撮り販売/iu',
  '/パパ活|裏バイト|出会い系|オフパコ|セフレ/iu','/有料\\s*(?:プラン|販売)|鍵垢/iu','/nsfw(?:art|artist)?/iu','/lewds?|lewd(?:art)?/iu',
  '/hentai|ecchi|rule\\s*34/iu','/only\\s*fans|onlyfans|fanbox|fantia|skeb\\s*nsfw/iu','/porn|p[o0]rn|pr0n|xxx/iu',
  '/(?:xvideos|xhamster|pornhub)/iu','/cam(?:girl|model)/iu','/nud(?:e|ity)|topless|boobs?|tits?|areola|nipple/iu',
  '/explicit\\s*content|sexual\\s*content|18\\+/iu','/おっぱい|巨乳|貧乳|乳首|乳房|谷間/iu','/パンチラ|露出|(?:ド)?スケベ|性(?:的|行為|癖|器)/iu',
  '/フェチ|脚フェチ|足フェチ|脇フェチ/iu','/コスプレ\\s*エロ|過激/iu','/オナ(?:ニ|ニー)?|自慰/iu','/手コキ|口コキ|寝取/iu',
  '/連絡先\\s*dm|dm\\s*(?:ください|for)/iu','/spicy\\s*(?:content|pics|links)/iu','/link\\s*in\\s*bio/iu','/customs?\\s*open/iu','挑発'
];
const ABUSIVE_PRESET = [
  '/死ね|氏ね|しね|くたばれ/iu','/殺す|ころす|ぶっ殺|ぶち殺/iu','/消えろ|黙れ/iu','/クズ|ゴミ|カス|馬鹿|バカ|阿呆|あほ|アホ/iu',
  '/うざい|うぜえ|キモい|きもい/iu','/最低|最悪/iu','/\\bkys\\b|kill\\s*yourself|die\\s*in\\s*a\\s*fire/iu',
  '/asshole|bastard|bitch/iu','/idiot|moron|stupid|loser/iu','/f(?:\\*+|u+)?ck/iu','/sh(?:\\*+|i+)t/iu'
];

// =====================
// Pattern compilation
// =====================
function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function parseAsRegexLiteral(line){
  const m=String(line).trim().match(/^\/(.+)\/([a-z]*)$/i);
  if(!m) return null;
  try{ return new RegExp(m[1], m[2]||'iu'); }catch{ return null; }
}
function compilePatterns(){
  compiledPatterns = [];
  const base = Array.isArray(muteConfig.keywords) ? muteConfig.keywords.slice() : [];
  if (muteConfig.usePresetAbusive) base.push(...ABUSIVE_PRESET);
  if (muteConfig.usePresetSensitive) base.push(...SENSITIVE_PRESET);

  for (const raw0 of base){
    if (!raw0) continue;
    const raw = String(raw0).trim();

    const lit = parseAsRegexLiteral(raw);
    if (lit){ compiledPatterns.push(lit); continue; }

    let pattern = raw;
    if (muteConfig.useRegex){ try{ compiledPatterns.push(new RegExp(pattern,'iu')); continue; }catch{} }
    pattern = escapeRegex(raw);
    if (muteConfig.wholeWord){ pattern = `(?<![\\p{L}\\p{N}_])${pattern}(?![\\p{L}\\p{N}_])`; }
    try{ compiledPatterns.push(new RegExp(pattern,'iu')); }catch{}
  }
}

// =====================
// Load & react to options
// =====================
async function loadMuteConfig(){
  try{
    const { muteConfig: stored } = await chrome.storage.sync.get({ muteConfig });
    muteConfig = { ...muteConfig, ...(stored || {}) };
  }catch{}
  compilePatterns();
}

if (typeof chrome !== 'undefined' && chrome.storage){
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.muteConfig){
      muteConfig = { ...muteConfig, ...(changes.muteConfig.newValue || {}) };
      compilePatterns();
      document.querySelectorAll('article.no-reco-mute-preview').forEach(unmarkPreview);
      tryMuteTweets(document);
    }
  });
}

// =====================
// Twitter/X — keyword mute (+ dry-run overlay)
// =====================
function textOfTweet(article){
  const parts = [];
  article.querySelectorAll('[data-testid="tweetText"]').forEach(n => parts.push(n.innerText||n.textContent||''));
  if (muteConfig.matchHashtags){
    article.querySelectorAll('a[role="link"][href^="/hashtag/"]').forEach(a => parts.push(a.innerText||a.textContent||''));
  }
  if (!parts.length) parts.push(article.innerText||article.textContent||'');
  return parts.join(' \n ');
}
function shouldMute(text){
  const t = (text||'').toLowerCase();
  return compiledPatterns.some(re => re.test(t));
}

// Dry-run overlay
function ensureOverlay(el){ let ov = el.querySelector(':scope > .no-reco-overlay'); if(!ov){ ov=document.createElement('div'); ov.className='no-reco-overlay'; el.appendChild(ov);} return ov; }
function removeOverlay(el){ const ov = el.querySelector(':scope > .no-reco-overlay'); if(ov) ov.remove(); }
function markPreview(el,label='Muted 非表示する投稿'){ if(!el) return; el.classList.add('no-reco-mute-preview'); const ov=ensureOverlay(el); ov.setAttribute('data-label',label); el.setAttribute('data-muted-by-keyword','preview'); }
function unmarkPreview(el){ if(!el) return; removeOverlay(el); el.classList.remove('no-reco-mute-preview'); if(el.getAttribute('data-muted-by-keyword')==='preview') el.removeAttribute('data-muted-by-keyword'); }

// Ratio helpers
function parseTwitterNumber(text){
  if(!text) return 0;
  const t=String(text).trim().replace(/,/g,'');
  const mK=t.match(/^([\d.]+)\s*[Kk]$/); if(mK) return parseFloat(mK[1])*1_000;
  const mM=t.match(/^([\d.]+)\s*[Mm]$/); if(mM) return parseFloat(mM[1])*1_000_000;
  const mB=t.match(/^([\d.]+)\s*[Bb]$/); if(mB) return parseFloat(mB[1])*1_000_000_000;
  if(t.endsWith('万')) return parseFloat(t)*10_000;
  if(t.endsWith('億')) return parseFloat(t)*100_000_000;
  const n=parseFloat(t); return Number.isFinite(n)?n:0;
}
function isHighLikeRatio(tweet){
  try{
    const rtBtn=tweet.querySelector('[data-testid="retweet"]');
    const likeBtn=tweet.querySelector('[data-testid="like"]');
    if(!likeBtn) return false;
    const rtText=(rtBtn?.innerText||rtBtn?.textContent||'').trim();
    const likeText=(likeBtn?.innerText||likeBtn?.textContent||'').trim();
    const rt=parseTwitterNumber(rtText);
    const likes=parseTwitterNumber(likeText);
    const rtSafe=rt===0?1:rt;
    return likes >= rtSafe*100;
  }catch{ return false; }
}

// Evaluate each tweet
function evaluateTweet(article){
  const state = article.getAttribute('data-muted-by-keyword');
  if(state==='1') return;

  const kwHit = shouldMute(textOfTweet(article));
  if(muteConfig.dryRun){
    if(kwHit) markPreview(article,'非表示する投稿'); else unmarkPreview(article);
  }else{
    if(kwHit){ unmarkPreview(article); hide(article); article.setAttribute('data-muted-by-keyword','1'); }
    else { unmarkPreview(article); }
  }

  if(muteConfig.hideHighLikeRatio && isHighLikeRatio(article)){
    if(muteConfig.dryRun){ markPreview(article,'非表示する投稿'); }
    else { unmarkPreview(article); hide(article); article.setAttribute('data-muted-by-ratio','1'); }
  }
}

const tryMuteTweets = debounce(root=>{
  if (!location.hostname.includes('twitter.com') && !location.hostname.includes('x.com')) return;
  root.querySelectorAll('article[data-testid="tweet"]').forEach(evaluateTweet);
},80);

// =====================
// Init
// =====================
(async function init(){
  await loadMuteConfig();
  onDOMChange(() => { tryMuteTweets(document); });
})();
