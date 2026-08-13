(() => {
  "use strict";

  function startApp() {
    let tg = null;
    try {
      tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
      if (tg) {
        if (typeof tg.ready === "function") tg.ready();
        if (typeof tg.expand === "function") tg.expand();
        if (typeof tg.setHeaderColor === "function") tg.setHeaderColor("#080b10");
        if (typeof tg.setBackgroundColor === "function") tg.setBackgroundColor("#080b10");
      }
    } catch (e) {
      console.warn("Telegram WebApp init skipped", e);
    }

    const state = { image: null, timeframe: "M5", expiration: "3" };
    const $ = (s) => document.querySelector(s);
    const els = {
      input: $("#fileInput"), uploadBox: $("#uploadBox"), previewWrap: $("#previewWrap"),
      preview: $("#preview"), removeImage: $("#removeImage"), analyze: $("#analyzeBtn"),
      loadingPreview: $("#loadingPreview"), loadingText: $("#loadingText"), resultCard: $("#resultCard"),
      resultIcon: $("#resultIcon"), resultTitle: $("#resultTitle"), resultSub: $("#resultSub"),
      confidenceText: $("#confidenceText"), confidenceBar: $("#confidenceBar"), trendText: $("#trendText"),
      paramsText: $("#paramsText"), reasonText: $("#reasonText"), newAnalysis: $("#newAnalysisBtn"),
      toast: $("#toast"), tgBadge: $("#tgBadge")
    };

    const required = ["input","uploadBox","previewWrap","preview","removeImage","analyze","loadingPreview","loadingText","resultCard","resultIcon","resultTitle","resultSub","confidenceText","confidenceBar","trendText","paramsText","reasonText","newAnalysis","toast","tgBadge"];
    if (required.some((k) => !els[k])) {
      console.error("Mini App UI initialization failed: missing element");
      return;
    }

    const I18N = window.AI_I18N || {};
    function normalizeLocale(value) {
      const raw = String(value || "").toLowerCase().replace("_", "-").split("-")[0];
      if (I18N[raw]) return raw;
      if (raw === "ua") return "uk";
      if (raw === "cn") return "zh";
      return "ru";
    }
    function currentLocale() {
      const fromStorage = localStorage.getItem("ai_signal_locale");
      const fromTelegram = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code;
      return normalizeLocale(fromStorage || fromTelegram || navigator.language || "ru");
    }
    function t(key, fallback) {
      const locale = currentLocale();
      const value = I18N[locale] && I18N[locale][key];
      const english = I18N.en && I18N.en[key];
      return value !== undefined ? value : (english !== undefined ? english : fallback);
    }

    els.tgBadge.textContent = tg && tg.initData ? "TELEGRAM" : "BROWSER";
    document.documentElement.dataset.js = "ready";

    els.input.addEventListener("change", (e) => handleFile(e.target.files && e.target.files[0]));
    els.removeImage.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); resetImage(); });
    els.analyze.addEventListener("click", analyze);
    els.newAnalysis.addEventListener("click", () => { resetImage(); showScreen("screenInput"); });

    document.querySelectorAll(".segmented").forEach((group) => {
      group.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-value]");
        if (!btn) return;
        group.querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
        btn.classList.add("selected");
        state[group.dataset.group] = btn.dataset.value;
        haptic("selection");
      });
    });

    ["dragenter", "dragover"].forEach((name) => {
      els.uploadBox.addEventListener(name, (e) => {
        e.preventDefault();
        els.uploadBox.classList.add("dragging");
      });
    });
    ["dragleave", "drop"].forEach((name) => {
      els.uploadBox.addEventListener(name, (e) => {
        e.preventDefault();
        els.uploadBox.classList.remove("dragging");
      });
    });
    els.uploadBox.addEventListener("drop", (e) => handleFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]));

    document.addEventListener("paste", (e) => {
      const items = Array.from((e.clipboardData && e.clipboardData.items) || []);
      const item = items.find((x) => x.type && x.type.indexOf("image/") === 0);
      if (item) handleFile(item.getAsFile());
    });

    async function handleFile(file) {
      if (!file) return;
      if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return toast(t("supported", "JPG, PNG and WEBP are supported."));
      if (file.size > 12 * 1024 * 1024) return toast(t("sourceTooLarge", "The source file is too large."));
      els.uploadBox.classList.add("is-reading");
      haptic("impact");
      try {
        const dataUrl = await compressImage(file, 1600, 0.84);
        if (dataUrl.length > 3000000) return toast(t("compressFailed", "The image could not be reduced enough."));
        state.image = dataUrl;
        els.preview.src = dataUrl;
        els.loadingPreview.src = dataUrl;
        els.uploadBox.classList.add("hidden");
        els.previewWrap.classList.remove("hidden");
        els.analyze.disabled = false;
        haptic("success");
      } catch (e) {
        console.error(e);
        toast(t("readFailed", "Could not read the image."));
      } finally {
        els.uploadBox.classList.remove("is-reading");
      }
    }

    function resetImage() {
      state.image = null;
      els.input.value = "";
      els.preview.removeAttribute("src");
      els.uploadBox.classList.remove("hidden");
      els.previewWrap.classList.add("hidden");
      els.analyze.disabled = true;
      els.analyze.classList.remove("is-launching");
    }

    async function analyze() {
      if (!state.image) return toast(t("uploadFirst", "Upload a chart screenshot first."));

      const startedAt = performance.now();
      const minLoadingMs = 2200;
      els.analyze.classList.add("is-launching");
      setTimeout(() => els.analyze.classList.remove("is-launching"), 720);

      showScreen("screenLoading");
      haptic("impact");

      const fallbackMessages = ["Checking price structure…", "Reading the local trend…", "Evaluating setup quality…"];
      const messages = Array.isArray(t("loadingMessages", fallbackMessages)) ? t("loadingMessages", fallbackMessages) : fallbackMessages;
      let i = 0;
      els.loadingText.textContent = messages[0] || fallbackMessages[0];

      const textTimer = setInterval(() => {
        i = (i + 1) % messages.length;
        els.loadingText.classList.add("is-changing");
        setTimeout(() => {
          els.loadingText.textContent = messages[i];
          els.loadingText.classList.remove("is-changing");
        }, 120);
      }, 1050);

      const hapticTimer = setInterval(() => haptic("selection"), 1250);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: state.image,
            timeframe: state.timeframe,
            expiration: state.expiration,
            locale: currentLocale(),
            tgInitData: tg && tg.initData ? tg.initData : ""
          })
        });

        let data;
        try { data = await response.json(); }
        catch { throw new Error(t("serverInvalid", "The server returned an invalid response.")); }

        if (!response.ok) {
          throw new Error(readableApiError(data && data.error, data && data.reason, data && data.message));
        }

        const elapsed = performance.now() - startedAt;
        if (elapsed < minLoadingMs) await delay(minLoadingMs - elapsed);

        renderResult(data.result, data.meta);
        haptic(data.result.signal === "NO_SIGNAL" ? "warning" : "success");
        showScreen("screenResult");
      } catch (error) {
        console.error(error);
        showScreen("screenInput");
        toast(error.message || t("retry", "Analysis error. Try again."));
        haptic("error");
      } finally {
        clearInterval(textTimer);
        clearInterval(hapticTimer);
      }
    }

    function renderResult(result, meta) {
      els.resultCard.className = "result-card";
      els.resultIcon.className = "result-icon";

      if (result.signal === "UP") {
        els.resultCard.classList.add("up");
        els.resultIcon.classList.add("asset-arrow", "arrow-up");
        els.resultIcon.textContent = "";
        els.resultTitle.textContent = t("up", "UP");
        els.resultSub.textContent = t("directionShown", "Direction is visible on the current screenshot");
      } else if (result.signal === "DOWN") {
        els.resultCard.classList.add("down");
        els.resultIcon.classList.add("asset-arrow", "arrow-down");
        els.resultIcon.textContent = "";
        els.resultTitle.textContent = t("down", "DOWN");
        els.resultSub.textContent = t("directionShown", "Direction is visible on the current screenshot");
      } else {
        els.resultCard.classList.add("neutral");
        els.resultIcon.textContent = "•";
        els.resultTitle.textContent = t("noSignal", "NO SIGNAL");
        els.resultSub.textContent = result.invalid_chart ? t("invalidChart", "The chart could not be read reliably") : t("skipSetup", "Better to skip this setup");
      }

      els.confidenceText.textContent = String(result.confidence) + "%";
      els.confidenceBar.style.width = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        els.confidenceBar.style.width = String(result.confidence) + "%";
      }));

      els.trendText.textContent = result.trend || "—";
      els.paramsText.textContent = meta.timeframe + " · " + meta.expiration_minutes + " " + t("minShort", "min");
      els.reasonText.textContent = result.reason || "—";
    }

    function showScreen(id) {
      document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
      const next = document.getElementById(id);
      if (next) next.classList.add("active");
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { window.scrollTo(0, 0); }
    }

    function toast(message) {
      els.toast.textContent = message;
      els.toast.classList.add("show");
      clearTimeout(toast.t);
      toast.t = setTimeout(() => els.toast.classList.remove("show"), 3200);
    }

    function haptic(type) {
      try {
        if (tg && tg.HapticFeedback) {
          if (type === "selection" && typeof tg.HapticFeedback.selectionChanged === "function") {
            tg.HapticFeedback.selectionChanged();
          } else if (["success", "warning", "error"].includes(type) && typeof tg.HapticFeedback.notificationOccurred === "function") {
            tg.HapticFeedback.notificationOccurred(type);
          } else if (typeof tg.HapticFeedback.impactOccurred === "function") {
            tg.HapticFeedback.impactOccurred("light");
          }
          return;
        }
        if (navigator.vibrate) {
          navigator.vibrate(type === "success" ? 14 : type === "error" ? [18, 30, 18] : 7);
        }
      } catch (e) {}
    }

    function readableApiError(error, reason, serverMessage) {
      if (error === "telegram_auth_failed") {
        if (reason === "expired_init_data") return t("sessionExpired", "Telegram session expired. Close and reopen the Mini App.");
        return t("telegramRequired", "Open the app inside Telegram to analyze.");
      }
      if (error === "image_too_large") return t("imageTooLarge", "The image is too large.");
      if (error === "openai_error") return t("modelUnavailable", "The model did not respond. Try again.");
      if (error === "missing_openai_api_key") return t("genericError", "Analysis failed.");
      return serverMessage || t("genericError", "Analysis failed.");
    }

    function compressImage(file, maxSide, quality) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) { URL.revokeObjectURL(url); reject(new Error("canvas_unavailable")); return; }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad_image")); };
        img.src = url;
      });
    }

    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startApp, { once: true });
  else startApp();
})();
