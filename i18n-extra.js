(() => {
  "use strict";
  const keys = [
    "accessSummaryTitle", "accessActive", "registrationShort", "depositShort",
    "successKicker", "successTitle", "successDesc", "startAnalysis",
    "historyTitle", "historyNote", "qualityTitle", "screenshotReadability",
    "candlesVisible", "timeframeReadable", "qualityPassed", "qualityRejected",
    "readabilityHigh", "readabilityMedium", "readabilityLow", "present", "missing",
    "readable", "unreadable", "geoUnsupported", "localeSaved", "accessGrantedToast",
    "qualityReasonFallback"
  ];
  const packs = {
    ru: ["СТАТУС ДОСТУПА","ДОСТУП АКТИВЕН","Регистрация","Депозит","ДОСТУП ОТКРЫТ","Доступ открыт","Регистрация и депозит подтверждены. AI SIGNAL готов к анализу.","НАЧАТЬ АНАЛИЗ","ИСТОРИЯ СЕССИИ","Последние 3 анализа · без изображений","ПРОВЕРКА СКРИНШОТА","Читаемость","Свечи","Таймфрейм","Проверка пройдена","Проверка не пройдена","Высокая","Средняя","Низкая","Есть","Нет","Читается","Не читается","Этот GEO пока не поддерживается.","Язык сохранён","Доступ открыт ✅","Качество скриншота проверено."],
    en: ["ACCESS STATUS","ACCESS ACTIVE","Registration","Deposit","ACCESS GRANTED","Access granted","Registration and deposit are confirmed. AI SIGNAL is ready to analyze.","START ANALYSIS","SESSION HISTORY","Last 3 analyses · no images","SCREENSHOT CHECK","Readability","Candles","Timeframe","Check passed","Check failed","High","Medium","Low","Present","Missing","Readable","Unreadable","This GEO is not supported yet.","Language saved","Access granted ✅","Screenshot quality was checked."],
    de: ["ZUGANGSSTATUS","ZUGANG AKTIV","Registrierung","Einzahlung","ZUGANG FREIGESCHALTET","Zugang freigeschaltet","Registrierung und Einzahlung sind bestätigt. AI SIGNAL ist bereit.","ANALYSE STARTEN","SITZUNGSVERLAUF","Letzte 3 Analysen · ohne Bilder","SCREENSHOT-PRÜFUNG","Lesbarkeit","Kerzen","Zeitrahmen","Prüfung bestanden","Prüfung fehlgeschlagen","Hoch","Mittel","Niedrig","Vorhanden","Fehlt","Lesbar","Nicht lesbar","Dieses GEO wird noch nicht unterstützt.","Sprache gespeichert","Zugang freigeschaltet ✅","Die Screenshot-Qualität wurde geprüft."],
    fr: ["STATUT D’ACCÈS","ACCÈS ACTIF","Inscription","Dépôt","ACCÈS ACCORDÉ","Accès accordé","L’inscription et le dépôt sont confirmés. AI SIGNAL est prêt.","LANCER L’ANALYSE","HISTORIQUE DE SESSION","3 dernières analyses · sans images","VÉRIFICATION DE LA CAPTURE","Lisibilité","Bougies","Unité de temps","Vérification réussie","Échec de la vérification","Élevée","Moyenne","Faible","Présentes","Absentes","Lisible","Illisible","Cette zone GEO n’est pas encore prise en charge.","Langue enregistrée","Accès accordé ✅","La qualité de la capture a été vérifiée."],
    it: ["STATO ACCESSO","ACCESSO ATTIVO","Registrazione","Deposito","ACCESSO SBLOCCATO","Accesso sbloccato","Registrazione e deposito confermati. AI SIGNAL è pronto.","INIZIA ANALISI","CRONOLOGIA SESSIONE","Ultime 3 analisi · senza immagini","CONTROLLO SCREENSHOT","Leggibilità","Candele","Timeframe","Controllo superato","Controllo non superato","Alta","Media","Bassa","Presenti","Assenti","Leggibile","Illeggibile","Questo GEO non è ancora supportato.","Lingua salvata","Accesso sbloccato ✅","La qualità dello screenshot è stata verificata."],
    es: ["ESTADO DE ACCESO","ACCESO ACTIVO","Registro","Depósito","ACCESO HABILITADO","Acceso habilitado","Registro y depósito confirmados. AI SIGNAL está listo.","INICIAR ANÁLISIS","HISTORIAL DE SESIÓN","Últimos 3 análisis · sin imágenes","COMPROBACIÓN DE CAPTURA","Legibilidad","Velas","Temporalidad","Comprobación superada","Comprobación fallida","Alta","Media","Baja","Presentes","Ausentes","Legible","Ilegible","Este GEO aún no es compatible.","Idioma guardado","Acceso habilitado ✅","Se comprobó la calidad de la captura."],
    pt: ["STATUS DE ACESSO","ACESSO ATIVO","Cadastro","Depósito","ACESSO LIBERADO","Acesso liberado","Cadastro e depósito confirmados. O AI SIGNAL está pronto.","INICIAR ANÁLISE","HISTÓRICO DA SESSÃO","Últimas 3 análises · sem imagens","VERIFICAÇÃO DA IMAGEM","Legibilidade","Velas","Timeframe","Verificação aprovada","Verificação reprovada","Alta","Média","Baixa","Presentes","Ausentes","Legível","Ilegível","Este GEO ainda não é compatível.","Idioma salvo","Acesso liberado ✅","A qualidade da imagem foi verificada."],
    ja: ["アクセス状況","アクセス有効","登録","入金","アクセス許可","アクセスが開きました","登録と入金が確認されました。AI SIGNALで分析できます。","分析を開始","セッション履歴","直近3件の分析・画像なし","スクリーンショット確認","読みやすさ","ローソク足","時間足","確認済み","確認できません","高","中","低","あり","なし","読取可能","読取不可","この地域にはまだ対応していません。","言語を保存しました","アクセスが開きました ✅","スクリーンショットの品質を確認しました。"],
    hi: ["एक्सेस स्टेटस","एक्सेस चालू","रजिस्ट्रेशन","डिपॉजिट","एक्सेस मिल गया","एक्सेस खुल गया","रजिस्ट्रेशन और डिपॉजिट कन्फर्म हैं। AI SIGNAL विश्लेषण के लिए तैयार है।","विश्लेषण शुरू करें","सेशन हिस्ट्री","पिछले 3 विश्लेषण · इमेज के बिना","स्क्रीनशॉट जाँच","पठनीयता","कैंडल","टाइमफ्रेम","जाँच पास","जाँच असफल","उच्च","मध्यम","कम","मौजूद","नहीं","पढ़ने योग्य","पढ़ने योग्य नहीं","यह GEO अभी समर्थित नहीं है।","भाषा सेव हो गई","एक्सेस खुल गया ✅","स्क्रीनशॉट की गुणवत्ता जाँची गई।"],
    id: ["STATUS AKSES","AKSES AKTIF","Registrasi","Deposit","AKSES TERBUKA","Akses terbuka","Registrasi dan deposit telah dikonfirmasi. AI SIGNAL siap menganalisis.","MULAI ANALISIS","RIWAYAT SESI","3 analisis terakhir · tanpa gambar","PEMERIKSAAN SCREENSHOT","Keterbacaan","Candlestick","Timeframe","Pemeriksaan lolos","Pemeriksaan gagal","Tinggi","Sedang","Rendah","Ada","Tidak ada","Terbaca","Tidak terbaca","GEO ini belum didukung.","Bahasa tersimpan","Akses terbuka ✅","Kualitas screenshot telah diperiksa."],
    ko: ["이용 상태","이용 가능","가입","입금","이용 권한 승인","이용 권한이 열렸습니다","가입과 입금이 확인되었습니다. AI SIGNAL을 사용할 수 있습니다.","분석 시작","세션 기록","최근 분석 3개 · 이미지 없음","스크린샷 확인","가독성","캔들","타임프레임","확인 통과","확인 실패","높음","보통","낮음","있음","없음","읽을 수 있음","읽을 수 없음","이 지역은 아직 지원되지 않습니다.","언어가 저장되었습니다","이용 권한이 열렸습니다 ✅","스크린샷 품질을 확인했습니다."],
    tr: ["ERİŞİM DURUMU","ERİŞİM AKTİF","Kayıt","Yatırım","ERİŞİM AÇILDI","Erişim açıldı","Kayıt ve yatırım onaylandı. AI SIGNAL analize hazır.","ANALİZİ BAŞLAT","OTURUM GEÇMİŞİ","Son 3 analiz · görsel yok","EKRAN GÖRÜNTÜSÜ KONTROLÜ","Okunabilirlik","Mumlar","Zaman dilimi","Kontrol başarılı","Kontrol başarısız","Yüksek","Orta","Düşük","Var","Yok","Okunabilir","Okunamıyor","Bu GEO henüz desteklenmiyor.","Dil kaydedildi","Erişim açıldı ✅","Ekran görüntüsü kalitesi kontrol edildi."],
    uk: ["СТАТУС ДОСТУПУ","ДОСТУП АКТИВНИЙ","Реєстрація","Депозит","ДОСТУП ВІДКРИТО","Доступ відкрито","Реєстрацію та депозит підтверджено. AI SIGNAL готовий до аналізу.","ПОЧАТИ АНАЛІЗ","ІСТОРІЯ СЕСІЇ","Останні 3 аналізи · без зображень","ПЕРЕВІРКА СКРИНШОТА","Читабельність","Свічки","Таймфрейм","Перевірку пройдено","Перевірку не пройдено","Висока","Середня","Низька","Є","Немає","Читається","Не читається","Цей GEO поки не підтримується.","Мову збережено","Доступ відкрито ✅","Якість скриншота перевірено."],
    sv: ["ÅTKOMSTSTATUS","ÅTKOMST AKTIV","Registrering","Insättning","ÅTKOMST BEVILJAD","Åtkomst beviljad","Registrering och insättning är bekräftade. AI SIGNAL är redo.","STARTA ANALYS","SESSIONSHISTORIK","Senaste 3 analyserna · utan bilder","KONTROLL AV SKÄRMBILD","Läsbarhet","Candlesticks","Tidsram","Kontroll godkänd","Kontroll misslyckades","Hög","Medel","Låg","Finns","Saknas","Läsbar","Oläsbar","Detta GEO stöds inte ännu.","Språk sparat","Åtkomst beviljad ✅","Skärmbildens kvalitet har kontrollerats."],
    no: ["TILGANGSSTATUS","TILGANG AKTIV","Registrering","Innskudd","TILGANG GODKJENT","Tilgang godkjent","Registrering og innskudd er bekreftet. AI SIGNAL er klar.","START ANALYSE","ØKTHISTORIKK","Siste 3 analyser · uten bilder","KONTROLL AV SKJERMBILDE","Lesbarhet","Lysestaker","Tidsramme","Kontroll godkjent","Kontroll mislyktes","Høy","Middels","Lav","Finnes","Mangler","Lesbar","Uleselig","Dette GEO-et støttes ikke ennå.","Språk lagret","Tilgang godkjent ✅","Kvaliteten på skjermbildet er kontrollert."],
    zh: ["访问状态","访问已启用","注册","入金","访问已开启","访问已开启","注册和入金已确认。AI SIGNAL 可以开始分析。","开始分析","本次会话历史","最近3次分析 · 不含图片","截图检查","清晰度","蜡烛图","时间周期","检查通过","检查未通过","高","中","低","有","无","可读取","不可读取","该地区暂不支持。","语言已保存","访问已开启 ✅","截图质量已检查。"]
  };
  window.AI_I18N = window.AI_I18N || {};
  Object.entries(packs).forEach(([locale, values]) => {
    const target = window.AI_I18N[locale] || (window.AI_I18N[locale] = {});
    keys.forEach((key, index) => { target[key] = values[index]; });
  });
  window.AI_I18N_EXTRA_KEYS = keys.slice();
})();

(() => {
  "use strict";
  const keys = [
    "confidenceLabel", "confidenceHint", "signalWeak", "signalMedium",
    "signalStrong", "reasonLabel", "directionExplanationFallback"
  ];
  const packs = {
    ru: ["УВЕРЕННОСТЬ AI","Сила направления на этом скриншоте","ОСТОРОЖНЫЙ","СРЕДНИЙ","СИЛЬНЫЙ","ПРОСТОЕ ОБЪЯСНЕНИЕ","На последних видимых свечах это направление выражено сильнее. Процент показывает уверенность AI только по текущему скриншоту."],
    en: ["AI CONFIDENCE","Direction strength from this screenshot","CAUTIOUS","MEDIUM","STRONG","SIMPLE EXPLANATION","The latest visible candles lean more strongly in this direction. The percentage is AI confidence for this screenshot only."],
    de: ["AI-SICHERHEIT","Richtungsstärke in diesem Screenshot","VORSICHTIG","MITTEL","STARK","EINFACHE ERKLÄRUNG","Bei den letzten sichtbaren Kerzen ist diese Richtung stärker. Der Prozentsatz zeigt nur die AI-Sicherheit für diesen Screenshot."],
    fr: ["CONFIANCE DE L’IA","Force de la direction sur cette capture","PRUDENT","MOYEN","FORT","EXPLICATION SIMPLE","Les dernières bougies visibles penchent davantage dans cette direction. Le pourcentage indique uniquement la confiance de l’IA pour cette capture."],
    it: ["CONFIDENZA AI","Forza della direzione in questo screenshot","PRUDENTE","MEDIA","FORTE","SPIEGAZIONE SEMPLICE","Le ultime candele visibili indicano maggiormente questa direzione. La percentuale mostra solo la confidenza AI per questo screenshot."],
    es: ["CONFIANZA DE LA IA","Fuerza de la dirección en esta captura","PRUDENTE","MEDIA","FUERTE","EXPLICACIÓN SIMPLE","Las últimas velas visibles se inclinan más hacia esta dirección. El porcentaje muestra solo la confianza de la IA para esta captura."],
    pt: ["CONFIANÇA DA IA","Força da direção nesta imagem","CAUTELOSO","MÉDIO","FORTE","EXPLICAÇÃO SIMPLES","As últimas velas visíveis apontam mais para esta direção. A porcentagem mostra apenas a confiança da IA nesta imagem."],
    ja: ["AIの確信度","この画像での方向の強さ","慎重","中","強い","かんたんな説明","直近のローソク足では、この方向がより強く見えます。この割合は、この画像だけに基づくAIの確信度です。"],
    hi: ["AI विश्वास","इस स्क्रीनशॉट में दिशा की ताकत","सावधानी","मध्यम","मजबूत","सरल व्याख्या","आखिरी दिखाई देने वाली कैंडल इस दिशा को अधिक मजबूत दिखाती हैं। प्रतिशत केवल इस स्क्रीनशॉट पर AI का विश्वास बताता है।"],
    id: ["KEYAKINAN AI","Kekuatan arah pada screenshot ini","HATI-HATI","SEDANG","KUAT","PENJELASAN SEDERHANA","Candlestick terakhir yang terlihat lebih condong ke arah ini. Persentase hanya menunjukkan keyakinan AI berdasarkan screenshot ini."],
    ko: ["AI 확신도","이 스크린샷에서 보이는 방향의 강도","주의","보통","강함","쉬운 설명","최근 보이는 캔들은 이 방향이 더 강하다는 것을 보여 줍니다. 퍼센트는 이 스크린샷만을 기준으로 한 AI 확신도입니다."],
    tr: ["AI GÜVENİ","Bu ekran görüntüsündeki yönün gücü","TEMKİNLİ","ORTA","GÜÇLÜ","BASİT AÇIKLAMA","Son görünen mumlar bu yönü daha güçlü gösteriyor. Yüzde yalnızca bu ekran görüntüsüne göre AI güvenini belirtir."],
    uk: ["ВПЕВНЕНІСТЬ AI","Сила напрямку на цьому скриншоті","ОБЕРЕЖНИЙ","СЕРЕДНІЙ","СИЛЬНИЙ","ПРОСТЕ ПОЯСНЕННЯ","На останніх видимих свічках цей напрямок виражений сильніше. Відсоток показує впевненість AI лише за поточним скриншотом."],
    sv: ["AI-SÄKERHET","Riktningens styrka i den här bilden","FÖRSIKTIG","MEDEL","STARK","ENKEL FÖRKLARING","De senaste synliga ljusen lutar tydligare åt den här riktningen. Procenten visar bara AI-säkerheten för denna bild."],
    no: ["AI-SIKKERHET","Retningens styrke i dette skjermbildet","FORSIKTIG","MIDDELS","STERK","ENKEL FORKLARING","De siste synlige lysestakene heller tydeligere i denne retningen. Prosenten viser bare AI-sikkerheten for dette skjermbildet."],
    zh: ["AI 置信度","当前截图中的方向强度","谨慎","中等","较强","简单说明","最近可见的蜡烛图更偏向这个方向。该百分比仅表示 AI 对当前截图分析的置信度。"]
  };
  window.AI_I18N = window.AI_I18N || {};
  Object.entries(packs).forEach(([locale, values]) => {
    const target = window.AI_I18N[locale] || (window.AI_I18N[locale] = {});
    keys.forEach((key, index) => { target[key] = values[index]; });
  });
  window.AI_I18N_EXTRA_KEYS = [...new Set([...(window.AI_I18N_EXTRA_KEYS || []), ...keys])];
})();
