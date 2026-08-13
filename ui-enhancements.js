(() => {
  "use strict";

  const LANGS = [
    ["ru","ru","Русский"],["us","en","English"],["gb","en","English"],["ca","en","English"],["au","en","English"],
    ["de","de","Deutsch"],["fr","fr","Français"],["it","it","Italiano"],["es","es","Español"],["mx","es","Español"],["ar","es","Español"],
    ["br","pt","Português"],["jp","ja","日本語"],["in","hi","हिन्दी"],["id","id","Bahasa Indonesia"],["kr","ko","한국어"],
    ["tr","tr","Türkçe"],["ua","uk","Українська"],["se","sv","Svenska"],["no","no","Norsk"],["cn","zh","中文"]
  ];

  const I18N = window.AI_I18N || {};
  const q = (s) => document.querySelector(s);
  let tg = null;
  try { tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null; } catch {}

  function normalizeLocale(value) {
    const raw = String(value || "").toLowerCase().replace("_","-").split("-")[0];
    if (I18N[raw]) return raw;
    if (raw === "ua") return "uk";
    if (raw === "cn") return "zh";
    return "ru";
  }

  function locale() {
    const stored = localStorage.getItem("ai_signal_locale");
    const telegram = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code;
    return normalizeLocale(stored || telegram || navigator.language || "ru");
  }

  function tr(key) {
    const l = locale();
    return (I18N[l] && I18N[l][key]) ?? (I18N.en && I18N.en[key]) ?? key;
  }

  function representativeCountry(l) {
    return ({ru:"ru",en:"us",de:"de",fr:"fr",it:"it",es:"es",pt:"br",ja:"jp",hi:"in",id:"id",ko:"kr",tr:"tr",uk:"ua",sv:"se",no:"no",zh:"cn"})[l] || "us";
  }

  function currentCountry() {
    return localStorage.getItem("ai_signal_country") || representativeCountry(locale());
  }

  function flagUrl(country) {
    return `https://flagcdn.com/w80/${country}.png`;
  }

  function setText(node, value) {
    if (node && node.textContent !== String(value)) node.textContent = value;
  }

  function haptic(type = "light") {
    try {
      if (tg && tg.HapticFeedback) {
        if (type === "selection" && tg.HapticFeedback.selectionChanged) tg.HapticFeedback.selectionChanged();
        else if (tg.HapticFeedback.impactOccurred) tg.HapticFeedback.impactOccurred("light");
      } else if (navigator.vibrate) navigator.vibrate(7);
    } catch {}
  }

  function setTheme(value, save = true) {
    const theme = value === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    const switcher = q("#themeToggle");
    if (switcher) {
      switcher.dataset.mode = theme;
      switcher.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      switcher.setAttribute("aria-label", tr("theme"));
    }

    const color = theme === "dark" ? "#080b10" : "#f3f6f9";
    const meta = q("#themeColorMeta");
    if (meta) meta.setAttribute("content", color);

    try {
      if (tg && tg.setHeaderColor) tg.setHeaderColor(color);
      if (tg && tg.setBackgroundColor) tg.setBackgroundColor(color);
    } catch {}

    if (save) localStorage.setItem("ai_signal_theme", theme);
  }

  function translateStatic() {
    const map = [
      [".brand-subtitle","brandSubtitle"],[".eyebrow","eyebrow"],[".hero p","heroText"],
      [".upload-title","uploadTitle"],[".upload-note","uploadNote"],["#removeImage","remove"],
      [".setting-panel:nth-child(1) .setting-head span:first-child","timeframe"],
      [".setting-panel:nth-child(1) .muted","chart"],
      [".setting-panel:nth-child(2) .setting-head span:first-child","expiration"],
      [".setting-panel:nth-child(2) .muted","minutes"],
      ["#analyzeBtn span:last-child","analyze"],["#screenInput .risk-note","riskInput"],
      [".scanner-card h2","loadingTitle"],[".result-kicker","resultKicker"],
      [".confidence-row span","confidence"],[".result-info>div:first-child span","trend"],
      [".result-info>div:nth-child(2) span","params"],[".reason-box span","why"],
      ["#newAnalysisBtn","newAnalysis"],["#screenResult .risk-note","riskResult"]
    ];

    map.forEach(([selector,key]) => setText(q(selector), tr(key)));

    const h1 = q(".hero h1");
    if (h1) h1.innerHTML = `${tr("heroTitle1")}<br><em>${tr("heroTitle2")}</em>`;
    document.documentElement.lang = locale();

    const switcher = q("#themeToggle");
    if (switcher) switcher.setAttribute("aria-label", tr("theme"));

    translateResultChrome();
  }

  function translateResultChrome() {
    const card = q("#resultCard");
    if (!card) return;
    const title = q("#resultTitle");
    const sub = q("#resultSub");
    if (card.classList.contains("up")) {
      setText(title, tr("up"));
      setText(sub, tr("directionShown"));
    } else if (card.classList.contains("down")) {
      setText(title, tr("down"));
      setText(sub, tr("directionShown"));
    } else {
      setText(title, tr("noSignal"));
    }
  }

  function enhanceBrand() {
    const mark = q(".brand-mark");
    if (!mark) return;
    const img = document.createElement("img");
    img.className = "brand-logo";
    img.src = "/logo-v2.png?v=2";
    img.alt = "AI SIGNAL";
    mark.replaceWith(img);
  }

  function buildHeader() {
    const host = q("#tgBadge");
    if (!host) return;
    host.textContent = "";
    host.className = "topbar-actions";

    const theme = document.createElement("button");
    theme.id = "themeToggle";
    theme.className = "theme-switch";
    theme.type = "button";
    theme.innerHTML = `
      <span class="theme-icon theme-sun" aria-hidden="true">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.3"></circle><path d="M12 2.1v2.2M12 19.7v2.2M4.99 4.99l1.55 1.55M17.46 17.46l1.55 1.55M2.1 12h2.2M19.7 12h2.2M4.99 19.01l1.55-1.55M17.46 6.54l1.55-1.55"></path></svg>
      </span>
      <span class="theme-icon theme-moon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M20.1 15.3A8.4 8.4 0 0 1 8.7 3.9 8.6 8.6 0 1 0 20.1 15.3Z"></path></svg>
      </span>
      <span class="theme-knob" aria-hidden="true"></span>
    `;
    theme.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next);
      haptic();
    });

    const wrap = document.createElement("div");
    wrap.className = "lang-picker";

    const toggle = document.createElement("button");
    toggle.className = "lang-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-haspopup", "menu");
    toggle.innerHTML = `<img class="flag-img" alt=""><span class="lang-code"></span><span class="chevron">⌄</span>`;

    const menu = document.createElement("div");
    menu.className = "lang-menu hidden";
    menu.setAttribute("role", "menu");

    function paint() {
      const c = currentCountry();
      const img = toggle.querySelector(".flag-img");
      if (img) {
        img.src = flagUrl(c);
        img.alt = c.toUpperCase();
      }
      setText(toggle.querySelector(".lang-code"), c.toUpperCase());
    }

    LANGS.forEach(([country, language, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lang-option";
      button.setAttribute("role", "menuitem");
      button.innerHTML = `<img class="flag-img" src="${flagUrl(country)}" alt="${country.toUpperCase()}"><b>${country.toUpperCase()}</b><small>${label}</small>`;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        localStorage.setItem("ai_signal_locale", language);
        localStorage.setItem("ai_signal_country", country);
        paint();
        translateStatic();
        menu.classList.add("hidden");
        haptic("selection");
      });
      menu.appendChild(button);
    });

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.classList.toggle("hidden");
      haptic();
    });

    document.addEventListener("click", () => menu.classList.add("hidden"));
    menu.addEventListener("click", (event) => event.stopPropagation());

    wrap.append(toggle, menu);
    host.append(theme, wrap);
    paint();
  }

  function init() {
    enhanceBrand();
    buildHeader();
    const initialTheme = localStorage.getItem("ai_signal_theme") || (tg && tg.colorScheme) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initialTheme, false);
    translateStatic();

    const resultCard = q("#resultCard");
    if (resultCard) {
      new MutationObserver(() => translateResultChrome()).observe(resultCard, { attributes: true, attributeFilter: ["class"] });
    }
  }

  window.AISignalUI = { locale, tr, haptic, setTheme, translateStatic, translateResultChrome };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
