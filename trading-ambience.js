(() => {
  "use strict";
  const init = () => {
    if (document.getElementById("tradingAmbienceStyles")) return;
    const style = document.createElement("style");
    style.id = "tradingAmbienceStyles";
    style.textContent = `
      .app-shell{position:relative;z-index:2}
      .trading-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;background:radial-gradient(circle at 82% 8%,rgba(183,255,54,.12),transparent 24rem),radial-gradient(circle at 8% 42%,rgba(28,145,255,.10),transparent 26rem)}
      .trading-grid{position:absolute;inset:0;opacity:.28;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(#000,rgba(0,0,0,.55),transparent)}
      .trading-candles{position:absolute;left:5%;right:5%;bottom:150px;height:170px;display:flex;align-items:flex-end;gap:7px;opacity:.42}.trading-candle{position:relative;flex:1;min-width:9px;border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,rgba(183,255,54,.9),rgba(79,181,12,.5));animation:candleFloat 3s ease-in-out infinite}.trading-candle.down{background:linear-gradient(180deg,rgba(255,85,110,.9),rgba(180,35,58,.52))}.trading-candle:before,.trading-candle:after{content:"";position:absolute;left:50%;width:2px;height:16px;transform:translateX(-50%);background:currentColor;opacity:.7}.trading-candle:before{bottom:100%}.trading-candle:after{top:100%}.trading-candle.up{color:#b7ff36}.trading-candle.down{color:#ff4c63}@keyframes candleFloat{50%{transform:translateY(-7px)}}
      .demo-market-footer{margin-top:20px;padding-bottom:8px;display:grid;gap:10px}.demo-market-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.demo-market-card{position:relative;overflow:hidden;border:1px solid var(--border);border-radius:18px;padding:13px;background:linear-gradient(180deg,rgba(17,24,33,.84),rgba(11,16,23,.9));box-shadow:0 12px 34px rgba(0,0,0,.18)}.demo-market-card small{display:block;color:var(--muted);font-size:9px;font-weight:900;letter-spacing:.13em}.demo-market-value{display:block;margin-top:8px;font-size:24px;font-weight:950;letter-spacing:-.04em;color:var(--accent)}.demo-market-card.down .demo-market-value,.demo-market-card.down .demo-market-arrow{color:var(--red)}.demo-market-arrow{position:absolute;right:13px;top:12px;color:var(--accent);font-size:22px;font-weight:950;animation:arrowPulse 1.8s ease-in-out infinite}@keyframes arrowPulse{50%{transform:translateY(-2px) scale(1.08)}}.demo-market-line{height:24px;margin-top:9px;border-radius:10px;overflow:hidden;position:relative;background:linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:18px 100%}.demo-market-line:after{content:"";position:absolute;left:-30%;top:50%;width:80%;height:2px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:lineMove 2.4s linear infinite}.demo-market-card.down .demo-market-line:after{background:linear-gradient(90deg,transparent,var(--red),transparent)}@keyframes lineMove{to{transform:translateX(190%)}}
      .demo-market-ticker{overflow:hidden;border:1px solid var(--border);border-radius:16px;background:rgba(255,255,255,.03);padding:10px 0}.demo-market-track{display:flex;gap:10px;min-width:max-content;padding-left:10px;animation:tickerMove 18s linear infinite}.demo-market-pill{padding:7px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);font-size:11px;font-weight:850;white-space:nowrap}.demo-market-pill.up{color:var(--accent)}.demo-market-pill.down{color:var(--red)}@keyframes tickerMove{to{transform:translateX(-50%)}}
      .demo-badge{opacity:.55;font-size:8px;letter-spacing:.14em;margin-top:5px;color:var(--muted)}
      .result-card.demo-reveal{animation:demoReveal .5s cubic-bezier(.2,.85,.2,1)}@keyframes demoReveal{0%{opacity:0;transform:translateY(16px) scale(.97)}65%{opacity:1;transform:translateY(-3px) scale(1.01)}100%{transform:none}}
      .access-card.access-unlocked{animation:accessGlow .7s ease}@keyframes accessGlow{50%{box-shadow:0 0 0 1px rgba(183,255,54,.32),0 0 55px rgba(183,255,54,.18)}}
      @media(max-width:520px){.trading-candles{height:145px;bottom:145px;gap:5px;opacity:.36}.demo-market-value{font-size:21px}}
    `;
    document.head.appendChild(style);

    const bg = document.createElement("div");
    bg.className = "trading-bg";
    bg.setAttribute("aria-hidden","true");
    const heights = [40,74,55,92,48,112,84,61,122,70,136,94];
    bg.innerHTML = `<div class="trading-grid"></div><div class="trading-candles">${heights.map((h,i)=>`<span class="trading-candle ${[1,4,7,9].includes(i)?"down":"up"}" style="height:${h}px;animation-delay:${(i*.16).toFixed(2)}s"></span>`).join("")}</div>`;
    document.body.prepend(bg);

    const shell = document.querySelector(".app-shell");
    const toast = document.getElementById("toast");
    if (shell && !document.querySelector(".demo-market-footer")) {
      const footer = document.createElement("footer");
      footer.className = "demo-market-footer";
      footer.setAttribute("aria-hidden","true");
      footer.innerHTML = `<div class="demo-market-grid">
        ${card("EUR/USD",1.2,3.9,2,false,"%")}
        ${card("MARKET PULSE",62,94,0,false,"%")}
        ${card("USD/JPY",.8,2.4,2,true,"%")}
        ${card("DEMO PNL",120,980,0,false," USD")}
      </div><div class="demo-market-ticker"><div class="demo-market-track">${ticker()}${ticker()}</div></div><div class="demo-badge">SIMULATED UI DATA · NOT LIVE MARKET DATA</div>`;
      shell.insertBefore(footer, toast || null);
    }

    const cards = [...document.querySelectorAll(".demo-market-value")];
    const tickValues = () => cards.forEach((el,i)=>animateValue(el, 850+i*120));
    tickValues();
    setInterval(tickValues, 2800);

    const resultScreen = document.getElementById("screenResult");
    const resultCard = document.getElementById("resultCard");
    if (resultScreen && resultCard) new MutationObserver(()=>{
      if (!resultScreen.classList.contains("active")) return;
      resultCard.classList.remove("demo-reveal"); void resultCard.offsetWidth; resultCard.classList.add("demo-reveal");
    }).observe(resultScreen,{attributes:true,attributeFilter:["class"]});

    const access = document.getElementById("screenAccess");
    const accessCard = access?.querySelector(".access-card");
    if (access && accessCard) new MutationObserver(()=>{
      if (access.querySelectorAll(".access-step.done").length >= 2) {
        accessCard.classList.remove("access-unlocked"); void accessCard.offsetWidth; accessCard.classList.add("access-unlocked");
      }
    }).observe(access,{subtree:true,attributes:true,attributeFilter:["class"]});
  };

  function card(label,min,max,decimals,down,suffix){
    return `<div class="demo-market-card ${down?"down":"up"}"><small>${label}</small><strong class="demo-market-value" data-min="${min}" data-max="${max}" data-decimals="${decimals}" data-down="${down}" data-suffix="${suffix}">0${suffix}</strong><span class="demo-market-arrow">${down?"↘":"↗"}</span><i class="demo-market-line"></i></div>`;
  }
  function ticker(){
    return `<span class="demo-market-pill up">BTC +2.41% ↗</span><span class="demo-market-pill down">USD/CAD -1.18% ↘</span><span class="demo-market-pill up">XAU/USD +4.32% ↗</span><span class="demo-market-pill up">EUR/JPY +1.74% ↗</span><span class="demo-market-pill down">NASDAQ -0.84% ↘</span><span class="demo-market-pill up">SOL +5.20% ↗</span>`;
  }
  function animateValue(el,duration){
    const min=Number(el.dataset.min),max=Number(el.dataset.max),dec=Number(el.dataset.decimals||0),down=el.dataset.down==="true",suffix=el.dataset.suffix||"";
    const target=min+Math.random()*(max-min),start=Number(el.dataset.current||0),t0=performance.now();
    const frame=now=>{const p=Math.min(1,(now-t0)/duration),e=1-Math.pow(1-p,3),v=start+(target-start)*e;el.textContent=(down?"-":"+")+v.toFixed(dec)+suffix;if(p<1)requestAnimationFrame(frame);else el.dataset.current=String(target)};
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true}); else init();
})();
