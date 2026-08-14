import crypto from "node:crypto";
import { validateTelegramInitData } from "../lib/telegram-auth.js";
import { normalizeSignal } from "../lib/signal.js";
import { LANGUAGE_META, normalizeLocale, suggestedLocaleForCountry } from "../lib/locales.js";
import {
  applyDeposit, applyRegistration, databaseConfigured, extractRequestGeo, getAccessStatus,
  getSavedLocale, getUserProfile, minDepositAmount, normalizeUserId, parseAmount,
  saveSelectedLocale, syncUserContext, trackReferralOpen
} from "../lib/database.js";

const ALLOWED_TIMEFRAMES = new Set(["M1", "M5", "M15", "M30", "H1"]);
const ALLOWED_EXPIRATIONS = new Set(["1", "3", "5", "10", "15"]);
const MAX_DATA_URL_LENGTH = 3_200_000;
const DEFAULT_AFFILIATE_URL = "https://lkus.cc/f6f3ab";

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");
    const postbackInput = readPostbackInput(req);
    if (["GET", "POST"].includes(req.method) && postbackInput.event) return await handlePostback(req, res, postbackInput);
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "method_not_allowed" });
    }
    const action = String(req.body?.action || "analyze");
    if (action === "access_status") return await handleAccessStatus(req, res);
    if (action === "referral") return await handleReferral(req, res);
    if (action === "set_locale") return await handleSetLocale(req, res);
    return await handleAnalysis(req, res);
  } catch (error) {
    console.error("API error", error?.message || error);
    return res.status(500).json({ error: error?.code || "internal_error" });
  }
}

async function handleAccessStatus(req, res) {
  const auth = telegramAuth(req);
  if (!auth.ok) return res.status(401).json({ error: "telegram_auth_failed", reason: auth.reason });
  const minDeposit = minDepositAmount();
  const geo = extractRequestGeo(req);
  const requestedLocale = normalizeLocale(req.body?.locale, null);
  const requestedLocaleSource = String(req.body?.locale_source || "fallback");
  const intentionalLocale = ["explicit", "stored"].includes(requestedLocaleSource);
  const suggestedLocale = suggestedLocaleForCountry(geo.country);
  if (!databaseConfigured()) {
    const locale = (intentionalLocale && requestedLocale) || suggestedLocale || requestedLocale || normalizeLocale(auth.user.language_code, "en");
    return res.status(200).json({
      ok: true, access: await getAccessStatus(auth.user.id, minDeposit),
      locale,
      locale_source: intentionalLocale && requestedLocale ? "request" : (suggestedLocale ? "geo" : (requestedLocale ? "fallback" : "telegram")),
      geo: publicGeo(geo)
    });
  }
  await syncUserContext(auth.user.id, req, auth.user, requestContext(req));
  const savedLocale = await getSavedLocale(auth.user.id);
  const locale = savedLocale || (intentionalLocale && requestedLocale) || suggestedLocale || requestedLocale || normalizeLocale(auth.user.language_code, "en");
  if (!savedLocale && !intentionalLocale && suggestedLocale) {
    await saveSelectedLocale(auth.user, suggestedLocale, requestSource(req));
  }
  return res.status(200).json({
    ok: true, access: await getAccessStatus(auth.user.id, minDeposit), locale,
    locale_source: savedLocale ? "saved" : (intentionalLocale && requestedLocale ? "request" : (suggestedLocale ? "geo" : (requestedLocale ? "fallback" : "telegram"))),
    geo: publicGeo(geo)
  });
}

async function handleSetLocale(req, res) {
  const auth = telegramAuth(req);
  if (!auth.ok) return res.status(401).json({ error: "telegram_auth_failed", reason: auth.reason });
  if (!databaseConfigured()) return res.status(503).json({ error: "database_not_configured" });
  const locale = normalizeLocale(req.body?.locale, null);
  if (!locale) return res.status(400).json({ error: "invalid_locale" });
  await syncUserContext(auth.user.id, req, auth.user, { locale, localeSource: "explicit", source: requestSource(req) });
  await saveSelectedLocale(auth.user, locale, requestSource(req));
  return res.status(200).json({ ok: true, locale });
}

async function handleReferral(req, res) {
  const auth = telegramAuth(req);
  if (!auth.ok) return res.status(401).json({ error: "telegram_auth_failed", reason: auth.reason });
  const geo = extractRequestGeo(req);
  if (!geoEligible(geo.country)) return res.status(451).json({ error: "geo_not_supported", geo: publicGeo(geo) });
  if (databaseConfigured()) {
    await syncUserContext(auth.user.id, req, auth.user, requestContext(req));
    await trackReferralOpen(auth.user.id, requestSource(req));
  }
  let url;
  try { url = new URL(affiliateUrlForCountry(geo.country)); }
  catch { return res.status(500).json({ error: "invalid_affiliate_url" }); }
  url.searchParams.set("sub1", String(auth.user.id));
  return res.status(200).json({ ok: true, url: url.toString(), sub1: String(auth.user.id), geo: publicGeo(geo) });
}

async function handlePostback(req, res, input) {
  const expectedSecret = String(process.env.POSTBACK_SECRET || "");
  const receivedSecret = String(input.secret || req.headers?.["x-postback-secret"] || "");
  if (!expectedSecret) return res.status(503).send("postback_not_configured");
  if (!safeStringEqual(expectedSecret, receivedSecret)) return res.status(403).send("forbidden");
  if (!databaseConfigured()) return res.status(503).send("database_not_configured");

  const event = String(input.event || "").trim().toLowerCase();
  const userId = normalizeUserId(input.sub1 || input.click_id || input.clickid || input.telegram_id);
  if (!userId) return res.status(400).send("invalid_sub1");
  const minDeposit = minDepositAmount();
  let eventResult;
  let amount = 0;
  let type;
  if (["registration", "register", "reg"].includes(event)) {
    type = "registration";
    eventResult = await applyRegistration(userId);
  } else if (["firstdep", "deposit", "first_deposit"].includes(event)) {
    type = "firstdep";
    amount = parseAmount(input.amount);
    if (!(amount > 0)) return res.status(400).send("invalid_amount");
    eventResult = await applyDeposit(userId, amount, minDeposit);
  } else return res.status(400).send("unknown_event");

  const profile = await getUserProfile(userId);
  const access = eventResult.access || await getAccessStatus(userId, minDeposit);
  await forwardPostbackLog(buildPostbackMessage({ type, userId, amount, profile, access, minDeposit, duplicate: eventResult.duplicate }));
  console.info("Postback accepted", { event: type, duplicate: eventResult.duplicate, country: profile?.geo_country || null });
  return res.status(200).send(access.allowed ? "ok|access_granted" : "ok|saved");
}

async function handleAnalysis(req, res) {
  const requireTelegramAuth = String(process.env.REQUIRE_TELEGRAM_AUTH ?? "true").toLowerCase() !== "false";
  const requireDepositAccess = String(process.env.REQUIRE_DEPOSIT_ACCESS ?? "false").toLowerCase() === "true";
  let auth = { ok: false, user: null, reason: "telegram_auth_disabled" };
  if (requireTelegramAuth || requireDepositAccess) {
    auth = telegramAuth(req);
    if (!auth.ok) return res.status(401).json({ error: "telegram_auth_failed", reason: auth.reason });
  }
  if (auth.ok && databaseConfigured()) await syncUserContext(auth.user.id, req, auth.user, requestContext(req));
  if (requireDepositAccess) {
    if (!databaseConfigured()) return res.status(503).json({ error: "database_not_configured" });
    const access = await getAccessStatus(auth.user.id, minDepositAmount());
    if (!access.allowed) return res.status(403).json({ error: "access_required", access });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "missing_openai_api_key" });
  const image = req.body?.image;
  const timeframe = String(req.body?.timeframe || "M5").toUpperCase();
  const expiration = String(req.body?.expiration || "3");
  const locale = normalizeLocale(req.body?.locale, "ru");
  const language = LANGUAGE_META[locale];
  if (!ALLOWED_TIMEFRAMES.has(timeframe)) return res.status(400).json({ error: "invalid_timeframe" });
  if (!ALLOWED_EXPIRATIONS.has(expiration)) return res.status(400).json({ error: "invalid_expiration" });
  if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) return res.status(400).json({ error: "invalid_image" });
  if (image.length > MAX_DATA_URL_LENGTH) return res.status(413).json({ error: "image_too_large" });

  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const minConfidence = clamp(Number(process.env.MIN_CONFIDENCE || 72), 50, 95);
  const schema = {
    type: "object",
    properties: {
      has_candles: { type: "boolean" }, timeframe_readable: { type: "boolean" },
      screenshot_readability: { type: "string", enum: ["high", "medium", "low"] },
      chart_type: { type: "string", enum: ["candlestick", "line", "other", "none"] },
      quality_ok: { type: "boolean" }, quality_reason: { type: "string" },
      signal: { type: "string", enum: ["UP", "DOWN", "NO_SIGNAL"] },
      confidence: { type: "integer", minimum: 0, maximum: 100 },
      chart_quality: { type: "string", enum: ["good", "medium", "poor"] },
      trend: { type: "string" }, reason: { type: "string" }, invalid_chart: { type: "boolean" }
    },
    required: ["has_candles", "timeframe_readable", "screenshot_readability", "chart_type", "quality_ok", "quality_reason", "signal", "confidence", "chart_quality", "trend", "reason", "invalid_chart"],
    additionalProperties: false
  };

  const prompt = `Analyze ONLY what is actually visible in the attached image.\n\nUser parameters:\n- selected timeframe: ${timeframe}\n- intended trade duration: ${expiration} minutes\n- response language: ${language.native} (${language.name})\n\nPerform two stages in order.\n\nSTAGE A — visual quality gate:\n1. Decide whether this is a readable trading chart.\n2. Confirm whether actual candlesticks are visible (not merely a line chart, logo, form, balance page, or decorative graph).\n3. Decide whether the timeframe label is readable. The user's selected timeframe is context only; never claim it is visible unless it truly is.\n4. Set screenshot_readability, chart_type, chart_quality, quality_ok, quality_reason, and invalid_chart.\n5. quality_ok must be false for unreadable, critically cropped, non-chart, or candle-free images.\n\nSTAGE B — direction, only if Stage A passes:\nAssess the nearest visual direction from visible candles, price structure, highs/lows, local levels, and genuinely visible indicators. If quality_ok=false or the setup is ambiguous, signal must be NO_SIGNAL.\n\nRules:\n- Never invent the asset, price, indicator, level, timeframe, or market context.\n- confidence is analysis confidence, not win probability and not a guarantee.\n- UP/DOWN requires a clearly expressed visual direction.\n- trend, reason, and quality_reason must be short, natural, and written ONLY in ${language.native}.\n- reason must contain no more than 2 short sentences.\n- Do not mix human languages. Technical enum values remain English.\n- No promise of profit and no guarantee.`;

  const openaiRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, store: false, reasoning: { effort: "none" },
      instructions: `You are a conservative visual chart analyzer. First apply the visual quality gate, then analyze direction only if it passes. Return only schema-compliant JSON. Human-readable fields must be exclusively in ${language.native} (${language.name}).`,
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }, { type: "input_image", image_url: image, detail: "auto" }] }],
      text: { format: { type: "json_schema", name: "trading_signal", strict: true, schema } }, max_output_tokens: 650
    })
  });
  const data = await openaiRes.json();
  if (!openaiRes.ok) {
    console.error("OpenAI error", openaiRes.status, JSON.stringify(data).slice(0, 1600));
    return res.status(502).json({ error: "openai_error" });
  }
  const outputText = getOutputText(data);
  if (!outputText) return res.status(502).json({ error: "empty_model_output" });
  let parsed;
  try { parsed = JSON.parse(outputText); }
  catch {
    console.error("Invalid model JSON", outputText.slice(0, 1000));
    return res.status(502).json({ error: "invalid_model_output" });
  }
  const result = normalizeSignal(parsed, minConfidence);
  return res.status(200).json({
    ok: true, result,
    meta: { timeframe, expiration_minutes: Number(expiration), locale, language: language.name, model,
      min_confidence: minConfidence, quality_gate: "v2",
      disclaimer: "AI chart analysis does not guarantee the outcome of a trade." }
  });
}

function requestContext(req) {
  return { locale: req.body?.locale, localeSource: req.body?.locale_source, source: requestSource(req) };
}

function requestSource(req) {
  return String(req.body?.source || req.query?.source || req.query?.src || "miniapp");
}

function readPostbackInput(req) {
  const query = req.query && typeof req.query === "object" ? req.query : {};
  let body = req.body;
  if (typeof body === "string") {
    try { body = Object.fromEntries(new URLSearchParams(body).entries()); } catch { body = {}; }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) body = {};
  return { ...body, ...query };
}

function telegramAuth(req) {
  const maxAge = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || process.env.TELEGRAM_AUTH_X_AGE_SECONDS || 86400);
  const auth = validateTelegramInitData(req.body?.tgInitData, process.env.BOT_TOKEN, maxAge);
  if (!auth.ok) return auth;
  const id = normalizeUserId(auth.user?.id);
  if (!id) return { ok: false, reason: "missing_user_id" };
  return { ok: true, user: { ...auth.user, id } };
}

function affiliateUrlForCountry(country) {
  let mapping = {};
  try { mapping = JSON.parse(process.env.AFFILIATE_REF_URLS || "{}"); } catch { mapping = {}; }
  return mapping[String(country || "").toUpperCase()] || mapping.default || process.env.AFFILIATE_REF_URL || DEFAULT_AFFILIATE_URL;
}

function geoEligible(country) {
  const configured = String(process.env.ALLOWED_GEO_COUNTRIES || "").split(",").map(x => x.trim().toUpperCase()).filter(Boolean);
  return !configured.length || !country || configured.includes(country);
}

function publicGeo(geo) {
  return { country: geo.country || null, status: geo.country ? "detected" : "unknown", eligible: geoEligible(geo.country) };
}

async function forwardPostbackLog(text) {
  const chatId = process.env.POSTBACK_LOG_CHAT_ID;
  const botToken = process.env.BOT_TOKEN;
  if (!chatId || !botToken) return;
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true })
    });
    if (!response.ok) console.warn("Postback log delivery failed", response.status);
  } catch (error) { console.warn("Postback log delivery failed", error?.message || error); }
}

function buildPostbackMessage({ type, userId, amount = 0, profile, access, minDeposit, duplicate }) {
  const geo = formatGeo(profile);
  const username = profile?.tg_username ? `@${escapeHtml(profile.tg_username)}` : "—";
  const firstName = profile?.tg_first_name ? escapeHtml(profile.tg_first_name) : "—";
  const telegramLanguage = profile?.language_code ? escapeHtml(profile.language_code) : "—";
  const selectedLocale = profile?.selected_locale ? escapeHtml(profile.selected_locale) : "—";
  const source = profile?.first_source || profile?.last_source;
  const common = [
    `👤 <b>Пользователь:</b> ${firstName}`, `🆔 <b>Telegram ID:</b> <code>${escapeHtml(userId)}</code>`,
    `🔗 <b>Username:</b> ${username}`, `🌍 <b>GEO:</b> ${geo.countryLine}`,
    ...(geo.cityLine ? [`🏙 <b>Город:</b> ${geo.cityLine}`] : []),
    `🗣 <b>Язык:</b> ${selectedLocale} · Telegram ${telegramLanguage}`,
    `📣 <b>Источник:</b> ${source ? escapeHtml(source) : "не определён"}`,
    `♻️ <b>Повторный callback:</b> ${duplicate ? "да" : "нет"}`
  ];
  if (type === "registration") return [
    "🟢 <b>РЕГИСТРАЦИЯ</b>", "", ...common, "✅ <b>Регистрация:</b> подтверждена",
    `💰 <b>Депозит:</b> ${access?.deposit_ok ? `$${formatAmount(access.deposit_amount)}` : "ожидается"}`,
    access?.allowed ? "🔓 <b>Доступ открыт</b>" : "🔒 <b>Доступ пока закрыт</b>",
    `🕒 <b>Время:</b> ${formatMoscowTime(new Date())}`
  ].join("\n");
  return [
    "💸 <b>ПЕРВЫЙ ДЕПОЗИТ</b>", "", ...common, `💵 <b>Сумма:</b> $${formatAmount(amount)}`,
    `${Number(amount) >= Number(minDeposit) ? "✅" : "⚠️"} <b>Минимум $${formatAmount(minDeposit)}:</b> ${Number(amount) >= Number(minDeposit) ? "выполнен" : "не выполнен"}`,
    `⏱ <b>От регистрации:</b> ${formatDuration(profile?.registered_at, profile?.deposit_at)}`,
    access?.allowed ? "🔓 <b>Доступ открыт</b>" : "🔒 <b>Доступ закрыт</b>",
    `🕒 <b>Время:</b> ${formatMoscowTime(new Date())}`
  ].join("\n");
}

function formatGeo(profile) {
  const code = String(profile?.geo_country || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return { countryLine: "не определено", cityLine: "" };
  let name = code;
  try { name = new Intl.DisplayNames(["ru"], { type: "region" }).of(code) || code; } catch {}
  const flag = [...code].map(char => String.fromCodePoint(127397 + char.charCodeAt(0))).join("");
  const city = cleanText(profile?.geo_city);
  const region = cleanText(profile?.geo_region);
  return { countryLine: `${flag} ${escapeHtml(name)} (${escapeHtml(code)})`, cityLine: city ? `${escapeHtml(city)}${region ? ` · ${escapeHtml(region)}` : ""}` : "" };
}

function formatDuration(start, end) {
  if (!start || !end) return "не определено";
  const seconds = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  if (!Number.isFinite(seconds)) return "не определено";
  if (seconds < 60) return `${seconds} сек`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} мин`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(seconds < 36000 ? 1 : 0)} ч`;
  return `${(seconds / 86400).toFixed(1)} дн`;
}

function formatMoscowTime(date) {
  try { return new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date) + " МСК"; }
  catch { return date.toISOString(); }
}

function formatAmount(amount) { return Number(amount).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1"); }
function cleanText(value) { if (value == null) return null; const text = String(value).trim().slice(0, 160); return text || null; }
function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function safeStringEqual(a, b) { const left = Buffer.from(String(a)); const right = Buffer.from(String(b)); return left.length === right.length && crypto.timingSafeEqual(left, right); }
function getOutputText(response) {
  if (typeof response?.output_text === "string") return response.output_text;
  for (const item of response?.output || []) {
    if (item?.type !== "message") continue;
    for (const part of item?.content || []) if (part?.type === "output_text" && typeof part.text === "string") return part.text;
  }
  return "";
}
function clamp(number, min, max) { return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min; }
