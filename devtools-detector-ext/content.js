(() => {
  "use strict";

  const BANNER_ID = "devtools-warning-banner-top";
  let bannerDismissed = false; // セッション中に閉じたら再表示しない

  function ensureBanner(checkerName) {
    if (bannerDismissed) return;
    if (document.getElementById(BANNER_ID)) return;

    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.setAttribute("role", "status");
    banner.style.position = "fixed";
    banner.style.top = "0";
    banner.style.left = "0";
    banner.style.right = "0";
    banner.style.zIndex = "2147483647";
    banner.style.padding = "10px 12px";
    banner.style.textAlign = "center";
    banner.style.fontSize = "14px";
    banner.style.lineHeight = "1.4";
    banner.style.background = "rgba(243, 0, 0, 0.9)";
    banner.style.color = "#fff";
    banner.style.backdropFilter = "saturate(120%) blur(2px)";
    banner.style.transition = "transform 160ms ease";
    banner.style.transform = "translateY(-100%)"; // スライドイン
    banner.style.display = "flex";
    banner.style.justifyContent = "center";
    banner.style.alignItems = "center";
    banner.style.gap = "8px";

    const msg = document.createElement("span");
    msg.textContent =
      "開発者ツールが開かれています。";

    const info = document.createElement("span");
    info.style.opacity = "0.8";
    info.textContent = checkerName ? `（検知: ${checkerName}）` : "";

    const close = document.createElement("button");
    close.type = "button";
    close.ariaLabel = "通知を閉じる";
    close.textContent = "閉じる";
    close.style.padding = "4px 10px";
    close.style.borderRadius = "6px";
    close.style.border = "1px solid rgba(255,255,255,0.25)";
    close.style.background = "transparent";
    close.style.color = "#fff";
    close.style.cursor = "pointer";
    close.addEventListener("click", () => {
      bannerDismissed = true;
      banner.remove();
    });

    banner.appendChild(msg);
    banner.appendChild(info);
    banner.appendChild(close);
    document.documentElement.appendChild(banner);

    requestAnimationFrame(() => {
      banner.style.transform = "translateY(0)";
    });
  }

  function removeBanner() {
    const el = document.getElementById(BANNER_ID);
    if (el) el.remove();
  }

  // ===== devtoolsDetector が使える場合の処理 =====
  if (
    typeof devtoolsDetector !== "undefined" &&
    devtoolsDetector &&
    typeof devtoolsDetector.addListener === "function"
  ) {
    devtoolsDetector.addListener((isOpen, detail) => {
      if (isOpen) {
        const name =
          (detail && (detail.checkerName || detail.name)) || "library";
        console.info("[DevTools notice] Detected open via library:", name);
        ensureBanner(name); // 画面上部にバナーを表示
      } else {
        console.info("[DevTools notice] Closed.");
        removeBanner();
      }
    });

    try {
      devtoolsDetector.launch();
    } catch (e) {
      console.debug("[DevTools notice] launch() failed, fallback on.", e);
      useFallbackDetector();
    }
  } else {
    // ライブラリがない場合はフォールバック検知
    useFallbackDetector();
  }

  // ===== フォールバック検知 =====
  function useFallbackDetector() {
    let lastOpen = false;
    const SIZE_THRESH = 160;

    function sizeCheck() {
      const wDiff = Math.abs(window.outerWidth - window.innerWidth);
      const hDiff = Math.abs(window.outerHeight - window.innerHeight);
      const isOpen = wDiff > SIZE_THRESH || hDiff > SIZE_THRESH;
      if (isOpen !== lastOpen) {
        lastOpen = isOpen;
        if (isOpen) ensureBanner("size");
        else removeBanner();
      }
    }

    function debuggerCheck() {
      const t0 = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const dt = performance.now() - t0;
      if (dt > 100) {
        if (!lastOpen) {
          lastOpen = true;
          ensureBanner("debugger");
        }
      }
    }

    window.addEventListener("resize", sizeCheck, { passive: true });
    sizeCheck();
    const timer1 = setInterval(sizeCheck, 1000);
    const timer2 = setInterval(debuggerCheck, 2000);

    window.addEventListener("unload", () => {
      clearInterval(timer1);
      clearInterval(timer2);
    });
  }
})();
