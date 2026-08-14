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
    start: `🚀 <b>ДОБРО ПОЖАЛОВАТЬ В AI SIGNAL</b>\n\nAI SIGNAL анализирует скриншоты торговых графиков и за несколько секунд помогает определить возможное направление сделки.\n\n💎 <b>ДОСТУП ПОЛНОСТЬЮ БЕСПЛАТНЫЙ</b>\nМы не берём деньги за бота, подписку или сигналы.\n\n<b>Чтобы открыть доступ, выполните 2 простых условия:</b>\n1️⃣ Зарегистрируйтесь на нашем партнёрском трейдерском сайте\n2️⃣ Внесите первый депозит от <b>$5</b>\n\n💡 Депозит не является оплатой нам — он поступает на ваш торговый баланс, которым распоряжаетесь вы.\n\n<b>Что умеет AI SIGNAL:</b>\n📸 Анализирует скриншоты графиков\n🎯 Показывает UP / DOWN или NO SIGNAL\n⚡ Выдаёт результат за несколько секунд\n🔒 Не сохраняет загруженные изображения\n\nПосле подтверждения регистрации и депозита доступ откроется автоматически.\n\n👇 Нажмите кнопку ниже и выполните условия:\n\n⚠️ Торговля связана с риском потери средств. AI-анализ не гарантирует прибыль.`,
    followup: `✅ <b>Регистрация подтверждена</b>\n\nОстался последний шаг — первый депозит от <b>$5</b>. После его подтверждения AI SIGNAL откроется автоматически.\n\n⚠️ Торговля связана с риском потери средств.`,
    stop: "🔕 Не напоминать", stopped: "Напоминания отключены"
  },
  en: {
    open: "🚀 OPEN AI SIGNAL", selected: "Language saved ✅",
    start: `🚀 <b>WELCOME TO AI SIGNAL</b>\n\nAI SIGNAL analyzes screenshots of trading charts and helps identify a potential trade direction in seconds.\n\n💎 <b>ACCESS IS COMPLETELY FREE</b>\nWe do not charge for the bot, a subscription, or signals.\n\n<b>Complete 2 simple conditions to unlock access:</b>\n1️⃣ Register on our partner trading platform\n2️⃣ Make a first deposit of at least <b>$5</b>\n\n💡 The deposit is not a payment to us — it is credited to your trading balance, which you control.\n\n<b>What AI SIGNAL can do:</b>\n📸 Analyze chart screenshots\n🎯 Show UP / DOWN or NO SIGNAL\n⚡ Return a result in seconds\n🔒 Never store uploaded images\n\nAccess unlocks automatically after your registration and deposit are confirmed.\n\n👇 Tap the button below and complete the conditions:\n\n⚠️ Trading involves risk of loss. AI analysis does not guarantee profit.`,
    followup: `✅ <b>Registration confirmed</b>\n\nOne last step remains: make a first deposit of at least <b>$5</b>. AI SIGNAL will unlock automatically after confirmation.\n\n⚠️ Trading involves risk of loss.`,
    stop: "🔕 No reminders", stopped: "Reminders disabled"
  },
  de: {
    open: "🚀 AI SIGNAL ÖFFNEN", selected: "Sprache gespeichert ✅",
    start: `🚀 <b>WILLKOMMEN BEI AI SIGNAL</b>\n\nAI SIGNAL analysiert Screenshots von Trading-Charts und hilft in wenigen Sekunden, eine mögliche Handelsrichtung zu bestimmen.\n\n💎 <b>DER ZUGANG IST VOLLSTÄNDIG KOSTENLOS</b>\nWir berechnen nichts für den Bot, ein Abonnement oder Signale.\n\n<b>Erfülle 2 einfache Bedingungen, um den Zugang freizuschalten:</b>\n1️⃣ Registriere dich auf unserer Partner-Tradingplattform\n2️⃣ Tätige eine erste Einzahlung von mindestens <b>$5</b>\n\n💡 Die Einzahlung ist keine Zahlung an uns — sie wird deinem Trading-Guthaben gutgeschrieben, über das du selbst verfügst.\n\n<b>Das kann AI SIGNAL:</b>\n📸 Screenshots von Charts analysieren\n🎯 UP / DOWN oder NO SIGNAL anzeigen\n⚡ Ergebnisse in wenigen Sekunden liefern\n🔒 Hochgeladene Bilder nicht speichern\n\nNach Bestätigung der Registrierung und Einzahlung wird der Zugang automatisch freigeschaltet.\n\n👇 Tippe auf die Schaltfläche und erfülle die Bedingungen:\n\n⚠️ Trading birgt Verlustrisiken. Die AI-Analyse garantiert keinen Gewinn.`,
    followup: `✅ <b>Registrierung bestätigt</b>\n\nNur noch ein Schritt: eine erste Einzahlung ab <b>$5</b>. Danach wird AI SIGNAL automatisch freigeschaltet.\n\n⚠️ Trading birgt Verlustrisiken.`,
    stop: "🔕 Nicht erinnern", stopped: "Erinnerungen deaktiviert"
  },
  fr: {
    open: "🚀 OUVRIR AI SIGNAL", selected: "Langue enregistrée ✅",
    start: `🚀 <b>BIENVENUE SUR AI SIGNAL</b>\n\nAI SIGNAL analyse les captures de graphiques de trading et aide à déterminer une direction potentielle en quelques secondes.\n\n💎 <b>L’ACCÈS EST ENTIÈREMENT GRATUIT</b>\nNous ne facturons ni le bot, ni l’abonnement, ni les signaux.\n\n<b>Remplissez 2 conditions simples pour débloquer l’accès :</b>\n1️⃣ Inscrivez-vous sur notre plateforme de trading partenaire\n2️⃣ Effectuez un premier dépôt d’au moins <b>5 $</b>\n\n💡 Le dépôt n’est pas un paiement qui nous est destiné — il est crédité sur votre solde de trading, que vous contrôlez.\n\n<b>Ce que fait AI SIGNAL :</b>\n📸 Analyse les captures de graphiques\n🎯 Affiche UP / DOWN ou NO SIGNAL\n⚡ Donne un résultat en quelques secondes\n🔒 Ne stocke jamais les images envoyées\n\nL’accès s’ouvrira automatiquement après confirmation de l’inscription et du dépôt.\n\n👇 Appuyez sur le bouton et remplissez les conditions :\n\n⚠️ Le trading comporte un risque de perte. L’analyse IA ne garantit aucun profit.`,
    followup: `✅ <b>Inscription confirmée</b>\n\nIl reste une étape: un premier dépôt d’au moins <b>5 $</b>. AI SIGNAL s’ouvrira automatiquement après confirmation.\n\n⚠️ Le trading comporte un risque de perte.`,
    stop: "🔕 Aucun rappel", stopped: "Rappels désactivés"
  },
  it: {
    open: "🚀 APRI AI SIGNAL", selected: "Lingua salvata ✅",
    start: `🚀 <b>BENVENUTO SU AI SIGNAL</b>\n\nAI SIGNAL analizza gli screenshot dei grafici di trading e aiuta a individuare una possibile direzione dell’operazione in pochi secondi.\n\n💎 <b>L’ACCESSO È COMPLETAMENTE GRATUITO</b>\nNon chiediamo pagamenti per il bot, l’abbonamento o i segnali.\n\n<b>Completa 2 semplici condizioni per sbloccare l’accesso:</b>\n1️⃣ Registrati sulla nostra piattaforma di trading partner\n2️⃣ Effettua un primo deposito di almeno <b>$5</b>\n\n💡 Il deposito non è un pagamento a noi — viene accreditato sul tuo saldo di trading, che gestisci tu.\n\n<b>Cosa può fare AI SIGNAL:</b>\n📸 Analizzare gli screenshot dei grafici\n🎯 Mostrare UP / DOWN o NO SIGNAL\n⚡ Fornire il risultato in pochi secondi\n🔒 Non salvare mai le immagini caricate\n\nL’accesso si aprirà automaticamente dopo la conferma di registrazione e deposito.\n\n👇 Tocca il pulsante e completa le condizioni:\n\n⚠️ Il trading comporta il rischio di perdita. L’analisi AI non garantisce profitti.`,
    followup: `✅ <b>Registrazione confermata</b>\n\nManca un solo passaggio: un primo deposito di almeno <b>$5</b>. AI SIGNAL si aprirà automaticamente dopo la conferma.\n\n⚠️ Il trading comporta rischio di perdita.`,
    stop: "🔕 Nessun promemoria", stopped: "Promemoria disattivati"
  },
  es: {
    open: "🚀 ABRIR AI SIGNAL", selected: "Idioma guardado ✅",
    start: `🚀 <b>BIENVENIDO A AI SIGNAL</b>\n\nAI SIGNAL analiza capturas de gráficos de trading y ayuda a identificar una posible dirección de la operación en segundos.\n\n💎 <b>EL ACCESO ES COMPLETAMENTE GRATUITO</b>\nNo cobramos por el bot, la suscripción ni las señales.\n\n<b>Completa 2 condiciones sencillas para desbloquear el acceso:</b>\n1️⃣ Regístrate en nuestra plataforma de trading asociada\n2️⃣ Realiza un primer depósito de al menos <b>$5</b>\n\n💡 El depósito no es un pago para nosotros: se acredita en tu saldo de trading, que tú controlas.\n\n<b>Qué puede hacer AI SIGNAL:</b>\n📸 Analizar capturas de gráficos\n🎯 Mostrar UP / DOWN o NO SIGNAL\n⚡ Dar un resultado en segundos\n🔒 No guardar nunca las imágenes subidas\n\nEl acceso se abrirá automáticamente después de confirmar el registro y el depósito.\n\n👇 Pulsa el botón y completa las condiciones:\n\n⚠️ El trading implica riesgo de pérdida. El análisis con IA no garantiza ganancias.`,
    followup: `✅ <b>Registro confirmado</b>\n\nSolo falta un paso: un primer depósito de al menos <b>$5</b>. AI SIGNAL se abrirá automáticamente tras la confirmación.\n\n⚠️ El trading implica riesgo de pérdida.`,
    stop: "🔕 Sin recordatorios", stopped: "Recordatorios desactivados"
  },
  pt: {
    open: "🚀 ABRIR AI SIGNAL", selected: "Idioma salvo ✅",
    start: `🚀 <b>BEM-VINDO AO AI SIGNAL</b>\n\nO AI SIGNAL analisa capturas de gráficos de trading e ajuda a identificar uma possível direção da operação em segundos.\n\n💎 <b>O ACESSO É TOTALMENTE GRATUITO</b>\nNão cobramos pelo bot, assinatura ou sinais.\n\n<b>Cumpra 2 condições simples para liberar o acesso:</b>\n1️⃣ Cadastre-se em nossa plataforma de trading parceira\n2️⃣ Faça um primeiro depósito de pelo menos <b>$5</b>\n\n💡 O depósito não é um pagamento para nós — ele é creditado no seu saldo de trading, que você controla.\n\n<b>O que o AI SIGNAL faz:</b>\n📸 Analisa capturas de gráficos\n🎯 Mostra UP / DOWN ou NO SIGNAL\n⚡ Entrega o resultado em segundos\n🔒 Nunca armazena as imagens enviadas\n\nO acesso será liberado automaticamente após a confirmação do cadastro e do depósito.\n\n👇 Toque no botão e cumpra as condições:\n\n⚠️ Trading envolve risco de perda. A análise por IA não garante lucro.`,
    followup: `✅ <b>Cadastro confirmado</b>\n\nFalta só uma etapa: um primeiro depósito de pelo menos <b>$5</b>. O AI SIGNAL será liberado automaticamente após a confirmação.\n\n⚠️ Trading envolve risco de perda.`,
    stop: "🔕 Sem lembretes", stopped: "Lembretes desativados"
  },
  ja: {
    open: "🚀 AI SIGNALを開く", selected: "言語を保存しました ✅",
    start: `🚀 <b>AI SIGNALへようこそ</b>\n\nAI SIGNALは取引チャートのスクリーンショットを分析し、数秒で取引の方向性を判断するサポートをします。\n\n💎 <b>アクセスは完全無料です</b>\nボット、サブスクリプション、シグナルの料金は一切かかりません。\n\n<b>アクセスを開くには、2つの簡単な条件を完了してください：</b>\n1️⃣ 提携取引プラットフォームに登録する\n2️⃣ <b>5ドル以上</b>を初回入金する\n\n💡 入金は当社への支払いではありません。ご自身で管理する取引残高に反映されます。\n\n<b>AI SIGNALの機能：</b>\n📸 チャート画像を分析\n🎯 UP / DOWN または NO SIGNAL を表示\n⚡ 数秒で結果を表示\n🔒 アップロード画像を保存しない\n\n登録と入金の確認後、アクセスは自動的に開きます。\n\n👇 下のボタンをタップして条件を完了してください：\n\n⚠️ 取引には損失リスクがあります。AI分析は利益を保証しません。`,
    followup: `✅ <b>登録が確認されました</b>\n\n残りは<b>5ドル以上</b>の初回入金だけです。確認後、AI SIGNALは自動で開きます。\n\n⚠️ 取引には損失リスクがあります。`,
    stop: "🔕 通知しない", stopped: "リマインダーを停止しました"
  },
  hi: {
    open: "🚀 AI SIGNAL खोलें", selected: "भाषा सेव हो गई ✅",
    start: `🚀 <b>AI SIGNAL में आपका स्वागत है</b>\n\nAI SIGNAL ट्रेडिंग चार्ट के स्क्रीनशॉट का विश्लेषण करता है और सेकंडों में संभावित ट्रेड दिशा पहचानने में मदद करता है।\n\n💎 <b>एक्सेस पूरी तरह निःशुल्क है</b>\nहम बॉट, सब्सक्रिप्शन या सिग्नल के लिए कोई शुल्क नहीं लेते।\n\n<b>एक्सेस खोलने के लिए 2 आसान शर्तें पूरी करें:</b>\n1️⃣ हमारे पार्टनर ट्रेडिंग प्लेटफ़ॉर्म पर रजिस्टर करें\n2️⃣ कम से कम <b>$5</b> का पहला डिपॉजिट करें\n\n💡 डिपॉजिट हमें किया गया भुगतान नहीं है — यह आपके ट्रेडिंग बैलेंस में जमा होता है, जिसे आप नियंत्रित करते हैं।\n\n<b>AI SIGNAL क्या कर सकता है:</b>\n📸 चार्ट स्क्रीनशॉट का विश्लेषण\n🎯 UP / DOWN या NO SIGNAL दिखाना\n⚡ सेकंडों में परिणाम देना\n🔒 अपलोड की गई इमेज सेव न करना\n\nरजिस्ट्रेशन और डिपॉजिट कन्फर्म होने के बाद एक्सेस अपने-आप खुल जाएगा।\n\n👇 नीचे दिए बटन पर टैप करें और शर्तें पूरी करें:\n\n⚠️ ट्रेडिंग में नुकसान का जोखिम है। AI विश्लेषण लाभ की गारंटी नहीं देता।`,
    followup: `✅ <b>रजिस्ट्रेशन कन्फर्म हो गया</b>\n\nकेवल एक स्टेप बाकी है: कम से कम <b>$5</b> का पहला डिपॉजिट। कन्फर्म होते ही AI SIGNAL अपने-आप खुल जाएगा।\n\n⚠️ ट्रेडिंग में नुकसान का जोखिम है।`,
    stop: "🔕 रिमाइंडर बंद करें", stopped: "रिमाइंडर बंद हो गए"
  },
  id: {
    open: "🚀 BUKA AI SIGNAL", selected: "Bahasa tersimpan ✅",
    start: `🚀 <b>SELAMAT DATANG DI AI SIGNAL</b>\n\nAI SIGNAL menganalisis screenshot chart trading dan membantu menentukan potensi arah transaksi dalam hitungan detik.\n\n💎 <b>AKSES SEPENUHNYA GRATIS</b>\nKami tidak mengenakan biaya untuk bot, langganan, atau sinyal.\n\n<b>Selesaikan 2 syarat sederhana untuk membuka akses:</b>\n1️⃣ Daftar di platform trading partner kami\n2️⃣ Lakukan deposit pertama minimal <b>$5</b>\n\n💡 Deposit bukan pembayaran kepada kami — dana masuk ke saldo trading Anda dan tetap Anda kendalikan.\n\n<b>Yang dapat dilakukan AI SIGNAL:</b>\n📸 Menganalisis screenshot chart\n🎯 Menampilkan UP / DOWN atau NO SIGNAL\n⚡ Memberikan hasil dalam hitungan detik\n🔒 Tidak pernah menyimpan gambar yang diunggah\n\nAkses akan terbuka otomatis setelah registrasi dan deposit dikonfirmasi.\n\n👇 Ketuk tombol di bawah dan selesaikan syaratnya:\n\n⚠️ Trading memiliki risiko kerugian. Analisis AI tidak menjamin profit.`,
    followup: `✅ <b>Registrasi dikonfirmasi</b>\n\nTinggal satu langkah: deposit pertama minimal <b>$5</b>. AI SIGNAL akan terbuka otomatis setelah konfirmasi.\n\n⚠️ Trading memiliki risiko kerugian.`,
    stop: "🔕 Tanpa pengingat", stopped: "Pengingat dinonaktifkan"
  },
  ko: {
    open: "🚀 AI SIGNAL 열기", selected: "언어가 저장되었습니다 ✅",
    start: `🚀 <b>AI SIGNAL에 오신 것을 환영합니다</b>\n\nAI SIGNAL은 트레이딩 차트 스크린샷을 분석하고 몇 초 안에 가능한 거래 방향을 판단하도록 도와줍니다.\n\n💎 <b>이용은 완전 무료입니다</b>\n봇, 구독 또는 시그널에 대한 비용을 받지 않습니다.\n\n<b>이용하려면 2가지 간단한 조건을 완료하세요:</b>\n1️⃣ 파트너 트레이딩 플랫폼에 가입하기\n2️⃣ 최소 <b>$5</b> 첫 입금하기\n\n💡 입금은 당사에 지불하는 비용이 아닙니다. 본인이 관리하는 트레이딩 잔액에 반영됩니다.\n\n<b>AI SIGNAL의 기능:</b>\n📸 차트 스크린샷 분석\n🎯 UP / DOWN 또는 NO SIGNAL 표시\n⚡ 몇 초 안에 결과 제공\n🔒 업로드한 이미지를 저장하지 않음\n\n가입과 입금이 확인되면 이용 권한이 자동으로 열립니다.\n\n👇 아래 버튼을 눌러 조건을 완료하세요:\n\n⚠️ 트레이딩에는 손실 위험이 있습니다. AI 분석은 수익을 보장하지 않습니다.`,
    followup: `✅ <b>가입이 확인되었습니다</b>\n\n마지막 단계는 최소 <b>$5</b>의 첫 입금입니다. 확인 후 AI SIGNAL이 자동으로 열립니다.\n\n⚠️ 트레이딩에는 손실 위험이 있습니다.`,
    stop: "🔕 알림 끄기", stopped: "알림이 꺼졌습니다"
  },
  tr: {
    open: "🚀 AI SIGNAL'I AÇ", selected: "Dil kaydedildi ✅",
    start: `🚀 <b>AI SIGNAL'A HOŞ GELDİNİZ</b>\n\nAI SIGNAL, trading grafiklerinin ekran görüntülerini analiz eder ve saniyeler içinde olası işlem yönünü belirlemeye yardımcı olur.\n\n💎 <b>ERİŞİM TAMAMEN ÜCRETSİZDİR</b>\nBot, abonelik veya sinyaller için ücret almıyoruz.\n\n<b>Erişimi açmak için 2 basit koşulu tamamlayın:</b>\n1️⃣ Partner trading platformumuza kaydolun\n2️⃣ En az <b>$5</b> ilk para yatırma işlemi yapın\n\n💡 Yatırılan para bize yapılan bir ödeme değildir — kontrolünüzdeki trading bakiyenize aktarılır.\n\n<b>AI SIGNAL neler yapar:</b>\n📸 Grafik ekran görüntülerini analiz eder\n🎯 UP / DOWN veya NO SIGNAL gösterir\n⚡ Saniyeler içinde sonuç verir\n🔒 Yüklenen görselleri saklamaz\n\nKayıt ve para yatırma onaylandıktan sonra erişim otomatik olarak açılır.\n\n👇 Aşağıdaki düğmeye dokunun ve koşulları tamamlayın:\n\n⚠️ Trading kayıp riski içerir. AI analizi kâr garantisi vermez.`,
    followup: `✅ <b>Kayıt onaylandı</b>\n\nTek bir adım kaldı: en az <b>$5</b> ilk para yatırma. Onaydan sonra AI SIGNAL otomatik açılır.\n\n⚠️ Trading kayıp riski içerir.`,
    stop: "🔕 Hatırlatma yok", stopped: "Hatırlatmalar kapatıldı"
  },
  uk: {
    open: "🚀 ВІДКРИТИ AI SIGNAL", selected: "Мову збережено ✅",
    start: `🚀 <b>ЛАСКАВО ПРОСИМО ДО AI SIGNAL</b>\n\nAI SIGNAL аналізує скриншоти торгових графіків і за кілька секунд допомагає визначити можливий напрямок угоди.\n\n💎 <b>ДОСТУП ПОВНІСТЮ БЕЗКОШТОВНИЙ</b>\nМи не беремо гроші за бота, підписку або сигнали.\n\n<b>Щоб відкрити доступ, виконайте 2 прості умови:</b>\n1️⃣ Зареєструйтеся на нашій партнерській торговій платформі\n2️⃣ Внесіть перший депозит від <b>$5</b>\n\n💡 Депозит не є оплатою нам — він надходить на ваш торговий баланс, яким розпоряджаєтеся ви.\n\n<b>Що вміє AI SIGNAL:</b>\n📸 Аналізує скриншоти графіків\n🎯 Показує UP / DOWN або NO SIGNAL\n⚡ Видає результат за кілька секунд\n🔒 Не зберігає завантажені зображення\n\nПісля підтвердження реєстрації та депозиту доступ відкриється автоматично.\n\n👇 Натисніть кнопку нижче та виконайте умови:\n\n⚠️ Торгівля пов’язана з ризиком втрати коштів. AI-аналіз не гарантує прибуток.`,
    followup: `✅ <b>Реєстрацію підтверджено</b>\n\nЗалишився останній крок — перший депозит від <b>$5</b>. Після підтвердження AI SIGNAL відкриється автоматично.\n\n⚠️ Торгівля пов’язана з ризиком втрати коштів.`,
    stop: "🔕 Не нагадувати", stopped: "Нагадування вимкнено"
  },
  sv: {
    open: "🚀 ÖPPNA AI SIGNAL", selected: "Språk sparat ✅",
    start: `🚀 <b>VÄLKOMMEN TILL AI SIGNAL</b>\n\nAI SIGNAL analyserar skärmbilder av tradingdiagram och hjälper dig att identifiera en möjlig handelsriktning på några sekunder.\n\n💎 <b>ÅTKOMSTEN ÄR HELT KOSTNADSFRI</b>\nVi tar inte betalt för boten, abonnemanget eller signalerna.\n\n<b>Uppfyll 2 enkla villkor för att låsa upp åtkomsten:</b>\n1️⃣ Registrera dig på vår partnerplattform för trading\n2️⃣ Gör en första insättning på minst <b>$5</b>\n\n💡 Insättningen är inte en betalning till oss — den krediteras ditt tradingsaldo, som du själv kontrollerar.\n\n<b>Det här kan AI SIGNAL:</b>\n📸 Analysera skärmbilder av diagram\n🎯 Visa UP / DOWN eller NO SIGNAL\n⚡ Ge ett resultat på några sekunder\n🔒 Aldrig lagra uppladdade bilder\n\nÅtkomsten öppnas automatiskt när registreringen och insättningen har bekräftats.\n\n👇 Tryck på knappen och uppfyll villkoren:\n\n⚠️ Trading innebär risk för förlust. AI-analys garanterar inte vinst.`,
    followup: `✅ <b>Registrering bekräftad</b>\n\nEtt steg återstår: en första insättning på minst <b>$5</b>. AI SIGNAL öppnas automatiskt efter bekräftelsen.\n\n⚠️ Trading innebär risk för förlust.`,
    stop: "🔕 Inga påminnelser", stopped: "Påminnelser avstängda"
  },
  no: {
    open: "🚀 ÅPNE AI SIGNAL", selected: "Språk lagret ✅",
    start: `🚀 <b>VELKOMMEN TIL AI SIGNAL</b>\n\nAI SIGNAL analyserer skjermbilder av tradingdiagrammer og hjelper deg med å identifisere en mulig handelsretning på få sekunder.\n\n💎 <b>TILGANGEN ER HELT GRATIS</b>\nVi tar ikke betalt for boten, abonnementet eller signalene.\n\n<b>Oppfyll 2 enkle vilkår for å låse opp tilgangen:</b>\n1️⃣ Registrer deg på vår partnerplattform for trading\n2️⃣ Gjør et første innskudd på minst <b>$5</b>\n\n💡 Innskuddet er ikke en betaling til oss — det krediteres tradingsaldoen din, som du selv kontrollerer.\n\n<b>Dette kan AI SIGNAL gjøre:</b>\n📸 Analysere skjermbilder av diagrammer\n🎯 Vise UP / DOWN eller NO SIGNAL\n⚡ Gi et resultat på få sekunder\n🔒 Aldri lagre opplastede bilder\n\nTilgangen åpnes automatisk når registreringen og innskuddet er bekreftet.\n\n👇 Trykk på knappen og oppfyll vilkårene:\n\n⚠️ Trading innebærer risiko for tap. AI-analyse garanterer ikke fortjeneste.`,
    followup: `✅ <b>Registrering bekreftet</b>\n\nEtt steg gjenstår: et første innskudd på minst <b>$5</b>. AI SIGNAL åpnes automatisk etter bekreftelsen.\n\n⚠️ Trading innebærer risiko for tap.`,
    stop: "🔕 Ingen påminnelser", stopped: "Påminnelser deaktivert"
  },
  zh: {
    open: "🚀 打开 AI SIGNAL", selected: "语言已保存 ✅",
    start: `🚀 <b>欢迎使用 AI SIGNAL</b>\n\nAI SIGNAL 分析交易图表截图，并在数秒内帮助判断潜在的交易方向。\n\n💎 <b>访问完全免费</b>\n机器人、订阅和信号均不收取任何费用。\n\n<b>完成 2 个简单条件即可解锁：</b>\n1️⃣ 在我们的合作交易平台完成注册\n2️⃣ 首次入金至少 <b>5 美元</b>\n\n💡 入金并非支付给我们，而是进入由您自行管理的交易余额。\n\n<b>AI SIGNAL 可以：</b>\n📸 分析图表截图\n🎯 显示 UP / DOWN 或 NO SIGNAL\n⚡ 数秒内返回结果\n🔒 绝不保存上传的图片\n\n注册和入金确认后，访问权限将自动开放。\n\n👇 点击下方按钮并完成条件：\n\n⚠️ 交易存在亏损风险。AI 分析不保证盈利。`,
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
