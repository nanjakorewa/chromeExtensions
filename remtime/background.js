'use strict';

const ONE_DAY = 1000 * 60 * 60 * 24;

/** 汎用：数値アイコンを安全に描く（HiDPI対応・中央揃え・はみ出し防止） */
function renderNumberIcon(size, text, color = 'black') {
  // 2x で作業 → 最後に縮小してエッジを綺麗に
  const workScale = 2;
  const W = size * workScale;
  const H = size * workScale;

  const work = new OffscreenCanvas(W, H);
  const wctx = work.getContext('2d');

  // 透明下地
  wctx.clearRect(0, 0, W, H);

  // フォントサイズを桁数で動的調整（はみ出しにくい）
  const digits = String(text).length;
  // 1桁: 0.74 / 2桁: 0.68 / 3桁以上: 0.60 くらいが安全
  const scaleByDigits = digits >= 3 ? 0.60 : digits === 2 ? 0.68 : 0.74;
  const fontPx = Math.round(H * scaleByDigits);

  wctx.fillStyle = color;
  wctx.textAlign = 'center';
  // baseline は 'alphabetic' より 'middle' が無難。ただし実測も使う。
  wctx.textBaseline = 'alphabetic';
  wctx.font = `700 ${fontPx}px ui-rounded, system-ui, -apple-system, "Segoe UI", Roboto, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`;

  const tm = wctx.measureText(String(text));
  // TextMetrics が詳細を返すなら厳密センタリング
  const ascent = tm.actualBoundingBoxAscent ?? fontPx * 0.8;
  const descent = tm.actualBoundingBoxDescent ?? fontPx * 0.2;
  const textHeight = ascent + descent;

  // キャンバス中央に文字の「ボックス中心」が来る y を計算
  // ボックス上端 = cy - textHeight/2 → ベースライン y = 上端 + ascent
  const cx = W / 2;
  const cy = H / 2;
  const baselineOffset = -textHeight * 0.65;
  const baselineY = Math.round(cy - textHeight / 2 + ascent + baselineOffset);

  wctx.fillText(String(text), cx, baselineY);

  // 出力キャンバス（最終サイズ）
  const out = new OffscreenCanvas(size, size);
  const octx = out.getContext('2d');
  // 高品質リサンプル（ブラウザが対応していれば綺麗になる）
  if ('imageSmoothingEnabled' in octx) {
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
  }
  octx.clearRect(0, 0, size, size);
  octx.drawImage(work, 0, 0, size, size);

  return octx.getImageData(0, 0, size, size);
}

function buildIconImageDataSet(text, color) {
  return {
    16: renderNumberIcon(16, text, color),
    24: renderNumberIcon(24, text, color),
    32: renderNumberIcon(32, text, color),
    48: renderNumberIcon(48, text, color),
  };
}

/** 主要ロジック：残りの算出とバッジ/アイコン更新 */
async function update() {
  const {
    calcFromDay = false,
    calcBaseDay,
    useWhiteColor = false,
    isPercents = false,
    isDays = false,
    isWeeks = false,
  } = await chrome.storage.sync.get([
    'calcFromDay',
    'calcBaseDay',
    'useWhiteColor',
    'isPercents',
    'isDays',
    'isWeeks',
  ]);

  const now = new Date();
  let diffTime = 0;

  if (calcFromDay) {
    const to = new Date(calcBaseDay);
    if (!Number.isNaN(to.valueOf())) {
      diffTime = to - now + ONE_DAY; // 当日を含める
    }
  } else {
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    diffTime = endOfYear - now;
  }

  const fontColor = useWhiteColor ? 'white' : 'black';

  // バッジ（テキスト）側
  chrome.action.setBadgeBackgroundColor({ color: '#222' });

  // 優先順位：％ → 日 → 週（※必要ならここは好きに変更OK）
  let number = null;
  let badgeText = '';

  if (isPercents) {
    const perc = Math.floor((diffTime / ONE_DAY) * 100.0 / 365.0);
    number = Math.abs(perc);
    badgeText = perc < 0 ? '％経過' : '残％';
  } else if (isDays) {
    const days = Math.floor(diffTime / ONE_DAY);
    number = Math.abs(days);
    badgeText = days < 0 ? '日経過' : '残日';
  } else if (isWeeks) {
    const weeks = Math.floor(Math.floor(diffTime / ONE_DAY) / 7);
    number = Math.abs(weeks);
    badgeText = weeks < 0 ? '週経過' : '残週';
  } else {
    // どれも OFF の場合は安全に日を出す
    const days = Math.floor(diffTime / ONE_DAY);
    number = Math.abs(days);
    badgeText = days < 0 ? '日経過' : '残日';
  }

  await Promise.all([
    chrome.action.setBadgeText({ text: badgeText }),
    chrome.action.setIcon({ imageData: buildIconImageDataSet(number, fontColor) }),
  ]);
}

/** ライフサイクル */
chrome.runtime.onInstalled.addListener(() => {
  update();
  chrome.alarms.create({ periodInMinutes: 1 });
});
chrome.runtime.onStartup.addListener(update);
chrome.alarms.onAlarm.addListener(update);
chrome.action.onClicked.addListener(update);
chrome.storage.onChanged.addListener(update);
