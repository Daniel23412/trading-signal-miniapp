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

    els.tgBadge.textContent = tg && tg.initData ? "TELEGRAM" : "BROWSER";
    document.documentElement.dataset.js = "ready";

    // The upload area is a native <label for=fileInput>, so iOS can open Photos
    // without depending on a synthetic click. We only prevent drag/drop defaults here.
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
      if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return toast("Поддерживаются JPG, PNG и WEBP.");
      if (file.size > 12 * 1024 * 1024) return toast("Исходный файл слишком большой.");
      try {
        const dataUrl = await compressImage(file, 1600, 0.84);
        if (dataUrl.length > 3000000) return toast("Не удалось достаточно уменьшить изображение.");
        state.image = dataUrl;
        els.preview.src = dataUrl;
        els.loadingPreview.src = dataUrl;
        els.uploadBox.classList.add("hidden");
        els.previewWrap.classList.remove("hidden");
        els.analyze.disabled = false;
        haptic("success");
      } catch (e) {
        console.error(e);
        toast("Не удалось прочитать изображение.");
      }
    }

    function resetImage() {
      state.image = null;
      els.input.value = "";
      els.preview.removeAttribute("src");
      els.uploadBox.classList.remove("hidden");
      els.previewWrap.classList.add("hidden");
      els.analyze.disabled = true;
    }

    async function analyze() {
      if (!state.image) return toast("Сначала загрузите скрин графика.");
      showScreen("screenLoading");
      haptic("impact");
      const messages = ["Проверяю структуру цены…", "Смотрю локальный тренд…", "Оцениваю качество сетапа…"];
      let i = 0;
      const timer = setInterval(() => { i = (i + 1) % messages.length; els.loadingText.textContent = messages[i]; }, 1100);
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: state.image,
            timeframe: state.timeframe,
            expiration: state.expiration,
            tgInitData: tg && tg.initData ? tg.initData : ""
          })
        });
        let data;
        try { data = await response.json(); }
        catch { throw new Error("Сервер вернул некорректный ответ."); }
        if (!response.ok) throw new Error((data && data.message) || readableApiError(data && data.error, data && data.reason));
        renderResult(data.result, data.meta);
        haptic(data.result.signal === "NO_SIGNAL" ? "warning" : "success");
        showScreen("screenResult");
      } catch (error) {
        console.error(error);
        showScreen("screenInput");
        toast(error.message || "Ошибка анализа. Попробуйте ещё раз.");
        haptic("error");
      } finally {
        clearInterval(timer);
      }
    }

    function renderResult(result, meta) {
      els.resultCard.className = "result-card";
      if (result.signal === "UP") {
        els.resultCard.classList.add("up");
        els.resultIcon.textContent = "↑";
        els.resultTitle.textContent = "ВВЕРХ";
        els.resultSub.textContent = "Направление выражено на текущем скриншоте";
      } else if (result.signal === "DOWN") {
        els.resultCard.classList.add("down");
        els.resultIcon.textContent = "↓";
        els.resultTitle.textContent = "ВНИЗ";
        els.resultSub.textContent = "Направление выражено на текущем скриншоте";
      } else {
        els.resultCard.classList.add("neutral");
        els.resultIcon.textContent = "•";
        els.resultTitle.textContent = "НЕТ СИГНАЛА";
        els.resultSub.textContent = result.invalid_chart ? "Не удалось надёжно прочитать график" : "Лучше пропустить этот сетап";
      }
      els.confidenceText.textContent = String(result.confidence) + "%";
      requestAnimationFrame(() => { els.confidenceBar.style.width = String(result.confidence) + "%"; });
      els.trendText.textContent = result.trend;
      els.paramsText.textContent = meta.timeframe + " · " + meta.expiration_minutes + " мин";
      els.reasonText.textContent = result.reason;
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
        if (!tg || !tg.HapticFeedback) return;
        if (type === "selection" && typeof tg.HapticFeedback.selectionChanged === "function") tg.HapticFeedback.selectionChanged();
        else if (["success", "warning", "error"].includes(type) && typeof tg.HapticFeedback.notificationOccurred === "function") tg.HapticFeedback.notificationOccurred(type);
        else if (typeof tg.HapticFeedback.impactOccurred === "function") tg.HapticFeedback.impactOccurred("light");
      } catch (e) {}
    }

    function readableApiError(error, reason) {
      if (error === "telegram_auth_failed") {
        if (reason === "expired_init_data") return "Сессия Telegram устарела. Закройте и заново откройте Mini App.";
        return "Для анализа откройте приложение внутри Telegram.";
      }
      if (error === "image_too_large") return "Изображение слишком большое.";
      if (error === "openai_error") return "Модель временно не ответила. Попробуйте ещё раз.";
      return "Не удалось выполнить анализ.";
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
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startApp, { once: true });
  else startApp();
})();
