(() => {
  "use strict";
  try {
    const allowed = new Set(["ru","en","de","fr","it","es","pt","ja","hi","id","ko","tr","uk","sv","no","zh"]);
    const params = new URLSearchParams(window.location.search || "");
    let locale = String(params.get("lang") || "").toLowerCase().replace("_","-").split("-")[0];
    if (locale === "ua") locale = "uk";
    if (locale === "cn") locale = "zh";
    if (allowed.has(locale)) {
      localStorage.setItem("ai_signal_locale", locale);
      const country = ({ru:"ru",en:"us",de:"de",fr:"fr",it:"it",es:"es",pt:"br",ja:"jp",hi:"in",id:"id",ko:"kr",tr:"tr",uk:"ua",sv:"se",no:"no",zh:"cn"})[locale];
      if (country) localStorage.setItem("ai_signal_country", country);
    }
  } catch (error) {
    console.warn("Launch locale sync skipped", error);
  }
})();
