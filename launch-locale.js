(() => {
  "use strict";
  try {
    const allowed = new Set(["ru","en","de","fr","it","es","pt","ja","hi","id","ko","tr","uk","sv","no","zh"]);
    const params = new URLSearchParams(window.location.search || "");
    window.AI_SIGNAL_SOURCE = String(params.get("src") || "miniapp").slice(0,80);
    let locale = String(params.get("lang") || "").toLowerCase().replace("_","-").split("-")[0];
    if (locale === "ua") locale = "uk";
    if (locale === "cn") locale = "zh";
    if (allowed.has(locale)) {
      window.AI_LAUNCH_LOCALE = locale;
      window.AI_LOCALE_EXPLICIT = true;
      localStorage.setItem("ai_signal_locale", locale);
      const country = ({ru:"ru",en:"us",de:"de",fr:"fr",it:"it",es:"es",pt:"br",ja:"jp",hi:"in",id:"id",ko:"kr",tr:"tr",uk:"ua",sv:"se",no:"no",zh:"cn"})[locale];
      if (country) localStorage.setItem("ai_signal_country", country);
    } else {
      window.AI_LAUNCH_LOCALE = null;
      window.AI_LOCALE_EXPLICIT = false;
    }
  } catch (error) {
    console.warn("Launch locale sync skipped", error);
  }
})();
