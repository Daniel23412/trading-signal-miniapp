(() => {
  "use strict";

  function startApp() {
    let tg = null;
    try {
      tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
      if (tg) {
        if (typeof tg.ready === "function") tg.ready();
        if (typeof tg.expand === "function") tg.expand();
        const canStyleTelegram = Boolean(tg.initData) &&
          (typeof tg.isVersionAtLeast !== "function" || tg.isVersionAtLeast("6.1"));
        if (canStyleTelegram && typeof tg.setHeaderColor === "function") tg.setHeaderColor("#080b10");
        if (canStyleTelegram && typeof tg.setBackgroundColor === "function") tg.setBackgroundColor("#080b10");
      }
    } catch (e) {
      console.warn("Telegram WebApp init skipped", e);
    }

    const state = {
      image: null,
      timeframe: "M5",
      expiration: "3",
      access: null,
      accessMode: "",
      accessChecking: false,
      referralUrl: null,
      geo: null,
      history: [],
      lastResult: null,
      lastMeta: null,
      toastKey: null,
      toastDictionary: "ui"
    };

    const ACCESS_TEXT = {
      ru: {
        title: "Открой доступ к AI SIGNAL",
        desc: "Зарегистрируйся по ссылке и внеси первый депозит минимум $5. После подтверждения сигналы откроются автоматически.",
        registration: "Регистрация",
        deposit: "Первый депозит от $5",
        waiting: "Ожидает подтверждения",
        confirmed: "Подтверждено",
        depositSeen: "Получено: ${amount}",
        register: "ЗАРЕГИСТРИРОВАТЬСЯ",
        depositBtn: "ВНЕСТИ ДЕПОЗИТ",
        check: "ПРОВЕРИТЬ ДОСТУП",
        checking: "ПРОВЕРЯЮ…",
        hint: "После регистрации и депозита вернись в бот — проверка обновится автоматически.",
        telegramOnly: "Открой Mini App внутри Telegram, чтобы подтвердить аккаунт.",
        unavailable: "Проверка доступа временно недоступна. Попробуй ещё раз через минуту.",
        granted: "Доступ открыт ✅",
        opening: "Открываю страницу регистрации…"
      },
      en: {
        title: "Unlock AI SIGNAL",
        desc: "Register through the link and make a first deposit of at least $5. Signals unlock automatically after confirmation.",
        registration: "Registration",
        deposit: "First deposit from $5",
        waiting: "Waiting for confirmation",
        confirmed: "Confirmed",
        depositSeen: "Received: ${amount}",
        register: "REGISTER",
        depositBtn: "MAKE A DEPOSIT",
        check: "CHECK ACCESS",
        checking: "CHECKING…",
        hint: "After registration and deposit, return to the bot — access will refresh automatically.",
        telegramOnly: "Open the Mini App inside Telegram to verify your account.",
        unavailable: "Access verification is temporarily unavailable. Try again in a minute.",
        granted: "Access granted ✅",
        opening: "Opening registration…"
      },
      de: {
        title: "AI SIGNAL freischalten",
        desc: "Registriere dich über den Link und tätige eine erste Einzahlung von mindestens $5. Danach wird der Zugang automatisch freigeschaltet.",
        registration: "Registrierung",
        deposit: "Erste Einzahlung ab $5",
        waiting: "Warte auf Bestätigung",
        confirmed: "Bestätigt",
        depositSeen: "Erhalten: ${amount}",
        register: "REGISTRIEREN",
        depositBtn: "EINZAHLEN",
        check: "ZUGANG PRÜFEN",
        checking: "PRÜFE…",
        hint: "Nach Registrierung und Einzahlung zum Bot zurückkehren — der Status wird automatisch aktualisiert.",
        telegramOnly: "Öffne die Mini App in Telegram, um dein Konto zu bestätigen.",
        unavailable: "Die Zugangsprüfung ist vorübergehend nicht verfügbar.",
        granted: "Zugang freigeschaltet ✅",
        opening: "Registrierung wird geöffnet…"
      },
      fr: {
        title: "Débloquer AI SIGNAL",
        desc: "Inscris-toi via le lien et effectue un premier dépôt d'au moins 5 $. L'accès sera ensuite activé automatiquement.",
        registration: "Inscription",
        deposit: "Premier dépôt dès 5 $",
        waiting: "En attente de confirmation",
        confirmed: "Confirmé",
        depositSeen: "Reçu : ${amount}",
        register: "S'INSCRIRE",
        depositBtn: "DÉPOSER",
        check: "VÉRIFIER L'ACCÈS",
        checking: "VÉRIFICATION…",
        hint: "Après l'inscription et le dépôt, reviens dans le bot — le statut se mettra à jour automatiquement.",
        telegramOnly: "Ouvre la Mini App dans Telegram pour vérifier ton compte.",
        unavailable: "La vérification d'accès est temporairement indisponible.",
        granted: "Accès activé ✅",
        opening: "Ouverture de l'inscription…"
      },
      it: {
        title: "Sblocca AI SIGNAL",
        desc: "Registrati tramite il link ed effettua un primo deposito di almeno $5. L'accesso verrà attivato automaticamente.",
        registration: "Registrazione",
        deposit: "Primo deposito da $5",
        waiting: "In attesa di conferma",
        confirmed: "Confermato",
        depositSeen: "Ricevuto: ${amount}",
        register: "REGISTRATI",
        depositBtn: "DEPOSITA",
        check: "VERIFICA ACCESSO",
        checking: "VERIFICA…",
        hint: "Dopo registrazione e deposito, torna nel bot: lo stato si aggiornerà automaticamente.",
        telegramOnly: "Apri la Mini App dentro Telegram per verificare il tuo account.",
        unavailable: "La verifica dell'accesso non è temporaneamente disponibile.",
        granted: "Accesso attivo ✅",
        opening: "Apro la registrazione…"
      },
      es: {
        title: "Desbloquea AI SIGNAL",
        desc: "Regístrate mediante el enlace y realiza un primer depósito de al menos $5. El acceso se activará automáticamente.",
        registration: "Registro",
        deposit: "Primer depósito desde $5",
        waiting: "Esperando confirmación",
        confirmed: "Confirmado",
        depositSeen: "Recibido: ${amount}",
        register: "REGISTRARSE",
        depositBtn: "DEPOSITAR",
        check: "COMPROBAR ACCESO",
        checking: "COMPROBANDO…",
        hint: "Después del registro y depósito, vuelve al bot: el estado se actualizará automáticamente.",
        telegramOnly: "Abre la Mini App dentro de Telegram para verificar tu cuenta.",
        unavailable: "La verificación de acceso no está disponible temporalmente.",
        granted: "Acceso habilitado ✅",
        opening: "Abriendo registro…"
      },
      pt: {
        title: "Desbloqueie o AI SIGNAL",
        desc: "Cadastre-se pelo link e faça um primeiro depósito de pelo menos $5. O acesso será liberado automaticamente.",
        registration: "Cadastro",
        deposit: "Primeiro depósito a partir de $5",
        waiting: "Aguardando confirmação",
        confirmed: "Confirmado",
        depositSeen: "Recebido: ${amount}",
        register: "CADASTRAR",
        depositBtn: "DEPOSITAR",
        check: "VERIFICAR ACESSO",
        checking: "VERIFICANDO…",
        hint: "Depois do cadastro e depósito, volte ao bot — o status será atualizado automaticamente.",
        telegramOnly: "Abra o Mini App dentro do Telegram para verificar sua conta.",
        unavailable: "A verificação de acesso está temporariamente indisponível.",
        granted: "Acesso liberado ✅",
        opening: "Abrindo cadastro…"
      },
      id: {
        title: "Buka akses AI SIGNAL",
        desc: "Daftar melalui tautan dan lakukan deposit pertama minimal $5. Akses sinyal akan terbuka otomatis setelah terkonfirmasi.",
        registration: "Registrasi",
        deposit: "Deposit pertama minimal $5",
        waiting: "Menunggu konfirmasi",
        confirmed: "Terkonfirmasi",
        depositSeen: "Diterima: ${amount}",
        register: "DAFTAR",
        depositBtn: "LAKUKAN DEPOSIT",
        check: "CEK AKSES",
        checking: "MEMERIKSA…",
        hint: "Setelah registrasi dan deposit, kembali ke bot — status akan diperbarui otomatis.",
        telegramOnly: "Buka Mini App di dalam Telegram untuk memverifikasi akun.",
        unavailable: "Pemeriksaan akses sementara tidak tersedia. Coba lagi sebentar.",
        granted: "Akses terbuka ✅",
        opening: "Membuka halaman registrasi…"
      },
      tr: {
        title: "AI SIGNAL erişimini aç",
        desc: "Bağlantı üzerinden kayıt ol ve en az $5 ilk para yatırma işlemi yap. Onaydan sonra erişim otomatik açılır.",
        registration: "Kayıt",
        deposit: "En az $5 ilk yatırım",
        waiting: "Onay bekleniyor",
        confirmed: "Onaylandı",
        depositSeen: "Alındı: ${amount}",
        register: "KAYIT OL",
        depositBtn: "PARA YATIR",
        check: "ERİŞİMİ KONTROL ET",
        checking: "KONTROL EDİLİYOR…",
        hint: "Kayıt ve yatırımdan sonra bota dön — durum otomatik güncellenecek.",
        telegramOnly: "Hesabını doğrulamak için Mini App'i Telegram içinde aç.",
        unavailable: "Erişim kontrolü geçici olarak kullanılamıyor.",
        granted: "Erişim açıldı ✅",
        opening: "Kayıt sayfası açılıyor…"
      },
      uk: {
        title: "Відкрий доступ до AI SIGNAL",
        desc: "Зареєструйся за посиланням і внеси перший депозит щонайменше $5. Після підтвердження доступ відкриється автоматично.",
        registration: "Реєстрація",
        deposit: "Перший депозит від $5",
        waiting: "Очікує підтвердження",
        confirmed: "Підтверджено",
        depositSeen: "Отримано: ${amount}",
        register: "ЗАРЕЄСТРУВАТИСЯ",
        depositBtn: "ВНЕСТИ ДЕПОЗИТ",
        check: "ПЕРЕВІРИТИ ДОСТУП",
        checking: "ПЕРЕВІРЯЮ…",
        hint: "Після реєстрації та депозиту повернися в бот — статус оновиться автоматично.",
        telegramOnly: "Відкрий Mini App всередині Telegram для підтвердження акаунта.",
        unavailable: "Перевірка доступу тимчасово недоступна.",
        granted: "Доступ відкрито ✅",
        opening: "Відкриваю реєстрацію…"
      },
      ja: {
        title: "AI SIGNALへのアクセスを解除",
        desc: "リンクから登録し、初回入金を5ドル以上行ってください。確認後、自動的にアクセスが有効になります。",
        registration: "登録",
        deposit: "初回入金 5ドル以上",
        waiting: "確認待ち",
        confirmed: "確認済み",
        depositSeen: "入金確認: ${amount}",
        register: "登録する",
        depositBtn: "入金する",
        check: "アクセス確認",
        checking: "確認中…",
        hint: "登録と入金後にボットへ戻ると、状態が自動更新されます。",
        telegramOnly: "アカウント確認のためTelegram内でMini Appを開いてください。",
        unavailable: "アクセス確認は一時的に利用できません。",
        granted: "アクセス有効 ✅",
        opening: "登録ページを開いています…"
      },
      hi: {
        title: "AI SIGNAL एक्सेस अनलॉक करें",
        desc: "लिंक से रजिस्टर करें और कम से कम $5 का पहला डिपॉजिट करें। पुष्टि के बाद एक्सेस अपने-आप खुल जाएगा।",
        registration: "रजिस्ट्रेशन",
        deposit: "कम से कम $5 पहला डिपॉजिट",
        waiting: "पुष्टि की प्रतीक्षा",
        confirmed: "पुष्टि हो गई",
        depositSeen: "प्राप्त: ${amount}",
        register: "रजिस्टर करें",
        depositBtn: "डिपॉजिट करें",
        check: "एक्सेस जांचें",
        checking: "जांच रहा है…",
        hint: "रजिस्ट्रेशन और डिपॉजिट के बाद बॉट पर लौटें — स्टेटस अपने-आप अपडेट होगा।",
        telegramOnly: "अकाउंट सत्यापित करने के लिए Mini App को Telegram में खोलें।",
        unavailable: "एक्सेस जांच अस्थायी रूप से उपलब्ध नहीं है।",
        granted: "एक्सेस खुल गया ✅",
        opening: "रजिस्ट्रेशन खोल रहा है…"
      },
      ko: {
        title: "AI SIGNAL 액세스 열기",
        desc: "링크로 가입하고 첫 입금을 최소 $5 진행하세요. 확인 후 액세스가 자동으로 열립니다.",
        registration: "가입",
        deposit: "첫 입금 최소 $5",
        waiting: "확인 대기 중",
        confirmed: "확인됨",
        depositSeen: "입금 확인: ${amount}",
        register: "가입하기",
        depositBtn: "입금하기",
        check: "액세스 확인",
        checking: "확인 중…",
        hint: "가입 및 입금 후 봇으로 돌아오면 상태가 자동 업데이트됩니다.",
        telegramOnly: "계정 확인을 위해 Telegram 안에서 Mini App을 열어주세요.",
        unavailable: "액세스 확인을 일시적으로 사용할 수 없습니다.",
        granted: "액세스 활성화 ✅",
        opening: "가입 페이지를 여는 중…"
      },
      sv: {
        title: "Lås upp AI SIGNAL",
        desc: "Registrera dig via länken och gör en första insättning på minst $5. Åtkomsten öppnas automatiskt efter bekräftelse.",
        registration: "Registrering",
        deposit: "Första insättning minst $5",
        waiting: "Väntar på bekräftelse",
        confirmed: "Bekräftat",
        depositSeen: "Mottaget: ${amount}",
        register: "REGISTRERA",
        depositBtn: "GÖR INSÄTTNING",
        check: "KONTROLLERA ÅTKOMST",
        checking: "KONTROLLERAR…",
        hint: "Efter registrering och insättning, återvänd till boten — status uppdateras automatiskt.",
        telegramOnly: "Öppna Mini App i Telegram för att verifiera kontot.",
        unavailable: "Åtkomstkontrollen är tillfälligt otillgänglig.",
        granted: "Åtkomst öppnad ✅",
        opening: "Öppnar registreringen…"
      },
      no: {
        title: "Lås opp AI SIGNAL",
        desc: "Registrer deg via lenken og gjør et første innskudd på minst $5. Tilgangen åpnes automatisk etter bekreftelse.",
        registration: "Registrering",
        deposit: "Første innskudd minst $5",
        waiting: "Venter på bekreftelse",
        confirmed: "Bekreftet",
        depositSeen: "Mottatt: ${amount}",
        register: "REGISTRER",
        depositBtn: "GJØR INNSKUDD",
        check: "SJEKK TILGANG",
        checking: "SJEKKER…",
        hint: "Etter registrering og innskudd, gå tilbake til boten — status oppdateres automatisk.",
        telegramOnly: "Åpne Mini App i Telegram for å bekrefte kontoen.",
        unavailable: "Tilgangskontroll er midlertidig utilgjengelig.",
        granted: "Tilgang åpnet ✅",
        opening: "Åpner registrering…"
      },
      zh: {
        title: "解锁 AI SIGNAL",
        desc: "通过链接注册并完成至少 5 美元的首次入金。确认后将自动开通信号权限。",
        registration: "注册",
        deposit: "首次入金至少 5 美元",
        waiting: "等待确认",
        confirmed: "已确认",
        depositSeen: "已收到：${amount}",
        register: "注册",
        depositBtn: "入金",
        check: "检查权限",
        checking: "检查中…",
        hint: "注册并入金后返回机器人，状态会自动更新。",
        telegramOnly: "请在 Telegram 内打开 Mini App 以验证账户。",
        unavailable: "权限检查暂时不可用。",
        granted: "权限已开通 ✅",
        opening: "正在打开注册页面…"
      }
    };

    const $ = (s) => document.querySelector(s);
    const els = {
      screenAccess: $("#screenAccess"),
      screenSuccess: $("#screenSuccess"),
      screenInput: $("#screenInput"),
      screenLoading: $("#screenLoading"),
      screenResult: $("#screenResult"),
      accessTitle: $("#accessTitle"),
      accessDesc: $("#accessDesc"),
      accessRegStep: $("#accessRegStep"),
      accessRegTitle: $("#accessRegTitle"),
      accessRegStatus: $("#accessRegStatus"),
      accessDepStep: $("#accessDepStep"),
      accessDepTitle: $("#accessDepTitle"),
      accessDepStatus: $("#accessDepStatus"),
      registerBtn: $("#registerBtn"),
      registerBtnText: $("#registerBtnText"),
      checkAccessBtn: $("#checkAccessBtn"),
      accessHint: $("#accessHint"),

      successKicker: $("#successKicker"),
      successTitle: $("#successTitle"),
      successDesc: $("#successDesc"),
      successRegLabel: $("#successRegLabel"),
      successDepLabel: $("#successDepLabel"),
      successReg: $("#successReg"),
      successDep: $("#successDep"),
      startAnalysisBtn: $("#startAnalysisBtn"),

      accessSummaryTitle: $("#accessSummaryTitle"),
      accessActiveLabel: $("#accessActiveLabel"),
      summaryRegLabel: $("#summaryRegLabel"),
      summaryRegValue: $("#summaryRegValue"),
      summaryDepLabel: $("#summaryDepLabel"),
      summaryDepValue: $("#summaryDepValue"),

      input: $("#fileInput"),
      uploadBox: $("#uploadBox"),
      previewWrap: $("#previewWrap"),
      preview: $("#preview"),
      removeImage: $("#removeImage"),
      analyze: $("#analyzeBtn"),
      loadingPreview: $("#loadingPreview"),
      loadingText: $("#loadingText"),
      resultCard: $("#resultCard"),
      resultIcon: $("#resultIcon"),
      resultTitle: $("#resultTitle"),
      resultSub: $("#resultSub"),
      confidenceText: $("#confidenceText"),
      confidenceBar: $("#confidenceBar"),
      trendText: $("#trendText"),
      paramsText: $("#paramsText"),
      reasonText: $("#reasonText"),
      qualityTitle: $("#qualityTitle"),
      qualityState: $("#qualityState"),
      qualityScreenshotLabel: $("#qualityScreenshotLabel"),
      qualityScreenshot: $("#qualityScreenshot"),
      qualityCandlesLabel: $("#qualityCandlesLabel"),
      qualityCandles: $("#qualityCandles"),
      qualityTimeframeLabel: $("#qualityTimeframeLabel"),
      qualityTimeframe: $("#qualityTimeframe"),
      qualityReason: $("#qualityReason"),
      newAnalysis: $("#newAnalysisBtn"),
      sessionHistory: $("#sessionHistory"),
      historyTitle: $("#historyTitle"),
      historyNote: $("#historyNote"),
      historyCount: $("#historyCount"),
      historyList: $("#historyList"),
      toast: $("#toast"),
      tgBadge: $("#tgBadge")
    };

    const required = Object.keys(els);
    if (required.some((k) => !els[k])) {
      console.error("Mini App UI initialization failed: missing element");
      return;
    }

    const I18N = window.AI_I18N || {};

    function normalizeLocale(value) {
      const raw = String(value || "").toLowerCase().replace("_", "-").split("-")[0];
      if (I18N[raw] || ACCESS_TEXT[raw]) return raw;
      if (raw === "ua") return "uk";
      if (raw === "cn") return "zh";
      return "ru";
    }

    function currentLocale() {
      const fromStorage = localStorage.getItem("ai_signal_locale");
      const fromTelegram =
        tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code;
      return normalizeLocale(fromStorage || fromTelegram || navigator.language || "ru");
    }

    function currentLocaleSource() {
      if (window.AI_LOCALE_EXPLICIT) return "explicit";
      return localStorage.getItem("ai_signal_locale") ? "stored" : "fallback";
    }

    function requestSource() {
      return String(window.AI_SIGNAL_SOURCE || "miniapp").slice(0, 80);
    }

    function t(key, fallback) {
      const locale = currentLocale();
      const value = I18N[locale] && I18N[locale][key];
      const english = I18N.en && I18N.en[key];
      return value !== undefined ? value : english !== undefined ? english : fallback;
    }

    function at(key) {
      const locale = currentLocale();
      const pack = ACCESS_TEXT[locale] || ACCESS_TEXT.en;
      return pack[key] ?? ACCESS_TEXT.en[key] ?? key;
    }

    els.tgBadge.textContent = tg && tg.initData ? "TELEGRAM" : "BROWSER";
    document.documentElement.dataset.js = "ready";

    els.input.addEventListener("change", (e) => handleFile(e.target.files && e.target.files[0]));
    els.removeImage.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetImage();
    });
    els.analyze.addEventListener("click", analyze);
    els.startAnalysisBtn.addEventListener("click", () => {
      showScreen("screenInput");
      haptic("success");
    });
    els.newAnalysis.addEventListener("click", () => {
      resetImage();
      if (state.access?.allowed) showScreen("screenInput");
      else checkAccess(true);
    });
    els.registerBtn.addEventListener("click", openReferral);
    els.checkAccessBtn.addEventListener("click", () => checkAccess(true));
    window.addEventListener("ai-signal:locale-change", (event) => {
      paintAccess(state.access, state.accessMode);
      paintSuccess(state.access);
      paintAccessSummary(state.access);
      renderHistory();
      if (state.lastResult && state.lastMeta) renderResult(state.lastResult, state.lastMeta, false);
      if (els.screenLoading.classList.contains("active")) {
        const messages = t("loadingMessages", []);
        if (Array.isArray(messages) && messages[0]) els.loadingText.textContent = messages[0];
      }
      if (state.toastKey && els.toast.classList.contains("show")) {
        els.toast.textContent = state.toastDictionary === "access" ? at(state.toastKey) : t(state.toastKey, state.toastKey);
      }
      if (event?.detail?.locale && event.detail.persist !== false) persistLocale(event.detail.locale);
    });

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

    els.uploadBox.addEventListener("drop", (e) =>
      handleFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0])
    );

    document.addEventListener("paste", (e) => {
      const items = Array.from((e.clipboardData && e.clipboardData.items) || []);
      const item = items.find((x) => x.type && x.type.indexOf("image/") === 0);
      if (item) handleFile(item.getAsFile());
    });

    window.addEventListener("focus", () => {
      if (canPollAccess() && els.screenAccess.classList.contains("active")) {
        setTimeout(() => checkAccess(false), 450);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        startAccessPolling();
        if (canPollAccess() && els.screenAccess.classList.contains("active")) checkAccess(false);
      } else {
        stopAccessPolling();
      }
    });

    let accessPoll = null;
    let localeSaveChain = Promise.resolve();

    function canPollAccess() {
      return Boolean(tg && tg.initData) && document.visibilityState !== "hidden";
    }

    function startAccessPolling() {
      if (accessPoll || !canPollAccess() || state.access?.allowed) return;
      accessPoll = setInterval(() => {
        if (els.screenAccess.classList.contains("active") && !state.accessChecking) {
          checkAccess(false);
        }
      }, 5000);
    }

    function stopAccessPolling() {
      if (!accessPoll) return;
      clearInterval(accessPoll);
      accessPoll = null;
    }

    function persistLocale(locale) {
      if (!tg?.initData) return Promise.resolve();
      localeSaveChain = localeSaveChain.catch(() => {}).then(async () => {
        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "set_locale", locale, source: requestSource(), tgInitData: tg.initData })
          });
          if (response.ok && currentLocale() === locale) showToastKey("localeSaved");
        } catch (error) {
          console.warn("Locale persistence failed", error);
        }
      });
      return localeSaveChain;
    }

    function applyServerLocale(locale) {
      const selected = normalizeLocale(locale);
      if (!selected || selected === currentLocale()) return;
      localStorage.setItem("ai_signal_locale", selected);
      const country = ({ru:"ru",en:"us",de:"de",fr:"fr",it:"it",es:"es",pt:"br",ja:"jp",hi:"in",id:"id",ko:"kr",tr:"tr",uk:"ua",sv:"se",no:"no",zh:"cn"})[selected];
      if (country) localStorage.setItem("ai_signal_country", country);
      window.AI_LOCALE_EXPLICIT = false;
      if (window.AISignalUI?.translateStatic) window.AISignalUI.translateStatic();
      window.dispatchEvent(new CustomEvent("ai-signal:locale-change", { detail: { locale: selected, country, persist: false, source: "server" } }));
    }

    paintAccess(null);
    paintSuccess(null);
    paintAccessSummary(null);
    renderHistory();
    startAccessPolling();
    checkAccess(false);

    async function checkAccess(userInitiated = false) {
      if (state.accessChecking) return;
      const previousAccess = state.access;
      const requestedLocale = currentLocale();
      state.accessChecking = true;

      els.checkAccessBtn.disabled = true;
      els.checkAccessBtn.textContent = at("checking");

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "access_status",
            locale: requestedLocale,
            locale_source: currentLocaleSource(),
            source: requestSource(),
            tgInitData: tg && tg.initData ? tg.initData : ""
          })
        });

        let data = null;
        try {
          data = await response.json();
        } catch {}

        if (response.status === 401) {
          state.access = null;
          stopAccessPolling();
          paintAccess(null, "telegram");
          showScreen("screenAccess");
          return;
        }

        if (!response.ok || !data?.access) {
          state.access = null;
          paintAccess(null, "unavailable");
          showScreen("screenAccess");
          return;
        }

        if (data.locale && currentLocale() === requestedLocale) applyServerLocale(data.locale);
        state.geo = data.geo || null;
        state.access = data.access;
        paintAccess(data.access);
        paintAccessSummary(data.access);
        paintSuccess(data.access);

        if (data.access.allowed) {
          stopAccessPolling();
          if (userInitiated) showToastKey("accessGrantedToast");
          haptic("success");
          showScreen(shouldShowSuccess(data.access, previousAccess) ? "screenSuccess" : "screenInput");
        } else {
          startAccessPolling();
          showScreen("screenAccess");
        }
      } catch (error) {
        console.error("Access check failed", error);
        paintAccess(null, "unavailable");
        showScreen("screenAccess");
      } finally {
        state.accessChecking = false;
        els.checkAccessBtn.disabled = state.accessMode === "telegram";
        els.checkAccessBtn.textContent = at("check");
      }
    }

    function paintAccess(access, mode = "") {
      state.accessMode = mode;
      const min = Number(access?.min_deposit || 5);
      const minText = "$" + formatMoney(min);

      els.accessTitle.textContent = at("title");
      els.accessDesc.textContent = at("desc").replace("$5", minText);
      els.accessRegTitle.textContent = at("registration");
      els.accessDepTitle.textContent = at("deposit").replace("$5", minText);
      els.checkAccessBtn.textContent = at("check");
      els.accessHint.textContent =
        mode === "telegram"
          ? at("telegramOnly")
          : mode === "unavailable"
          ? at("unavailable")
          : at("hint");

      const registered = Boolean(access?.registered);
      const depositOk = Boolean(access?.deposit_ok);

      els.accessRegStep.classList.toggle("done", registered);
      els.accessDepStep.classList.toggle("done", depositOk);

      els.accessRegStatus.textContent = registered ? at("confirmed") : at("waiting");

      if (depositOk) {
        const amount = Number(access?.deposit_amount || 0);
        els.accessDepStatus.textContent = amount > 0
          ? at("depositSeen").replace("${amount}", "$" + formatMoney(amount))
          : at("confirmed");
      } else {
        els.accessDepStatus.textContent = at("waiting");
      }

      const needsDeposit = registered && !depositOk;
      els.registerBtnText.textContent = needsDeposit ? at("depositBtn") : at("register");

      const telegramMissing = mode === "telegram";
      const unavailable = mode === "unavailable";
      els.registerBtn.disabled = telegramMissing || unavailable;
      els.checkAccessBtn.disabled = telegramMissing;
    }

    function shouldShowSuccess(access, previousAccess) {
      if (!access?.allowed) return false;
      const token = String(access.access_granted_at || access.deposit_at || "");
      if (!token || localStorage.getItem("ai_signal_seen_access_grant") === token) return false;
      const grantedAt = new Date(access.access_granted_at || access.deposit_at).getTime();
      const recent = Number.isFinite(grantedAt) && Date.now() - grantedAt < 48 * 60 * 60 * 1000;
      const transitioned = Boolean(previousAccess && !previousAccess.allowed);
      if (!recent && !transitioned) return false;
      localStorage.setItem("ai_signal_seen_access_grant", token);
      return true;
    }

    function paintSuccess(access) {
      const amount = Number(access?.deposit_amount || access?.min_deposit || 5);
      els.successKicker.textContent = t("successKicker", "ACCESS GRANTED");
      els.successTitle.textContent = t("successTitle", "Access granted");
      els.successDesc.textContent = t("successDesc", "Registration and deposit are confirmed. AI SIGNAL is ready.");
      els.successRegLabel.textContent = t("registrationShort", "Registration");
      els.successDepLabel.textContent = t("depositShort", "Deposit");
      els.successReg.textContent = "✓";
      els.successDep.textContent = `$${formatMoney(amount)} ✓`;
      els.startAnalysisBtn.querySelector("span:last-child").textContent = t("startAnalysis", "START ANALYSIS");
    }

    function paintAccessSummary(access) {
      const amount = Number(access?.deposit_amount || access?.min_deposit || 5);
      els.accessSummaryTitle.textContent = t("accessSummaryTitle", "ACCESS STATUS");
      const dot = document.createElement("i");
      els.accessActiveLabel.replaceChildren(dot, document.createTextNode(" " + t("accessActive", "ACCESS ACTIVE")));
      els.summaryRegLabel.textContent = t("registrationShort", "Registration");
      els.summaryDepLabel.textContent = t("depositShort", "Deposit");
      els.summaryRegValue.textContent = access?.registered ? "✓" : "—";
      els.summaryDepValue.textContent = access?.deposit_ok ? `$${formatMoney(amount)} ✓` : "—";
    }

    async function openReferral() {
      els.registerBtn.disabled = true;
      const oldText = els.registerBtnText.textContent;
      els.registerBtnText.textContent = at("opening");
      haptic("impact");

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "referral",
            locale: currentLocale(),
            locale_source: currentLocaleSource(),
            source: requestSource(),
            tgInitData: tg && tg.initData ? tg.initData : ""
          })
        });

        let data = null;
        try {
          data = await response.json();
        } catch {}

        if (!response.ok || !data?.url) {
          if (response.status === 401) throw translatedError("telegramOnly", "access");
          if (response.status === 451 || data?.error === "geo_not_supported") throw translatedError("geoUnsupported");
          throw translatedError("unavailable", "access");
        }

        state.referralUrl = data.url;

        try {
          if (tg && typeof tg.openLink === "function") {
            tg.openLink(data.url);
          } else {
            window.open(data.url, "_blank", "noopener,noreferrer");
          }
        } catch {
          window.location.href = data.url;
        }
      } catch (error) {
        console.error(error);
        toast(error.message || at("unavailable"), error.translationKey, error.translationDictionary);
      } finally {
        els.registerBtn.disabled = false;
        els.registerBtnText.textContent = oldText;
      }
    }

    async function handleFile(file) {
      if (!state.access?.allowed) {
        showScreen("screenAccess");
        return;
      }

      if (!file) return;
      if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
        return showToastKey("supported", "JPG, PNG and WEBP are supported.");
      }
      if (file.size > 12 * 1024 * 1024) {
        return showToastKey("sourceTooLarge", "The source file is too large.");
      }

      els.uploadBox.classList.add("is-reading");
      haptic("impact");

      try {
        const dataUrl = await compressImage(file, 1600, 0.84);
        if (dataUrl.length > 3000000) {
          return showToastKey("compressFailed", "The image could not be reduced enough.");
        }

        state.image = dataUrl;
        els.preview.src = dataUrl;
        els.loadingPreview.src = dataUrl;
        els.uploadBox.classList.add("hidden");
        els.previewWrap.classList.remove("hidden");
        els.analyze.disabled = false;
        haptic("success");
      } catch (e) {
        console.error(e);
        showToastKey("readFailed", "Could not read the image.");
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
      if (!state.access?.allowed) {
        showScreen("screenAccess");
        return checkAccess(true);
      }

      if (!state.image) {
        return showToastKey("uploadFirst", "Upload a chart screenshot first.");
      }

      const startedAt = performance.now();
      const minLoadingMs = 2200;
      els.analyze.classList.add("is-launching");
      setTimeout(() => els.analyze.classList.remove("is-launching"), 720);

      showScreen("screenLoading");
      haptic("impact");

      const fallbackMessages = [
        "Checking price structure…",
        "Reading the local trend…",
        "Evaluating setup quality…"
      ];
      const localizedMessages = t("loadingMessages", fallbackMessages);
      const messages = Array.isArray(localizedMessages) ? localizedMessages : fallbackMessages;

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
            locale_source: currentLocaleSource(),
            source: requestSource(),
            tgInitData: tg && tg.initData ? tg.initData : ""
          })
        });

        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error(t("serverInvalid", "The server returned an invalid response."));
        }

        if (response.status === 403 && data?.error === "access_required") {
          state.access = data.access || null;
          paintAccess(state.access);
          showScreen("screenAccess");
          startAccessPolling();
          return;
        }

        if (!response.ok) {
          throw readableApiError(data && data.error, data && data.reason, data && data.message);
        }

        const elapsed = performance.now() - startedAt;
        if (elapsed < minLoadingMs) await delay(minLoadingMs - elapsed);

        state.lastResult = data.result;
        state.lastMeta = data.meta;
        renderResult(data.result, data.meta, true);
        addHistory(data.result, data.meta);
        haptic(data.result.signal === "NO_SIGNAL" ? "warning" : "success");
        showScreen("screenResult");
      } catch (error) {
        console.error(error);
        showScreen("screenInput");
        toast(error.message || t("retry", "Analysis error. Try again."), error.translationKey || "retry", error.translationDictionary || "ui");
        haptic("error");
      } finally {
        clearInterval(textTimer);
        clearInterval(hapticTimer);
      }
    }

    function renderResult(result, meta, animate = true) {
      els.resultCard.className = "result-card";
      els.resultIcon.className = "result-icon";

      if (result.signal === "UP") {
        els.resultCard.classList.add("up");
        els.resultIcon.classList.add("asset-arrow", "arrow-up");
        els.resultIcon.textContent = "";
        els.resultTitle.textContent = t("up", "UP");
        els.resultSub.textContent = t(
          "directionShown",
          "Direction is visible on the current screenshot"
        );
      } else if (result.signal === "DOWN") {
        els.resultCard.classList.add("down");
        els.resultIcon.classList.add("asset-arrow", "arrow-down");
        els.resultIcon.textContent = "";
        els.resultTitle.textContent = t("down", "DOWN");
        els.resultSub.textContent = t(
          "directionShown",
          "Direction is visible on the current screenshot"
        );
      } else {
        els.resultCard.classList.add("neutral");
        els.resultIcon.textContent = "•";
        els.resultTitle.textContent = t("noSignal", "NO SIGNAL");
        els.resultSub.textContent = result.invalid_chart || !result.quality_ok
          ? t("invalidChart", "The chart could not be read reliably")
          : t("skipSetup", "Better to skip this setup");
      }

      els.confidenceText.textContent = String(result.confidence) + "%";
      if (animate) {
        els.confidenceBar.style.width = "0%";
        requestAnimationFrame(() => requestAnimationFrame(() => {
          els.confidenceBar.style.width = String(result.confidence) + "%";
        }));
      } else els.confidenceBar.style.width = String(result.confidence) + "%";

      const trendFallback = result.signal === "UP"
        ? t("up", "UP")
        : result.signal === "DOWN"
        ? t("down", "DOWN")
        : t("noSignal", "NO SIGNAL");
      const reasonFallback = result.signal === "NO_SIGNAL"
        ? t("skipSetup", "Better to skip this setup")
        : t("directionShown", "Direction is visible on the current screenshot");
      const resultLanguageMatches = !meta.locale || meta.locale === currentLocale();
      els.trendText.textContent = resultLanguageMatches ? safeModelText(result.trend, trendFallback) : trendFallback;
      els.paramsText.textContent =
        meta.timeframe +
        " · " +
        meta.expiration_minutes +
        " " +
        t("minShort", "min");
      els.reasonText.textContent = resultLanguageMatches ? safeModelText(result.reason, reasonFallback) : reasonFallback;
      renderQuality(result, resultLanguageMatches);
    }

    function renderQuality(result, languageMatches) {
      const readabilityKey = result.screenshot_readability === "high"
        ? "readabilityHigh"
        : result.screenshot_readability === "medium"
        ? "readabilityMedium"
        : "readabilityLow";
      els.qualityTitle.textContent = t("qualityTitle", "SCREENSHOT CHECK");
      els.qualityState.textContent = result.quality_ok ? t("qualityPassed", "Check passed") : t("qualityRejected", "Check failed");
      els.qualityState.className = result.quality_ok ? "ok" : "bad";
      els.qualityScreenshotLabel.textContent = t("screenshotReadability", "Readability");
      els.qualityCandlesLabel.textContent = t("candlesVisible", "Candles");
      els.qualityTimeframeLabel.textContent = t("timeframeReadable", "Timeframe");
      els.qualityScreenshot.textContent = t(readabilityKey, result.screenshot_readability || "—");
      els.qualityCandles.textContent = result.has_candles ? t("present", "Present") : t("missing", "Missing");
      els.qualityTimeframe.textContent = result.timeframe_readable ? t("readable", "Readable") : t("unreadable", "Unreadable");
      els.qualityScreenshot.className = result.screenshot_readability === "low" ? "bad" : "ok";
      els.qualityCandles.className = result.has_candles ? "ok" : "bad";
      els.qualityTimeframe.className = result.timeframe_readable ? "ok" : "bad";
      els.qualityReason.textContent = languageMatches
        ? safeModelText(result.quality_reason, t("qualityReasonFallback", "Screenshot quality was checked."))
        : t("qualityReasonFallback", "Screenshot quality was checked.");
    }

    function addHistory(result, meta) {
      state.history.unshift({
        signal: result.signal,
        timeframe: meta.timeframe,
        expiration: meta.expiration_minutes,
        timestamp: Date.now()
      });
      state.history = state.history.slice(0, 3);
      renderHistory();
    }

    function renderHistory() {
      els.historyTitle.textContent = t("historyTitle", "SESSION HISTORY");
      els.historyNote.textContent = t("historyNote", "Last 3 analyses · no images");
      els.historyCount.textContent = `${state.history.length} / 3`;
      els.historyList.replaceChildren();
      els.sessionHistory.classList.toggle("hidden", state.history.length === 0);
      for (const item of state.history) {
        const row = document.createElement("div");
        row.className = `history-item ${item.signal === "UP" ? "up" : item.signal === "DOWN" ? "down" : "neutral"}`;
        const signal = document.createElement("strong");
        signal.className = "history-signal";
        signal.textContent = item.signal === "UP" ? t("up", "UP") : item.signal === "DOWN" ? t("down", "DOWN") : t("noSignal", "NO SIGNAL");
        const meta = document.createElement("span");
        meta.className = "history-meta";
        meta.textContent = `${item.timeframe} · ${item.expiration} ${t("minShort", "min")}`;
        const time = document.createElement("time");
        time.className = "history-time";
        time.dateTime = new Date(item.timestamp).toISOString();
        time.textContent = new Intl.DateTimeFormat(currentLocale(), { hour: "2-digit", minute: "2-digit" }).format(new Date(item.timestamp));
        row.append(signal, meta, time);
        els.historyList.appendChild(row);
      }
    }

    function safeModelText(value, fallback) {
      const text = String(value || "").trim();
      if (!text) return fallback;

      const locale = currentLocale();
      if (!["ru", "uk"].includes(locale) && /[\u0400-\u052f]/u.test(text)) return fallback;

      const requiredScript = {
        ja: /[\u3040-\u30ff\u3400-\u9fff]/u,
        zh: /[\u3400-\u9fff]/u,
        ko: /[\uac00-\ud7af]/u,
        hi: /[\u0900-\u097f]/u
      }[locale];
      if (requiredScript && !requiredScript.test(text)) return fallback;
      return text;
    }

    function showScreen(id) {
      document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
      const next = document.getElementById(id);
      if (next) next.classList.add("active");

      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        window.scrollTo(0, 0);
      }
    }

    function toast(message, key = null, dictionary = "ui") {
      state.toastKey = key;
      state.toastDictionary = dictionary || "ui";
      els.toast.textContent = message;
      els.toast.classList.add("show");
      clearTimeout(toast.t);
      toast.t = setTimeout(() => {
        els.toast.classList.remove("show");
        state.toastKey = null;
      }, 3200);
    }

    function showToastKey(key, fallback = "", dictionary = "ui") {
      toast(dictionary === "access" ? at(key) : t(key, fallback), key, dictionary);
    }

    function translatedError(key, dictionary = "ui", fallback = "") {
      const error = new Error(dictionary === "access" ? at(key) : t(key, fallback));
      error.translationKey = key;
      error.translationDictionary = dictionary;
      return error;
    }

    function haptic(type) {
      try {
        if (tg && tg.initData && tg.HapticFeedback) {
          if (
            type === "selection" &&
            typeof tg.HapticFeedback.selectionChanged === "function"
          ) {
            tg.HapticFeedback.selectionChanged();
          } else if (
            ["success", "warning", "error"].includes(type) &&
            typeof tg.HapticFeedback.notificationOccurred === "function"
          ) {
            tg.HapticFeedback.notificationOccurred(type);
          } else if (typeof tg.HapticFeedback.impactOccurred === "function") {
            tg.HapticFeedback.impactOccurred("light");
          }
          return;
        }

        if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.isActive)) {
          navigator.vibrate(type === "success" ? 14 : type === "error" ? [18, 30, 18] : 7);
        }
      } catch {}
    }

    function readableApiError(error, reason, serverMessage) {
      if (error === "telegram_auth_failed") {
        if (reason === "expired_init_data") {
          return translatedError("sessionExpired", "ui", "Telegram session expired. Close and reopen the Mini App.");
        }
        return translatedError("telegramRequired", "ui", "Open the app inside Telegram to analyze.");
      }

      if (error === "database_not_configured" || error === "database_error") {
        return translatedError("unavailable", "access");
      }
      if (error === "image_too_large") {
        return translatedError("imageTooLarge", "ui", "The image is too large.");
      }
      if (error === "openai_error") {
        return translatedError("modelUnavailable", "ui", "The model did not respond. Try again.");
      }
      if (error === "missing_openai_api_key") {
        return translatedError("genericError", "ui", "Analysis failed.");
      }

      if (serverMessage) return new Error(serverMessage);
      return translatedError("genericError", "ui", "Analysis failed.");
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
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error("canvas_unavailable"));
            return;
          }

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);

          resolve(canvas.toDataURL("image/jpeg", quality));
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("bad_image"));
        };

        img.src = url;
      });
    }

    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
    }

    function formatMoney(value) {
      const n = Number(value || 0);
      if (!Number.isFinite(n)) return "0";
      return n.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp, { once: true });
  } else {
    startApp();
  }
})();
