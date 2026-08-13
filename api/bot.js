import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const DEFAULT_MINIAPP_URL = "https://trading-signal-miniapp-clean-vercel.vercel.app";

const LANGUAGES = [
  ["ru","🇷🇺","Русский"],["en","🇺🇸","English"],["de","🇩🇪","Deutsch"],["fr","🇫🇷","Français"],
  ["it","🇮🇹","Italiano"],["es","🇪🇸","Español"],["pt","🇧🇷","Português"],["ja","🇯🇵","日本語"],
  ["hi","🇮🇳","हिन्दी"],["id","🇮🇩","Bahasa Indonesia"],["ko","🇰🇷","한국어"],["tr","🇹🇷","Türkçe"],
  ["uk","🇺🇦","Українська"],["sv","🇸🇪","Svenska"],["no","🇳🇴","Norsk"],["zh","🇨🇳","中文"]
];

const COPY = {
  ru:{open:"🚀 ОТКРЫТЬ AI SIGNAL",change:"🌐 Сменить язык",selected:"Язык выбран ✅",text:`🚀 <b>Добро пожаловать в AI SIGNAL</b>\n\n🤖 AI SIGNAL — торговый помощник с автоматизированным анализом графика. Он помогает быстрее оценивать ситуацию на рынке и находить потенциальные торговые возможности.\n\n<b>Чтобы открыть полный доступ, выполните всего 2 простых условия:</b>\n\n1️⃣ Зарегистрируйтесь на нашем партнёрском трейдерском сайте.\n2️⃣ Внесите первый депозит от <b>$5</b>.\n\n💚 <b>Доступ к боту бесплатный.</b> Мы не берём оплату за подписку, сигналы или использование Mini App. Депозит вносится на ваш собственный торговый аккаунт на платформе.\n\n⚡ <b>Что умеет AI SIGNAL:</b>\n• анализирует скриншот графика за несколько секунд;\n• показывает направление UP / DOWN или «Нет сигнала»;\n• поддерживает разные таймфреймы и время сделки;\n• отсекает слабые и неясные сетапы;\n• работает прямо внутри Telegram;\n• показывает интерфейс на выбранном языке.\n\n✅ Регистрация и депозит проверяются автоматически. После подтверждения доступ откроется сам.\n\n⚠️ Торговля связана с риском потери средств. AI-анализ не гарантирует прибыль.`},
  en:{open:"🚀 OPEN AI SIGNAL",change:"🌐 Change language",selected:"Language selected ✅",text:`🚀 <b>Welcome to AI SIGNAL</b>\n\n🤖 AI SIGNAL is a trading assistant with automated chart analysis. It helps you assess market conditions faster and spot potential trading opportunities.\n\n<b>To unlock full access, complete just 2 simple steps:</b>\n\n1️⃣ Register on our partner trading platform.\n2️⃣ Make a first deposit of at least <b>$5</b>.\n\n💚 <b>Access to the bot is free.</b> We do not charge for subscriptions, signals, or Mini App access. The deposit goes to your own trading account on the platform.\n\n⚡ <b>AI SIGNAL features:</b>\n• analyzes a chart screenshot in seconds;\n• shows UP / DOWN or “No signal”;\n• supports multiple timeframes and trade durations;\n• filters weak and unclear setups;\n• works directly inside Telegram;\n• uses your selected language.\n\n✅ Registration and deposit are checked automatically. Access opens after confirmation.\n\n⚠️ Trading involves risk of loss. AI analysis does not guarantee profit.`},
  de:{open:"🚀 AI SIGNAL ÖFFNEN",change:"🌐 Sprache ändern",selected:"Sprache gewählt ✅",text:`🚀 <b>Willkommen bei AI SIGNAL</b>\n\n🤖 AI SIGNAL ist ein Trading-Assistent mit automatisierter Chartanalyse. Er hilft dir, Marktsituationen schneller einzuschätzen und mögliche Handelschancen zu erkennen.\n\n<b>Für den vollständigen Zugang sind nur 2 einfache Schritte nötig:</b>\n\n1️⃣ Registriere dich auf unserer Partner-Trading-Plattform.\n2️⃣ Tätige eine erste Einzahlung von mindestens <b>$5</b>.\n\n💚 <b>Der Bot-Zugang ist kostenlos.</b> Wir berechnen keine Gebühren für Abo, Signale oder die Mini App. Die Einzahlung landet auf deinem eigenen Trading-Konto.\n\n⚡ <b>AI SIGNAL kann:</b>\n• Chart-Screenshots in wenigen Sekunden analysieren;\n• UP / DOWN oder „Kein Signal“ anzeigen;\n• mehrere Zeitrahmen und Laufzeiten nutzen;\n• schwache und unklare Setups herausfiltern;\n• direkt in Telegram arbeiten;\n• die gewählte Sprache verwenden.\n\n✅ Registrierung und Einzahlung werden automatisch geprüft.\n\n⚠️ Trading ist mit Verlustrisiken verbunden. Die AI-Analyse garantiert keinen Gewinn.`},
  fr:{open:"🚀 OUVRIR AI SIGNAL",change:"🌐 Changer de langue",selected:"Langue sélectionnée ✅",text:`🚀 <b>Bienvenue sur AI SIGNAL</b>\n\n🤖 AI SIGNAL est un assistant de trading avec analyse automatisée des graphiques. Il aide à évaluer plus vite le marché et à repérer des opportunités potentielles.\n\n<b>Pour débloquer l’accès complet, il suffit de 2 étapes:</b>\n\n1️⃣ Inscris-toi sur notre plateforme de trading partenaire.\n2️⃣ Effectue un premier dépôt d’au moins <b>5 $</b>.\n\n💚 <b>L’accès au bot est gratuit.</b> Nous ne facturons ni abonnement, ni signaux, ni accès à la Mini App. Le dépôt reste sur ton propre compte de trading.\n\n⚡ <b>AI SIGNAL permet de:</b>\n• analyser une capture de graphique en quelques secondes;\n• afficher UP / DOWN ou «Pas de signal»;\n• utiliser plusieurs unités de temps et durées;\n• filtrer les configurations faibles ou ambiguës;\n• fonctionner directement dans Telegram;\n• utiliser la langue choisie.\n\n✅ L’inscription et le dépôt sont vérifiés automatiquement.\n\n⚠️ Le trading comporte un risque de perte. L’analyse IA ne garantit aucun profit.`},
  it:{open:"🚀 APRI AI SIGNAL",change:"🌐 Cambia lingua",selected:"Lingua selezionata ✅",text:`🚀 <b>Benvenuto su AI SIGNAL</b>\n\n🤖 AI SIGNAL è un assistente di trading con analisi automatizzata dei grafici. Aiuta a valutare più rapidamente il mercato e a individuare potenziali opportunità.\n\n<b>Per sbloccare l’accesso completo bastano 2 semplici passaggi:</b>\n\n1️⃣ Registrati sulla nostra piattaforma di trading partner.\n2️⃣ Effettua un primo deposito di almeno <b>$5</b>.\n\n💚 <b>L’accesso al bot è gratuito.</b> Non chiediamo pagamenti per abbonamento, segnali o Mini App. Il deposito va sul tuo conto di trading personale.\n\n⚡ <b>AI SIGNAL:</b>\n• analizza uno screenshot del grafico in pochi secondi;\n• mostra UP / DOWN o “Nessun segnale”;\n• supporta diversi timeframe e durate;\n• filtra setup deboli o poco chiari;\n• funziona direttamente in Telegram;\n• usa la lingua selezionata.\n\n✅ Registrazione e deposito vengono verificati automaticamente.\n\n⚠️ Il trading comporta rischio di perdita. L’analisi AI non garantisce profitti.`},
  es:{open:"🚀 ABRIR AI SIGNAL",change:"🌐 Cambiar idioma",selected:"Idioma seleccionado ✅",text:`🚀 <b>Bienvenido a AI SIGNAL</b>\n\n🤖 AI SIGNAL es un asistente de trading con análisis automatizado de gráficos. Te ayuda a evaluar el mercado más rápido y detectar posibles oportunidades.\n\n<b>Para desbloquear el acceso completo solo necesitas 2 pasos:</b>\n\n1️⃣ Regístrate en nuestra plataforma de trading asociada.\n2️⃣ Realiza un primer depósito de al menos <b>$5</b>.\n\n💚 <b>El acceso al bot es gratuito.</b> No cobramos suscripción, señales ni acceso a la Mini App. El depósito queda en tu propia cuenta de trading.\n\n⚡ <b>AI SIGNAL:</b>\n• analiza capturas del gráfico en segundos;\n• muestra UP / DOWN o “Sin señal”;\n• admite varios marcos temporales y duraciones;\n• filtra configuraciones débiles o poco claras;\n• funciona directamente en Telegram;\n• usa el idioma elegido.\n\n✅ El registro y el depósito se verifican automáticamente.\n\n⚠️ El trading implica riesgo de pérdida. El análisis con IA no garantiza ganancias.`},
  pt:{open:"🚀 ABRIR AI SIGNAL",change:"🌐 Alterar idioma",selected:"Idioma selecionado ✅",text:`🚀 <b>Bem-vindo ao AI SIGNAL</b>\n\n🤖 AI SIGNAL é um assistente de trading com análise automatizada de gráficos. Ele ajuda a avaliar o mercado mais rápido e identificar possíveis oportunidades.\n\n<b>Para liberar o acesso completo, faça apenas 2 etapas:</b>\n\n1️⃣ Cadastre-se em nossa plataforma de trading parceira.\n2️⃣ Faça um primeiro depósito de pelo menos <b>$5</b>.\n\n💚 <b>O acesso ao bot é gratuito.</b> Não cobramos assinatura, sinais ou acesso ao Mini App. O depósito fica na sua própria conta de trading.\n\n⚡ <b>AI SIGNAL:</b>\n• analisa prints do gráfico em segundos;\n• mostra UP / DOWN ou “Sem sinal”;\n• suporta vários timeframes e durações;\n• filtra setups fracos ou pouco claros;\n• funciona diretamente no Telegram;\n• usa o idioma selecionado.\n\n✅ Cadastro e depósito são verificados automaticamente.\n\n⚠️ Trading envolve risco de perda. A análise por IA não garante lucro.`},
  ja:{open:"🚀 AI SIGNALを開く",change:"🌐 言語を変更",selected:"言語を選択しました ✅",text:`🚀 <b>AI SIGNALへようこそ</b>\n\n🤖 AI SIGNALは、チャートを自動分析するトレーディングアシスタントです。市場状況を素早く確認し、潜在的な取引機会を見つける手助けをします。\n\n<b>完全アクセスには2つの簡単な条件があります:</b>\n\n1️⃣ パートナーの取引プラットフォームで登録。\n2️⃣ 初回入金を<b>5ドル以上</b>行う。\n\n💚 <b>ボットの利用は無料です。</b> サブスクリプション、シグナル、Mini Appの利用料はかかりません。入金はご自身の取引口座に反映されます。\n\n⚡ <b>AI SIGNALの機能:</b>\n• チャート画像を数秒で分析;\n• UP / DOWN または「シグナルなし」を表示;\n• 複数の時間足と取引時間に対応;\n• 弱い・不明確なセットアップを除外;\n• Telegram内で直接利用;\n• 選択した言語で表示。\n\n✅ 登録と入金は自動確認されます。\n\n⚠️ 取引には損失リスクがあります。AI分析は利益を保証しません。`},
  hi:{open:"🚀 AI SIGNAL खोलें",change:"🌐 भाषा बदलें",selected:"भाषा चुनी गई ✅",text:`🚀 <b>AI SIGNAL में आपका स्वागत है</b>\n\n🤖 AI SIGNAL एक ट्रेडिंग असिस्टेंट है जो चार्ट का ऑटोमेटेड विश्लेषण करता है। यह मार्केट को जल्दी समझने और संभावित ट्रेडिंग अवसर देखने में मदद करता है।\n\n<b>पूरा एक्सेस खोलने के लिए केवल 2 आसान स्टेप पूरे करें:</b>\n\n1️⃣ हमारी पार्टनर ट्रेडिंग प्लेटफॉर्म पर रजिस्टर करें।\n2️⃣ कम से कम <b>$5</b> का पहला डिपॉजिट करें।\n\n💚 <b>बॉट का एक्सेस मुफ्त है।</b> हम सब्सक्रिप्शन, सिग्नल या Mini App के लिए कोई फीस नहीं लेते। डिपॉजिट आपके अपने ट्रेडिंग अकाउंट में जाता है।\n\n⚡ <b>AI SIGNAL:</b>\n• कुछ सेकंड में चार्ट स्क्रीनशॉट का विश्लेषण;\n• UP / DOWN या “कोई सिग्नल नहीं”;\n• कई टाइमफ्रेम और ट्रेड अवधि;\n• कमजोर या अस्पष्ट सेटअप फ़िल्टर;\n• सीधे Telegram में काम;\n• चुनी हुई भाषा में इंटरफ़ेस।\n\n✅ रजिस्ट्रेशन और डिपॉजिट अपने-आप चेक होते हैं।\n\n⚠️ ट्रेडिंग में नुकसान का जोखिम है। AI विश्लेषण लाभ की गारंटी नहीं देता।`},
  id:{open:"🚀 BUKA AI SIGNAL",change:"🌐 Ganti bahasa",selected:"Bahasa dipilih ✅",text:`🚀 <b>Selamat datang di AI SIGNAL</b>\n\n🤖 AI SIGNAL adalah asisten trading dengan analisis chart otomatis. Sistem membantu menilai kondisi pasar lebih cepat dan melihat peluang trading potensial.\n\n<b>Untuk membuka akses penuh, cukup lakukan 2 langkah:</b>\n\n1️⃣ Daftar di platform trading partner kami.\n2️⃣ Lakukan deposit pertama minimal <b>$5</b>.\n\n💚 <b>Akses bot gratis.</b> Kami tidak mengenakan biaya langganan, sinyal, atau Mini App. Deposit masuk ke akun trading milik Anda sendiri.\n\n⚡ <b>AI SIGNAL:</b>\n• menganalisis screenshot chart dalam hitungan detik;\n• menampilkan UP / DOWN atau “Tidak ada sinyal”;\n• mendukung berbagai timeframe dan durasi trade;\n• menyaring setup yang lemah atau tidak jelas;\n• bekerja langsung di Telegram;\n• menggunakan bahasa pilihan Anda.\n\n✅ Registrasi dan deposit diperiksa otomatis.\n\n⚠️ Trading memiliki risiko kerugian. Analisis AI tidak menjamin profit.`},
  ko:{open:"🚀 AI SIGNAL 열기",change:"🌐 언어 변경",selected:"언어가 선택되었습니다 ✅",text:`🚀 <b>AI SIGNAL에 오신 것을 환영합니다</b>\n\n🤖 AI SIGNAL은 차트를 자동으로 분석하는 트레이딩 어시스턴트입니다. 시장 상황을 더 빠르게 확인하고 잠재적인 거래 기회를 찾는 데 도움을 줍니다.\n\n<b>전체 이용 권한은 간단한 2단계로 열립니다:</b>\n\n1️⃣ 파트너 트레이딩 플랫폼에 가입하세요.\n2️⃣ 최소 <b>$5</b>의 첫 입금을 진행하세요.\n\n💚 <b>봇 이용은 무료입니다.</b> 구독, 시그널, Mini App 사용료를 받지 않습니다. 입금액은 본인의 트레이딩 계정에 들어갑니다.\n\n⚡ <b>AI SIGNAL 기능:</b>\n• 차트 스크린샷을 몇 초 안에 분석;\n• UP / DOWN 또는 “신호 없음” 표시;\n• 여러 타임프레임과 거래 시간 지원;\n• 약하거나 불명확한 셋업 필터링;\n• Telegram 안에서 바로 사용;\n• 선택한 언어로 표시.\n\n✅ 가입과 입금은 자동으로 확인됩니다.\n\n⚠️ 트레이딩에는 손실 위험이 있습니다. AI 분석은 수익을 보장하지 않습니다.`},
  tr:{open:"🚀 AI SIGNAL'I AÇ",change:"🌐 Dili değiştir",selected:"Dil seçildi ✅",text:`🚀 <b>AI SIGNAL'e hoş geldin</b>\n\n🤖 AI SIGNAL, otomatik grafik analizi yapan bir trading asistanıdır. Piyasa durumunu daha hızlı değerlendirmene ve potansiyel fırsatları görmene yardımcı olur.\n\n<b>Tam erişim için sadece 2 basit adım:</b>\n\n1️⃣ Partner trading platformumuza kayıt ol.\n2️⃣ En az <b>$5</b> ilk para yatırma işlemi yap.\n\n💚 <b>Bot erişimi ücretsizdir.</b> Abonelik, sinyal veya Mini App kullanımı için ücret almıyoruz. Yatırdığın para kendi trading hesabına gider.\n\n⚡ <b>AI SIGNAL:</b>\n• grafik ekran görüntüsünü saniyeler içinde analiz eder;\n• UP / DOWN veya “Sinyal yok” gösterir;\n• farklı zaman dilimleri ve işlem sürelerini destekler;\n• zayıf ve belirsiz kurulumları filtreler;\n• doğrudan Telegram içinde çalışır;\n• seçtiğin dili kullanır.\n\n✅ Kayıt ve yatırım otomatik kontrol edilir.\n\n⚠️ Trading para kaybetme riski içerir. AI analizi kâr garantisi vermez.`},
  uk:{open:"🚀 ВІДКРИТИ AI SIGNAL",change:"🌐 Змінити мову",selected:"Мову вибрано ✅",text:`🚀 <b>Ласкаво просимо до AI SIGNAL</b>\n\n🤖 AI SIGNAL — торговий помічник з автоматизованим аналізом графіка. Він допомагає швидше оцінювати ринок і знаходити потенційні торгові можливості.\n\n<b>Щоб відкрити повний доступ, виконай лише 2 прості умови:</b>\n\n1️⃣ Зареєструйся на нашій партнерській торговій платформі.\n2️⃣ Внеси перший депозит від <b>$5</b>.\n\n💚 <b>Доступ до бота безкоштовний.</b> Ми не беремо оплату за підписку, сигнали чи Mini App. Депозит надходить на твій власний торговий рахунок.\n\n⚡ <b>AI SIGNAL:</b>\n• аналізує скриншот графіка за кілька секунд;\n• показує UP / DOWN або «Немає сигналу»;\n• підтримує різні таймфрейми та тривалість угоди;\n• відсіює слабкі й нечіткі сетапи;\n• працює прямо в Telegram;\n• використовує вибрану мову.\n\n✅ Реєстрація та депозит перевіряються автоматично.\n\n⚠️ Торгівля пов’язана з ризиком втрати коштів. AI-аналіз не гарантує прибуток.`},
  sv:{open:"🚀 ÖPPNA AI SIGNAL",change:"🌐 Byt språk",selected:"Språk valt ✅",text:`🚀 <b>Välkommen till AI SIGNAL</b>\n\n🤖 AI SIGNAL är en tradingassistent med automatiserad diagramanalys. Den hjälper dig att snabbare bedöma marknaden och hitta potentiella handelsmöjligheter.\n\n<b>För full åtkomst krävs bara 2 enkla steg:</b>\n\n1️⃣ Registrera dig på vår partnerplattform för trading.\n2️⃣ Gör en första insättning på minst <b>$5</b>.\n\n💚 <b>Åtkomst till boten är gratis.</b> Vi tar inte betalt för abonnemang, signaler eller Mini App. Insättningen går till ditt eget tradingkonto.\n\n⚡ <b>AI SIGNAL:</b>\n• analyserar en skärmbild av diagrammet på några sekunder;\n• visar UP / DOWN eller “Ingen signal”;\n• stöder flera tidsramar och handelstider;\n• filtrerar svaga och otydliga setups;\n• fungerar direkt i Telegram;\n• använder ditt valda språk.\n\n✅ Registrering och insättning kontrolleras automatiskt.\n\n⚠️ Trading innebär risk för förlust. AI-analys garanterar inte vinst.`},
  no:{open:"🚀 ÅPNE AI SIGNAL",change:"🌐 Bytt språk",selected:"Språk valgt ✅",text:`🚀 <b>Velkommen til AI SIGNAL</b>\n\n🤖 AI SIGNAL er en tradingassistent med automatisert diagramanalyse. Den hjelper deg med å vurdere markedet raskere og se potensielle handelsmuligheter.\n\n<b>For full tilgang trenger du bare 2 enkle steg:</b>\n\n1️⃣ Registrer deg på vår partnerplattform for trading.\n2️⃣ Gjør et første innskudd på minst <b>$5</b>.\n\n💚 <b>Tilgang til boten er gratis.</b> Vi tar ikke betalt for abonnement, signaler eller Mini App. Innskuddet går til din egen tradingkonto.\n\n⚡ <b>AI SIGNAL:</b>\n• analyserer et skjermbilde av diagrammet på sekunder;\n• viser UP / DOWN eller “Ingen signal”;\n• støtter flere tidsrammer og handelstider;\n• filtrerer svake og uklare setups;\n• fungerer direkte i Telegram;\n• bruker valgt språk.\n\n✅ Registrering og innskudd kontrolleres automatisk.\n\n⚠️ Trading innebærer risiko for tap. AI-analyse garanterer ikke fortjeneste.`},
  zh:{open:"🚀 打开 AI SIGNAL",change:"🌐 更改语言",selected:"语言已选择 ✅",text:`🚀 <b>欢迎使用 AI SIGNAL</b>\n\n🤖 AI SIGNAL 是一款带有自动图表分析功能的交易助手，帮助你更快评估市场并发现潜在交易机会。\n\n<b>开启完整权限只需完成 2 个简单步骤:</b>\n\n1️⃣ 在我们的合作交易平台完成注册。\n2️⃣ 首次入金至少 <b>5 美元</b>。\n\n💚 <b>机器人本身免费使用。</b> 我们不收取订阅、信号或 Mini App 使用费。入金会进入你自己的交易账户。\n\n⚡ <b>AI SIGNAL 功能:</b>\n• 几秒内分析图表截图;\n• 显示 UP / DOWN 或“无信号”;\n• 支持多种时间周期和交易时长;\n• 过滤弱势或不清晰的交易形态;\n• 直接在 Telegram 内使用;\n• 使用你选择的语言。\n\n✅ 注册和入金状态会自动验证。\n\n⚠️ 交易存在亏损风险。AI 分析不保证盈利。`}
};

let pool = null;
let schemaPromise = null;

export default async function handler(req,res){
  const token = process.env.BOT_TOKEN;
  if(!token) return res.status(503).json({ok:false,error:"bot_not_configured"});
  if(req.method !== "POST") return res.status(405).json({ok:false,error:"method_not_allowed"});

  const expected = webhookSecret(token);
  const received = String(req.headers?.["x-telegram-bot-api-secret-token"] || "");
  if(!safeEqual(expected,received)) return res.status(403).json({ok:false,error:"forbidden"});

  try{
    const update = req.body || {};
    if(update.callback_query) await handleCallback(token,update.callback_query);
    else if(update.message) await handleMessage(token,update.message);
  }catch(error){
    console.error("Telegram bot update failed",error?.message || error);
  }
  return res.status(200).json({ok:true});
}

async function handleMessage(token,message){
  const chatId = message?.chat?.id;
  if(!chatId) return;
  const text = String(message.text || "").trim();
  const command = text.split(/\s+/)[0].toLowerCase().split("@")[0];
  if(command === "/start" || command === "/language"){
    await saveBotProfile(message.from,null);
    return sendLanguageChooser(token,chatId);
  }
  const locale = await getSavedLocale(message.from?.id);
  if(locale) return sendInstruction(token,chatId,locale);
  return sendLanguageChooser(token,chatId);
}

async function handleCallback(token,query){
  const data = String(query.data || "");
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  await tg(token,"answerCallbackQuery",{callback_query_id:query.id}).catch(()=>{});
  if(!chatId || !messageId) return;

  if(data === "choose_language"){
    return tg(token,"editMessageText",{
      chat_id:chatId,message_id:messageId,text:chooseLanguageText(),reply_markup:languageKeyboard()
    });
  }
  if(!data.startsWith("lang:")) return;
  const locale = normalizeLocale(data.slice(5));
  if(!COPY[locale]) return;
  await saveBotProfile(query.from,locale);
  await tg(token,"answerCallbackQuery",{callback_query_id:query.id,text:COPY[locale].selected,show_alert:false}).catch(()=>{});
  return editInstruction(token,chatId,messageId,locale);
}

function chooseLanguageText(){
  return "🌍 <b>Choose your language</b>\nВыберите язык / Sprache wählen / Elige tu idioma / Escolha seu idioma";
}

function languageKeyboard(){
  const rows = [];
  for(let i=0;i<LANGUAGES.length;i+=2){
    rows.push(LANGUAGES.slice(i,i+2).map(([code,flag,label])=>({text:`${flag} ${label}`,callback_data:`lang:${code}`})));
  }
  return {inline_keyboard:rows};
}

async function sendLanguageChooser(token,chatId){
  return tg(token,"sendMessage",{chat_id:chatId,text:chooseLanguageText(),parse_mode:"HTML",reply_markup:languageKeyboard()});
}

async function sendInstruction(token,chatId,locale){
  const copy = COPY[locale] || COPY.en;
  return tg(token,"sendMessage",{
    chat_id:chatId,text:copy.text,parse_mode:"HTML",disable_web_page_preview:true,
    reply_markup:instructionKeyboard(locale)
  });
}

async function editInstruction(token,chatId,messageId,locale){
  const copy = COPY[locale] || COPY.en;
  return tg(token,"editMessageText",{
    chat_id:chatId,message_id:messageId,text:copy.text,parse_mode:"HTML",disable_web_page_preview:true,
    reply_markup:instructionKeyboard(locale)
  });
}

function instructionKeyboard(locale){
  const copy = COPY[locale] || COPY.en;
  return {inline_keyboard:[
    [{text:copy.open,web_app:{url:miniappUrl(locale)}}],
    [{text:copy.change,callback_data:"choose_language"}]
  ]};
}

function miniappUrl(locale){
  const base = process.env.MINIAPP_URL || DEFAULT_MINIAPP_URL;
  const url = new URL(base);
  url.searchParams.set("lang",locale);
  url.searchParams.set("src","telegram_bot");
  return url.toString();
}

async function tg(token,method,payload){
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
  });
  const data = await response.json().catch(()=>null);
  if(!response.ok || !data?.ok) throw new Error(`telegram_${method}_failed_${response.status}`);
  return data.result;
}

async function saveBotProfile(user,locale){
  if(!process.env.DATABASE_URL || !user?.id) return;
  await ensureSchema();
  await getPool().query(`INSERT INTO ai_signal_bot_users (telegram_id,selected_locale,tg_username,tg_first_name,telegram_language,updated_at)
    VALUES ($1,$2,$3,$4,$5,NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET
      selected_locale=COALESCE(EXCLUDED.selected_locale,ai_signal_bot_users.selected_locale),
      tg_username=COALESCE(EXCLUDED.tg_username,ai_signal_bot_users.tg_username),
      tg_first_name=COALESCE(EXCLUDED.tg_first_name,ai_signal_bot_users.tg_first_name),
      telegram_language=COALESCE(EXCLUDED.telegram_language,ai_signal_bot_users.telegram_language),updated_at=NOW()`,[
        String(user.id),locale || null,clean(user.username),clean(user.first_name),clean(user.language_code)
      ]);
}

async function getSavedLocale(userId){
  if(!process.env.DATABASE_URL || !userId) return null;
  await ensureSchema();
  const result = await getPool().query(`SELECT selected_locale FROM ai_signal_bot_users WHERE telegram_id=$1 LIMIT 1`,[String(userId)]);
  const locale = normalizeLocale(result.rows[0]?.selected_locale);
  return COPY[locale] ? locale : null;
}

function getPool(){
  if(!pool){
    pool = new Pool({connectionString:process.env.DATABASE_URL,max:2,idleTimeoutMillis:10000,connectionTimeoutMillis:8000,ssl:{rejectUnauthorized:false}});
    pool.on("error",error=>console.error("Bot Postgres pool error",error?.message || error));
  }
  return pool;
}

async function ensureSchema(){
  if(!schemaPromise){
    schemaPromise = getPool().query(`CREATE TABLE IF NOT EXISTS ai_signal_bot_users (
      telegram_id BIGINT PRIMARY KEY,
      selected_locale TEXT NULL,
      tg_username TEXT NULL,
      tg_first_name TEXT NULL,
      telegram_language TEXT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).catch(error=>{schemaPromise=null;throw error;});
  }
  await schemaPromise;
}

function normalizeLocale(value){
  const raw = String(value || "").toLowerCase().replace("_","-").split("-")[0];
  if(raw === "ua") return "uk";
  if(raw === "cn") return "zh";
  return raw;
}
function webhookSecret(token){ return crypto.createHash("sha256").update(`ai-signal-webhook:${token}`).digest("hex"); }
function safeEqual(a,b){
  const left=Buffer.from(String(a)),right=Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left,right);
}
function clean(value){ const text=String(value || "").trim().slice(0,160); return text || null; }
