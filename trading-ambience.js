(() => {
  "use strict";

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let marketTimer = null;

  function init() {
    if (document.getElementById("tradingAmbienceStyles")) return;

    const style = document.createElement("style");
    style.id = "tradingAmbienceStyles";
    style.textContent = `
      .app-shell{position:relative;z-index:2}
      .trading-bg{position:fixed;inset:-18px;z-index:0;pointer-events:none;overflow:hidden;background:radial-gradient(circle at 82% 7%,rgba(183,255,54,.11),transparent 23rem),radial-gradient(circle at 8% 40%,rgba(40,148,255,.10),transparent 28rem),linear-gradient(180deg,rgba(3,7,12,.08),rgba(3,7,12,.3));transform:translate3d(var(--ambience-x,0),var(--ambience-y,0),0) scale(1.018);transition:transform .24s ease-out;will-change:transform}
      .trading-grid{position:absolute;inset:0;opacity:.25;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.72) 58%,transparent 100%)}
      .trading-glow{position:absolute;border-radius:50%;filter:blur(46px);opacity:.22;will-change:transform}.trading-glow.a{width:210px;height:210px;top:24%;left:-40px;background:rgba(183,255,54,.34);animation:tradeGlowA 8s ease-in-out infinite alternate}.trading-glow.b{width:250px;height:250px;top:50%;right:-70px;background:rgba(35,154,255,.28);animation:tradeGlowB 10s ease-in-out infinite alternate}
      @keyframes tradeGlowA{to{transform:translate(65px,-18px) scale(1.12)}}@keyframes tradeGlowB{to{transform:translate(-55px,24px) scale(1.08)}}
      .trading-candles{position:absolute;left:5%;right:5%;bottom:155px;height:176px;display:flex;align-items:flex-end;gap:7px;opacity:.34;filter:drop-shadow(0 0 12px rgba(0,0,0,.22))}
      .trading-candle{position:relative;flex:1;min-width:9px;border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,rgba(183,255,54,.9),rgba(79,181,12,.5));color:#b7ff36;animation:candleFloat 3.2s ease-in-out infinite;transform-origin:bottom center}
      .trading-candle.down{background:linear-gradient(180deg,rgba(255,85,110,.9),rgba(180,35,58,.52));color:#ff4c63}.trading-candle:before,.trading-candle:after{content:"";position:absolute;left:50%;width:2px;transform:translateX(-50%);background:currentColor;opacity:.68}.trading-candle:before{bottom:100%;height:17px}.trading-candle:after{top:100%;height:14px}
      @keyframes candleFloat{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-6px) scaleY(1.035)}}

      .demo-market-footer{margin-top:20px;padding:3px 0 8px;display:grid;gap:10px;position:relative;z-index:3}
      .demo-market-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .demo-market-card{position:relative;overflow:hidden;border:1px solid var(--border);border-radius:18px;padding:13px;background:linear-gradient(180deg,rgba(17,24,33,.82),rgba(10,15,22,.9));box-shadow:0 12px 34px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.025)}
      html[data-theme="light"] .demo-market-card{background:linear-gradient(180deg,rgba(255,255,255,.94),rgba(241,245,249,.96))}
      .demo-market-card:before{content:"";position:absolute;width:92px;height:92px;border-radius:50%;right:-28px;bottom:-46px;background:var(--accent);filter:blur(24px);opacity:.11}.demo-market-card.down:before{background:var(--red)}
      .demo-market-card small{display:block;color:var(--muted);font-size:9px;font-weight:900;letter-spacing:.13em}.demo-market-value{display:block;margin-top:8px;font-size:24px;font-weight:950;letter-spacing:-.045em;color:var(--accent);font-variant-numeric:tabular-nums}.demo-market-card.down .demo-market-value,.demo-market-card.down .demo-market-arrow{color:var(--red)}
      .demo-market-arrow{position:absolute;right:13px;top:11px;color:var(--accent);font-size:23px;font-weight:950;animation:arrowPulse 1.8s ease-in-out infinite}.demo-market-line{height:25px;margin-top:9px;border-radius:9px;overflow:hidden;position:relative;background:linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:18px 100%}.demo-market-line:after{content:"";position:absolute;left:-36%;top:52%;width:85%;height:2px;background:linear-gradient(90deg,transparent,var(--accent),rgba(183,255,54,.36),transparent);animation:lineMove 2.5s linear infinite;box-shadow:0 0 10px rgba(183,255,54,.34)}.demo-market-card.down .demo-market-line:after{background:linear-gradient(90deg,transparent,var(--red),rgba(255,76,99,.36),transparent);box-shadow:0 0 10px rgba(255,76,99,.28)}
      @keyframes arrowPulse{50%{transform:translateY(-2px) scale(1.08)}}@keyframes lineMove{to{transform:translateX(195%)}}
      .demo-market-ticker{overflow:hidden;border:1px solid var(--border);border-radius:16px;background:rgba(255,255,255,.028);padding:10px 0}.demo-market-track{display:flex;gap:10px;min-width:max-content;padding-left:10px;animation:tickerMove 20s linear infinite}.demo-market-pill{padding:7px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);font-size:11px;font-weight:850;white-space:nowrap}.demo-market-pill.up{color:var(--accent)}.demo-market-pill.down{color:var(--red)}@keyframes tickerMove{to{transform:translateX(-50%)}}
      .demo-badge{opacity:.48;font-size:8px;letter-spacing:.13em;margin-top:1px;color:var(--muted);text-align:center}

      .access-step.done{animation:accessDone .48s cubic-bezier(.16,1,.3,1)}
      @keyframes accessDone{0%{transform:scale(.965);filter:brightness(.9)}60%{transform:scale(1.015);filter:brightness(1.12)}100%{transform:none;filter:none}}
      #screenResult.active .result-card{animation:resultPremium .55s cubic-bezier(.16,1,.3,1)}
      @keyframes resultPremium{0%{opacity:0;transform:translateY(18px) scale(.965);filter:blur(3px)}65%{opacity:1;transform:translateY(-3px) scale(1.006);filter:none}100%{transform:none}}
      #screenLoading.active .scanner-frame:before{content:"";position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(90deg,transparent 0 38%,rgba(183,255,54,.08) 50%,transparent 62%);transform:translateX(-120%);animation:hudSweep 2.4s ease-in-out infinite}
      #screenLoading.active .scanner-frame:after{content:"AI MARKET SCAN";position:absolute;left:12px;top:11px;z-index:5;color:rgba(216,255,151,.72);font-size:8px;font-weight:900;letter-spacing:.16em;padding:6px 8px;border:1px solid rgba(183,255,54,.14);border-radius:8px;background:rgba(5,9,13,.45);backdrop-filter:blur(8px)}
      @keyframes hudSweep{0%,12%{transform:translateX(-130%);opacity:0}38%{opacity:1}72%{transform:translateX(130%);opacity:.55}100%{transform:translateX(130%);opacity:0}}
      #screenLoading.active .pulse-orb{animation:orbHalo 1.7s ease-in-out infinite}
      @keyframes orbHalo{50%{box-shadow:0 0 0 8px rgba(183,255,54,.035),0 0 40px rgba(183,255,54,.18)}}
      .primary-btn:not(:disabled){will-change:transform}.panel,.access-card,.result-card{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}

      @media(max-width:520px){.trading-candles{height:145px;bottom:148px;gap:5px;opacity:.31}.demo-market-value{font-size:21px}.demo-market-card{padding:12px}.demo-market-arrow{font-size:20px}}
      @media(prefers-reduced-motion:reduce){.trading-glow,.trading-candle,.demo-market-arrow,.demo-market-line:after,.demo-market-track,#screenLoading.active .scanner-frame:before,#screenLoading.active .pulse-orb{animation:none!important}}
    `;
    document.head.appendChild(style);

    buildBackground();
    buildMarketFooter();
    startMarketNumbers();
    startParallax();
  }

  function buildBackground() {
    if (document.querySelector(".trading-bg")) return;
    const bg = document.createElement("div");
    bg.className = "trading-bg";
    bg.setAttribute("aria-hidden", "true");
    const heights = [42, 76, 56, 92, 49, 114, 86, 63, 124, 72, 138, 96, 118, 80];
    bg.innerHTML = `<div class="trading-grid"></div><div class="trading-glow a"></div><div class="trading-glow b"></div><div class="trading-candles">${heights.map((h, i) => `<span class="trading-candle ${[1,4,7,9,13].includes(i) ? "down" : "up"}" style="height:${h}px;animation-delay:${(i * .14).toFixed(2)}s"></span>`).join("")}</div>`;
    document.body.prepend(bg);
  }

  function buildMarketFooter() {
    const shell = document.querySelector(".app-shell");
    const toast = document.getElementById("toast");
    if (!shell || document.querySelector(".demo-market-footer")) return;

    const footer = document.createElement("footer");
    footer.className = "demo-market-footer";
    footer.setAttribute("aria-hidden", "true");
    footer.innerHTML = `<div class="demo-market-grid">
      ${card("EUR/USD", 1.2, 3.9, 2, false, "%")}
      ${card("MARKET PULSE", 62, 94, 0, false, "%")}
      ${card("USD/JPY", .8, 2.4, 2, true, "%")}
      ${card("DEMO PNL", 120, 980, 0, false, " USD")}
    </div><div class="demo-market-ticker"><div class="demo-market-track">${ticker()}${ticker()}</div></div><div class="demo-badge">SIMULATED UI DATA · NOT LIVE MARKET DATA</div>`;
    shell.insertBefore(footer, toast || null);
  }

  function card(label, min, max, decimals, down, suffix) {
    return `<div class="demo-market-card ${down ? "down" : "up"}"><small>${label}</small><strong class="demo-market-value" data-min="${min}" data-max="${max}" data-decimals="${decimals}" data-down="${down}" data-suffix="${suffix}">0${suffix}</strong><span class="demo-market-arrow">${down ? "↘" : "↗"}</span><i class="demo-market-line"></i></div>`;
  }

  function ticker() {
    return `<span class="demo-market-pill up">BTC +2.41% ↗</span><span class="demo-market-pill down">USD/CAD -1.18% ↘</span><span class="demo-market-pill up">XAU/USD +4.32% ↗</span><span class="demo-market-pill up">EUR/JPY +1.74% ↗</span><span class="demo-market-pill down">NASDAQ -0.84% ↘</span><span class="demo-market-pill up">SOL +5.20% ↗</span>`;
  }

  function startMarketNumbers() {
    const cards = Array.from(document.querySelectorAll(".demo-market-value"));
    if (!cards.length) return;
    const tick = () => cards.forEach((el, i) => animateValue(el, reduceMotion ? 0 : 820 + i * 110));
    tick();
    if (!reduceMotion) marketTimer = window.setInterval(tick, 2900);
  }

  function startParallax() {
    if (reduceMotion) return;
    const coarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const root = document.documentElement;
    if (!coarsePointer) root.dataset.depth = "active";
    let pointerX = 0;
    let pointerY = 0;
    let scrollY = 0;
    let frame = 0;
    const paint = () => {
      frame = 0;
      root.style.setProperty("--ambience-x", `${(-pointerX * 7).toFixed(2)}px`);
      root.style.setProperty("--ambience-y", `${(-pointerY * 6 + scrollY).toFixed(2)}px`);
      root.style.setProperty("--depth-x", `${(pointerX * 1.7).toFixed(2)}px`);
      root.style.setProperty("--depth-y", `${(pointerY * 1.4 + scrollY * .16).toFixed(2)}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    if (!coarsePointer) {
      window.addEventListener("pointermove", event => {
        pointerX = Math.max(-1, Math.min(1, event.clientX / Math.max(1, innerWidth) * 2 - 1));
        pointerY = Math.max(-1, Math.min(1, event.clientY / Math.max(1, innerHeight) * 2 - 1));
        schedule();
      }, { passive: true });
    }
    window.addEventListener("scroll", () => {
      scrollY = Math.max(-4, Math.min(4, window.scrollY * -.012));
      schedule();
    }, { passive: true });
  }

  function animateValue(el, duration) {
    const min = Number(el.dataset.min || 0);
    const max = Number(el.dataset.max || min);
    const decimals = Number(el.dataset.decimals || 0);
    const down = el.dataset.down === "true";
    const suffix = el.dataset.suffix || "";
    const target = min + Math.random() * Math.max(0, max - min);
    const start = Number(el.dataset.current || 0);

    if (!duration) {
      el.textContent = `${down ? "-" : "+"}${target.toFixed(decimals)}${suffix}`;
      el.dataset.current = String(target);
      return;
    }

    const startedAt = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = start + (target - start) * eased;
      el.textContent = `${down ? "-" : "+"}${value.toFixed(decimals)}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
      else el.dataset.current = String(target);
    };
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
