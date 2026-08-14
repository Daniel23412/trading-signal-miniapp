export const LOCALES = [
  ["ru", "🇷🇺", "Русский"], ["en", "🇺🇸", "English"],
  ["de", "🇩🇪", "Deutsch"], ["fr", "🇫🇷", "Français"],
  ["it", "🇮🇹", "Italiano"], ["es", "🇪🇸", "Español"],
  ["pt", "🇧🇷", "Português"], ["ja", "🇯🇵", "日本語"],
  ["hi", "🇮🇳", "हिन्दी"], ["id", "🇮🇩", "Bahasa Indonesia"],
  ["ko", "🇰🇷", "한국어"], ["tr", "🇹🇷", "Türkçe"],
  ["uk", "🇺🇦", "Українська"], ["sv", "🇸🇪", "Svenska"],
  ["no", "🇳🇴", "Norsk"], ["zh", "🇨🇳", "中文"]
];

export const LANGUAGE_META = {
  ru: { name: "Russian", native: "русском" },
  en: { name: "English", native: "English" },
  de: { name: "German", native: "Deutsch" },
  fr: { name: "French", native: "français" },
  it: { name: "Italian", native: "italiano" },
  es: { name: "Spanish", native: "español" },
  pt: { name: "Portuguese", native: "português" },
  ja: { name: "Japanese", native: "日本語" },
  hi: { name: "Hindi", native: "हिन्दी" },
  id: { name: "Indonesian", native: "Bahasa Indonesia" },
  ko: { name: "Korean", native: "한국어" },
  tr: { name: "Turkish", native: "Türkçe" },
  uk: { name: "Ukrainian", native: "українська" },
  sv: { name: "Swedish", native: "svenska" },
  no: { name: "Norwegian", native: "norsk" },
  zh: { name: "Simplified Chinese", native: "简体中文" }
};

const COPY = {
  ru: {
    open: "🚀 ОТКРЫТЬ AI SIGNAL", selected: "Язык сохранён ✅",
    start: `✨ <b>AI SIGNAL — анализ графика за секунды</b>\n\n⚡ Проверяет качество скриншота до анализа\n🎯 Показывает UP / DOWN только при ясном сетапе\n🔒 Изображения не сохраняются, история — только в сессии\n\nДоступ откроется после регистрации и первого депозита от <b>$5</b>.\n\n⚠️ Торговля связана с риском. AI-анализ не гарантирует прибыль.`,
    followup: `✅ <b>Регистрация подтверждена</b>\n\nОстался последний шаг — первый депозит от <b>$5</b>. После его подтверждения AI SIGNAL откроется автоматически.\n\n⚠️ Торговля связана с риском потери средств.`,
    stop: "🔕 Не напоминать", stopped: "Напоминания отключены"
  },
  en: {
    open: "🚀 OPEN AI SIGNAL", selected: "Language saved ✅",
    start: `✨ <b>AI SIGNAL — chart analysis in seconds</b>\n\n⚡ Checks screenshot quality before analysis\n🎯 Shows UP / DOWN only for a clear setup\n🔒 Images are not stored; history stays in this session\n\nAccess unlocks after registration and a first deposit of at least <b>$5</b>.\n\n⚠️ Trading involves risk. AI analysis does not guarantee profit.`,
    followup: `✅ <b>Registration confirmed</b>\n\nOne last step remains: make a first deposit of at least <b>$5</b>. AI SIGNAL will unlock automatically after confirmation.\n\n⚠️ Trading involves risk of loss.`,
    stop: "🔕 No reminders", stopped: "Reminders disabled"
  },
  de: {
    open: "🚀 AI SIGNAL ÖFFNEN", selected: "Sprache gespeichert ✅",
    start: `✨ <b>AI SIGNAL — Chartanalyse in Sekunden</b>\n\n⚡ Prüft zuerst die Qualität des Screenshots\n🎯 Zeigt UP / DOWN nur bei einem klaren Setup\n🔒 Bilder werden nicht gespeichert; Verlauf nur in dieser Sitzung\n\nDer Zugang wird nach Registrierung und einer ersten Einzahlung ab <b>$5</b> freigeschaltet.\n\n⚠️ Trading birgt Risiken. Die AI-Analyse garantiert keinen Gewinn.`,
    followup: `✅ <b>Registrierung bestätigt</b>\n\nNur noch ein Schritt: eine erste Einzahlung ab <b>$5</b>. Danach wird AI SIGNAL automatisch freigeschaltet.\n\n⚠️ Trading birgt Verlustrisiken.`,
    stop: "🔕 Nicht erinnern", stopped: "Erinnerungen deaktiviert"
  },
  fr: {
    open: "🚀 OUVRIR AI SIGNAL", selected: "Langue enregistrée ✅",
    start: `✨ <b>AI SIGNAL — analyse du graphique en quelques secondes</b>\n\n⚡ Vérifie d’abord la qualité de la capture\n🎯 Affiche UP / DOWN uniquement si la configuration est claire\n🔒 Les images ne sont pas stockées; historique limité à la session\n\nL’accès s’ouvre après inscription et un premier dépôt d’au moins <b>5 $</b>.\n\n⚠️ Le trading comporte des risques. L’analyse IA ne garantit aucun profit.`,
    followup: `✅ <b>Inscription confirmée</b>\n\nIl reste une étape: un premier dépôt d’au moins <b>5 $</b>. AI SIGNAL s’ouvrira automatiquement après confirmation.\n\n⚠️ Le trading comporte un risque de perte.`,
    stop: "🔕 Aucun rappel", stopped: "Rappels désactivés"
  },
  it: {
    open: "🚀 APRI AI SIGNAL", selected: "Lingua salvata ✅",
    start: `✨ <b>AI SIGNAL — analisi del grafico in pochi secondi</b>\n\n⚡ Controlla prima la qualità dello screenshot\n🎯 Mostra UP / DOWN solo con un setup chiaro\n🔒 Le immagini non vengono salvate; cronologia solo nella sessione\n\nL’accesso si apre dopo la registrazione e un primo deposito di almeno <b>$5</b>.\n\n⚠️ Il trading comporta rischi. L’analisi AI non garantisce profitti.`,
    followup: `✅ <b>Registrazione confermata</b>\n\nManca un solo passaggio: un primo deposito di almeno <b>$5</b>. AI SIGNAL si aprirà automaticamente dopo la conferma.\n\n⚠️ Il trading comporta rischio di perdita.`,
    stop: "🔕 Nessun promemoria", stopped: "Promemoria disattivati"
  },
  es: {
    open: "🚀 ABRIR AI SIGNAL", selected: "Idioma guardado ✅",
    start: `✨ <b>AI SIGNAL — análisis del gráfico en segundos</b>\n\n⚡ Comprueba primero la calidad de la captura\n🎯 Muestra UP / DOWN solo con una configuración clara\n🔒 Las imágenes no se guardan; historial solo en la sesión\n\nEl acceso se abre tras registrarte y hacer un primer depósito de al menos <b>$5</b>.\n\n⚠️ El trading conlleva riesgos. El análisis con IA no garantiza ganancias.`,
    followup: `✅ <b>Registro confirmado</b>\n\nSolo falta un paso: un primer depósito de al menos <b>$5</b>. AI SIGNAL se abrirá automáticamente tras la confirmación.\n\n⚠️ El trading implica riesgo de pérdida.`,
    stop: "🔕 Sin recordatorios", stopped: "Recordatorios desactivados"
  },
  pt: {
    open: "🚀 ABRIR AI SIGNAL", selected: "Idioma salvo ✅",
    start: `✨ <b>AI SIGNAL — análise do gráfico em segundos</b>\n\n⚡ Verifica primeiro a qualidade da imagem\n🎯 Mostra UP / DOWN apenas com um setup claro\n🔒 As imagens não são armazenadas; histórico só na sessão\n\nO acesso é liberado após o cadastro e um primeiro depósito de pelo menos <b>$5</b>.\n\n⚠️ Trading envolve riscos. A análise por IA não garante lucro.`,
    followup: `✅ <b>Cadastro confirmado</b>\n\nFalta só uma etapa: um primeiro depósito de pelo menos <b>$5</b>. O AI SIGNAL será liberado automaticamente após a confirmação.\n\n⚠️ Trading envolve risco de perda.`,
    stop: "🔕 Sem lembretes", stopped: "Lembretes desativados"
  },
  ja: {
    open: "🚀 AI SIGNALを開く", selected: "言語を保存しました ✅",
    start: `✨ <b>AI SIGNAL — 数秒でチャート分析</b>\n\n⚡ 分析前に画像の品質を確認\n🎯 明確なセットアップだけ UP / DOWN を表示\n🔒 画像は保存せず、履歴は現在のセッションのみ\n\n登録と<b>5ドル以上</b>の初回入金後にアクセスが開きます。\n\n⚠️ 取引にはリスクがあります。AI分析は利益を保証しません。`,
    followup: `✅ <b>登録が確認されました</b>\n\n残りは<b>5ドル以上</b>の初回入金だけです。確認後、AI SIGNALは自動で開きます。\n\n⚠️ 取引には損失リスクがあります。`,
    stop: "🔕 通知しない", stopped: "リマインダーを停止しました"
  },
  hi: {
    open: "🚀 AI SIGNAL खोलें", selected: "भाषा सेव हो गई ✅",
    start: `✨ <b>AI SIGNAL — सेकंडों में चार्ट विश्लेषण</b>\n\n⚡ विश्लेषण से पहले स्क्रीनशॉट की गुणवत्ता जाँचता है\n🎯 स्पष्ट सेटअप पर ही UP / DOWN दिखाता है\n🔒 इमेज सेव नहीं होती; हिस्ट्री केवल इसी सेशन में रहती है\n\nरजिस्ट्रेशन और कम से कम <b>$5</b> के पहले डिपॉजिट के बाद एक्सेस खुलेगा।\n\n⚠️ ट्रेडिंग में जोखिम है। AI विश्लेषण लाभ की गारंटी नहीं देता।`,
    followup: `✅ <b>रजिस्ट्रेशन कन्फर्म हो गया</b>\n\nकेवल एक स्टेप बाकी है: कम से कम <b>$5</b> का पहला डिपॉजिट। कन्फर्म होते ही AI SIGNAL अपने-आप खुल जाएगा।\n\n⚠️ ट्रेडिंग में नुकसान का जोखिम है।`,
    stop: "🔕 रिमाइंडर बंद करें", stopped: "रिमाइंडर बंद हो गए"
  },
  id: {
    open: "🚀 BUKA AI SIGNAL", selected: "Bahasa tersimpan ✅",
    start: `✨ <b>AI SIGNAL — analisis chart dalam hitungan detik</b>\n\n⚡ Memeriksa kualitas screenshot terlebih dahulu\n🎯 Menampilkan UP / DOWN hanya untuk setup yang jelas\n🔒 Gambar tidak disimpan; riwayat hanya dalam sesi ini\n\nAkses terbuka setelah registrasi dan deposit pertama minimal <b>$5</b>.\n\n⚠️ Trading memiliki risiko. Analisis AI tidak menjamin profit.`,
    followup: `✅ <b>Registrasi dikonfirmasi</b>\n\nTinggal satu langkah: deposit pertama minimal <b>$5</b>. AI SIGNAL akan terbuka otomatis setelah konfirmasi.\n\n⚠️ Trading memiliki risiko kerugian.`,
    stop: "🔕 Tanpa pengingat", stopped: "Pengingat dinonaktifkan"
  },
  ko: {
    open: "🚀 AI SIGNAL 열기", selected: "언어가 저장되었습니다 ✅",
    start: `✨ <b>AI SIGNAL — 몇 초 만에 차트 분석</b>\n\n⚡ 분석 전에 스크린샷 품질 확인\n🎯 명확한 셋업에서만 UP / DOWN 표시\n🔒 이미지는 저장하지 않으며 기록은 현재 세션에만 유지\n\n가입 및 최소 <b>$5</b>의 첫 입금 후 이용할 수 있습니다.\n\n⚠️ 트레이딩에는 위험이 있습니다. AI 분석은 수익을 보장하지 않습니다.`,
    followup: `✅ <b>가입이 확인되었습니다</b>\n\n마지막 단계는 최소 <b>$5</b>의 첫 입금입니다. 확인 후 AI SIGNAL이 자동으로 열립니다.\n\n⚠️ 트레이딩에는 손실 위험이 있습니다.`,
    stop: "🔕 알림 끄기", stopped: "알림이 꺼졌습니다"
  },
  tr: {
    open: "🚀 AI SIGNAL'I AÇ", selected: "Dil kaydedildi ✅",
    start: `✨ <b>AI SIGNAL — saniyeler içinde grafik analizi</b>\n\n⚡ Önce ekran görüntüsü kalitesini kontrol eder\n🎯 Yalnızca net bir kurulumda UP / DOWN gösterir\n🔒 Görseller saklanmaz; geçmiş yalnızca bu oturumdadır\n\nKayıt ve en az <b>$5</b> ilk para yatırma sonrası erişim açılır.\n\n⚠️ Trading risk içerir. AI analizi kâr garantisi vermez.`,
    followup: `✅ <b>Kayıt onaylandı</b>\n\nTek bir adım kaldı: en az <b>$5</b> ilk para yatırma. Onaydan sonra AI SIGNAL otomatik açılır.\n\n⚠️ Trading kayıp riski içerir.`,
    stop: "🔕 Hatırlatma yok", stopped: "Hatırlatmalar kapatıldı"
  },
  uk: {
    open: "🚀 ВІДКРИТИ AI SIGNAL", selected: "Мову збережено ✅",
    start: `✨ <b>AI SIGNAL — аналіз графіка за секунди</b>\n\n⚡ Спочатку перевіряє якість скриншота\n🎯 Показує UP / DOWN лише за чіткого сетапу\n🔒 Зображення не зберігаються, історія — лише в сесії\n\nДоступ відкриється після реєстрації та першого депозиту від <b>$5</b>.\n\n⚠️ Торгівля пов’язана з ризиком. AI-аналіз не гарантує прибуток.`,
    followup: `✅ <b>Реєстрацію підтверджено</b>\n\nЗалишився останній крок — перший депозит від <b>$5</b>. Після підтвердження AI SIGNAL відкриється автоматично.\n\n⚠️ Торгівля пов’язана з ризиком втрати коштів.`,
    stop: "🔕 Не нагадувати", stopped: "Нагадування вимкнено"
  },
  sv: {
    open: "🚀 ÖPPNA AI SIGNAL", selected: "Språk sparat ✅",
    start: `✨ <b>AI SIGNAL — diagramanalys på några sekunder</b>\n\n⚡ Kontrollerar först skärmbildens kvalitet\n🎯 Visar UP / DOWN endast vid ett tydligt setup\n🔒 Bilder sparas inte; historik finns bara i sessionen\n\nÅtkomst öppnas efter registrering och en första insättning på minst <b>$5</b>.\n\n⚠️ Trading innebär risk. AI-analys garanterar inte vinst.`,
    followup: `✅ <b>Registrering bekräftad</b>\n\nEtt steg återstår: en första insättning på minst <b>$5</b>. AI SIGNAL öppnas automatiskt efter bekräftelsen.\n\n⚠️ Trading innebär risk för förlust.`,
    stop: "🔕 Inga påminnelser", stopped: "Påminnelser avstängda"
  },
  no: {
    open: "🚀 ÅPNE AI SIGNAL", selected: "Språk lagret ✅",
    start: `✨ <b>AI SIGNAL — diagramanalyse på sekunder</b>\n\n⚡ Sjekker først kvaliteten på skjermbildet\n🎯 Viser UP / DOWN bare ved et tydelig oppsett\n🔒 Bilder lagres ikke; historikk finnes bare i økten\n\nTilgang åpnes etter registrering og et første innskudd på minst <b>$5</b>.\n\n⚠️ Trading innebærer risiko. AI-analyse garanterer ikke fortjeneste.`,
    followup: `✅ <b>Registrering bekreftet</b>\n\nEtt steg gjenstår: et første innskudd på minst <b>$5</b>. AI SIGNAL åpnes automatisk etter bekreftelsen.\n\n⚠️ Trading innebærer risiko for tap.`,
    stop: "🔕 Ingen påminnelser", stopped: "Påminnelser deaktivert"
  },
  zh: {
    open: "🚀 打开 AI SIGNAL", selected: "语言已保存 ✅",
    start: `✨ <b>AI SIGNAL — 数秒完成图表分析</b>\n\n⚡ 分析前先检查截图质量\n🎯 仅在形态清晰时显示 UP / DOWN\n🔒 不保存图片；历史仅保留在当前会话\n\n完成注册并首次入金至少 <b>5 美元</b>后即可解锁。\n\n⚠️ 交易存在风险。AI 分析不保证盈利。`,
    followup: `✅ <b>注册已确认</b>\n\n只差最后一步：首次入金至少 <b>5 美元</b>。确认后 AI SIGNAL 将自动解锁。\n\n⚠️ 交易存在亏损风险。`,
    stop: "🔕 不再提醒", stopped: "提醒已关闭"
  }
};

const GEO_LOCALES = {
  RU: "ru", BY: "ru", KZ: "ru", KG: "ru",
  UA: "uk", DE: "de", AT: "de", CH: "de",
  FR: "fr", BE: "fr", IT: "it", ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es",
  PT: "pt", BR: "pt", JP: "ja", IN: "hi", ID: "id", KR: "ko", TR: "tr",
  SE: "sv", NO: "no", CN: "zh", TW: "zh", HK: "zh"
};

export function normalizeLocale(value, fallback = "en") {
  let raw = String(value || "").trim().toLowerCase().replace("_", "-").split("-")[0];
  if (raw === "ua") raw = "uk";
  if (raw === "cn") raw = "zh";
  return LANGUAGE_META[raw] ? raw : fallback;
}

export function getBotCopy(locale) {
  return COPY[normalizeLocale(locale)] || COPY.en;
}

export function suggestedLocaleForCountry(country) {
  return GEO_LOCALES[String(country || "").toUpperCase()] || null;
}

export function languageKeyboard() {
  const rows = [];
  for (let i = 0; i < LOCALES.length; i += 2) {
    rows.push(LOCALES.slice(i, i + 2).map(([code, flag, label]) => ({ text: `${flag} ${label}`, callback_data: `lang:${code}` })));
  }
  return { inline_keyboard: rows };
}
