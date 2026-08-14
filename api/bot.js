import crypto from "node:crypto";
import {
  databaseConfigured, disableReminders, getAccessStatus, getSavedLocale, getStats,
  getUserProfile, minDepositAmount, normalizeUserId, saveSelectedLocale, syncUserContext
} from "../lib/database.js";
import { getBotCopy, languageKeyboard, normalizeLocale } from "../lib/locales.js";

const DEFAULT_MINIAPP_URL = "https://trading-signal-miniapp-clean-vercel.vercel.app";
let commandsPromise = null;

export default async function handler(req, res) {
  const token = process.env.BOT_TOKEN;
  if (!token) return res.status(503).json({ ok: false, error: "bot_not_configured" });
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  const expected = webhookSecret(token);
  const received = String(req.headers?.["x-telegram-bot-api-secret-token"] || "");
  if (!safeEqual(expected, received)) return res.status(403).json({ ok: false, error: "forbidden" });

  try {
    if (String(process.env.AUTO_CONFIGURE_BOT_COMMANDS || "true").toLowerCase() !== "false") {
      await ensureCommands(token).catch(error => console.warn("Telegram command setup failed", error?.message || error));
    }
    const update = req.body || {};
    if (update.callback_query) await handleCallback(token, update.callback_query);
    else if (update.message) await handleMessage(token, update.message);
  } catch (error) {
    console.error("Telegram bot update failed", error?.message || error);
  }
  return res.status(200).json({ ok: true });
}

async function ensureCommands(token) {
  if (!commandsPromise) {
    commandsPromise = (async () => {
      await tg(token, "setMyCommands", { commands: [
        { command: "start", description: "Start / Choose language" },
        { command: "language", description: "Change language" }
      ] });
      for (const chatId of commandScopeIds()) {
        await tg(token, "setMyCommands", {
          scope: { type: "chat", chat_id: chatId },
          commands: [
            { command: "start", description: "Start / Choose language" },
            { command: "language", description: "Change language" },
            { command: "stats", description: "All-time funnel stats" },
            { command: "today", description: "Today funnel stats" },
            { command: "user", description: "User status by Telegram ID" }
          ]
        });
      }
      return true;
    })().catch(error => { commandsPromise = null; throw error; });
  }
  return commandsPromise;
}

function commandScopeIds() {
  return [...new Set([
    ...String(process.env.ADMIN_TELEGRAM_IDS || process.env.BOT_ADMIN_IDS || "").split(","),
    process.env.POSTBACK_LOG_CHAT_ID || ""
  ].map(value => value.trim()).filter(value => /^-?\d+$/.test(value)))];
}

async function handleMessage(token, message) {
  const chatId = message?.chat?.id;
  if (!chatId) return;
  const text = String(message.text || "").trim();
  const [rawCommand, argument] = text.split(/\s+/, 2);
  const command = rawCommand.toLowerCase().split("@")[0];

  if (["/stats", "/today", "/user"].includes(command)) {
    if (!await isAdmin(token, message)) return sendText(token, chatId, "⛔ Команда доступна только администратору.");
    if (!databaseConfigured()) return sendText(token, chatId, "⚠️ Railway database не настроена.");
    if (command === "/stats") return sendStats(token, chatId, false);
    if (command === "/today") return sendStats(token, chatId, true);
    return sendUser(token, chatId, argument);
  }

  if (command === "/language") {
    await rememberUser(message.from, null);
    return sendLanguageChooser(token, chatId);
  }
  if (command === "/start") {
    await rememberUser(message.from, null);
    const saved = await getSavedLocale(message.from?.id);
    return saved ? sendPremiumStart(token, chatId, saved) : sendLanguageChooser(token, chatId);
  }

  const locale = await getSavedLocale(message.from?.id);
  if (locale) return sendPremiumStart(token, chatId, locale);
  return sendLanguageChooser(token, chatId);
}

async function handleCallback(token, query) {
  const data = String(query.data || "");
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  if (!chatId) return answerCallback(token, query.id);

  if (data === "followup:stop") {
    await disableReminders(query.from?.id);
    const locale = await getSavedLocale(query.from?.id) || normalizeLocale(query.from?.language_code, "en");
    await answerCallback(token, query.id, getBotCopy(locale).stopped, true);
    if (messageId) await tg(token, "editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }).catch(() => {});
    return;
  }
  if (!data.startsWith("lang:")) return answerCallback(token, query.id);
  const locale = normalizeLocale(data.slice(5), null);
  if (!locale) return answerCallback(token, query.id);
  await rememberUser(query.from, locale);
  await answerCallback(token, query.id, getBotCopy(locale).selected, false);
  if (messageId) return editPremiumStart(token, chatId, messageId, locale);
  return sendPremiumStart(token, chatId, locale);
}

function chooseLanguageText() {
  return "🌍 <b>Choose your language</b>\nВыберите язык / Sprache wählen / Elige tu idioma / Escolha seu idioma";
}

async function sendLanguageChooser(token, chatId) {
  return tg(token, "sendMessage", { chat_id: chatId, text: chooseLanguageText(), parse_mode: "HTML", reply_markup: languageKeyboard() });
}

async function sendPremiumStart(token, chatId, locale) {
  const copy = getBotCopy(locale);
  return tg(token, "sendMessage", {
    chat_id: chatId, text: copy.start, parse_mode: "HTML", disable_web_page_preview: true,
    reply_markup: openKeyboard(locale)
  });
}

async function editPremiumStart(token, chatId, messageId, locale) {
  const copy = getBotCopy(locale);
  return tg(token, "editMessageText", {
    chat_id: chatId, message_id: messageId, text: copy.start, parse_mode: "HTML", disable_web_page_preview: true,
    reply_markup: openKeyboard(locale)
  });
}

function openKeyboard(locale) {
  const copy = getBotCopy(locale);
  return { inline_keyboard: [[{ text: copy.open, web_app: { url: miniappUrl(locale) } }]] };
}

function miniappUrl(locale) {
  const url = new URL(process.env.MINIAPP_URL || DEFAULT_MINIAPP_URL);
  url.searchParams.set("lang", normalizeLocale(locale, "en"));
  url.searchParams.set("src", "telegram_bot");
  return url.toString();
}

async function rememberUser(user, locale) {
  if (!databaseConfigured() || !user?.id) return;
  if (locale) await saveSelectedLocale(user, locale, "telegram_bot");
  else await syncUserContext(user.id, { headers: {} }, user, { source: "telegram_bot" });
}

async function sendStats(token, chatId, today) {
  const stats = await getStats({ today });
  const title = today ? "📊 <b>ВОРОНКА СЕГОДНЯ (МСК)</b>" : "📊 <b>ВОРОНКА ЗА ВСЁ ВРЕМЯ</b>";
  const text = [
    title, "",
    `🔗 Открыли регистрацию: <b>${stats.opened}</b> <i>(${stats.open_events} кликов)</i>`,
    `✅ Зарегистрировались: <b>${stats.registered}</b> · ${percent(stats.registration_conversion)}`,
    `💸 Внесли депозит: <b>${stats.deposited}</b> · ${percent(stats.deposit_conversion)}`,
    `💵 Средний первый депозит: <b>$${formatAmount(stats.avg_deposit)}</b>`, "",
    `♻️ Callback-события: reg ${stats.registration_events} · dep ${stats.deposit_events}`
  ].join("\n");
  return sendText(token, chatId, text);
}

async function sendUser(token, chatId, argument) {
  const userId = normalizeUserId(argument);
  if (!userId) return sendText(token, chatId, "Использование: <code>/user 867371536</code>");
  const profile = await getUserProfile(userId);
  if (!profile) return sendText(token, chatId, `Пользователь <code>${userId}</code> не найден.`);
  const access = await getAccessStatus(userId, minDepositAmount());
  const text = [
    "👤 <b>КАРТОЧКА ПОЛЬЗОВАТЕЛЯ</b>", "",
    `🆔 ID: <code>${userId}</code>`,
    `🔗 Username: ${profile.tg_username ? `@${escapeHtml(profile.tg_username)}` : "—"}`,
    `🌍 GEO: ${profile.geo_country || "не определено"}${profile.geo_city ? ` · ${escapeHtml(profile.geo_city)}` : ""}`,
    `🗣 Язык: ${profile.selected_locale || "—"} · Telegram ${profile.language_code || "—"}`,
    `📣 Источник: ${escapeHtml(profile.first_source || profile.last_source || "не определён")}`, "",
    `${access.registered ? "✅" : "❌"} Регистрация${access.registered_at ? ` · ${formatDate(access.registered_at)}` : ""}`,
    `${access.deposit_ok ? "✅" : "❌"} Депозит: $${formatAmount(access.deposit_amount)}${access.deposit_at ? ` · ${formatDate(access.deposit_at)}` : ""}`,
    `${access.allowed ? "🔓 <b>Доступ открыт</b>" : "🔒 <b>Доступ закрыт</b>"}`,
    `♻️ Callbacks: reg ${profile.registration_event_count || 0} · dep ${profile.deposit_event_count || 0}`
  ].join("\n");
  return sendText(token, chatId, text);
}

async function isAdmin(token, message) {
  const userId = String(message?.from?.id || "");
  const chatId = String(message?.chat?.id || "");
  const ids = String(process.env.ADMIN_TELEGRAM_IDS || process.env.BOT_ADMIN_IDS || "").split(",").map(x => x.trim()).filter(Boolean);
  if (ids.includes(userId)) return true;
  const logChatId = String(process.env.POSTBACK_LOG_CHAT_ID || "");
  if (!logChatId || chatId !== logChatId) return false;
  if (!logChatId.startsWith("-")) return userId === logChatId;
  try {
    const member = await tg(token, "getChatMember", { chat_id: chatId, user_id: userId });
    return ["administrator", "creator"].includes(member?.status);
  } catch { return false; }
}

function sendText(token, chatId, text) {
  return tg(token, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true });
}

function answerCallback(token, callbackId, text, alert = false) {
  return tg(token, "answerCallbackQuery", { callback_query_id: callbackId, ...(text ? { text, show_alert: alert } : {}) }).catch(() => {});
}

async function tg(token, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(`telegram_${method}_failed_${response.status}`);
  return data.result;
}

function percent(value) { return `${(Number(value || 0) * 100).toFixed(1).replace(".0", "")}%`; }
function formatAmount(value) { return Number(value || 0).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1"); }
function formatDate(value) {
  try { return new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) + " МСК"; }
  catch { return "—"; }
}
function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function webhookSecret(token) { return crypto.createHash("sha256").update(`ai-signal-webhook:${token}`).digest("hex"); }
function safeEqual(a, b) { const left = Buffer.from(String(a)); const right = Buffer.from(String(b)); return left.length === right.length && crypto.timingSafeEqual(left, right); }
