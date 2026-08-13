import { validateTelegramInitData } from "../lib/telegram-auth.js";
import { normalizeSignal } from "../lib/signal.js";

const ALLOWED_TIMEFRAMES = new Set(["M1", "M5", "M15", "M30", "H1"]);
const ALLOWED_EXPIRATIONS = new Set(["1", "3", "5", "10", "15"]);
const MAX_DATA_URL_LENGTH = 3_200_000;
const DEFAULT_AFFILIATE_URL = "https://lkus.cc/f6f3ab";

const LANGUAGES = {
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

export default async function handler(req, res) {
  try {
    if (req.method === "GET" && req.query?.event) {
      return handlePostback(req, res);
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "method_not_allowed" });
    }

    const action = String(req.body?.action || "analyze");
    if (action === "access_status") return handleAccessStatus(req, res);
    if (action === "referral") return handleReferral(req, res);

    return handleAnalysis(req, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error?.code || "internal_error" });
  }
}

async function handleAccessStatus(req, res) {
  const auth = telegramAuth(req);
  if (!auth.ok) return res.status(401).json({ error: "telegram_auth_failed", reason: auth.reason });

  const minDeposit = minDepositAmount();
  const configured = accessStoreConfigured();
  if (!configured) {
    return res.status(200).json({
      ok: true,
      access: {
        configured: false,
        registered: false,
        deposit_amount: 0,
        deposit_ok: false,
        allowed: false,
        min_deposit: minDeposit
      }
    });
  }

  const access = await getAccessStatus(auth.user.id, minDeposit);
  return res.status(200).json({ ok: true, access });
}

async function handleReferral(req, res) {
  const auth = telegramAuth(req);
  if (!auth.ok) return res.status(401).json({ error: "telegram_auth_failed", reason: auth.reason });

  const base = process.env.AFFILIATE_REF_URL || DEFAULT_AFFILIATE_URL;
  let url;
  try {
    url = new URL(base);
  } catch {
    return res.status(500).json({ error: "invalid_affiliate_url" });
  }
  url.searchParams.set("sub1", String(auth.user.id));

  return res.status(200).json({ ok: true, url: url.toString(), sub1: String(auth.user.id) });
}

async function handlePostback(req, res) {
  const expectedSecret = String(process.env.POSTBACK_SECRET || "");
  const receivedSecret = String(req.query?.secret || "");
  if (!expectedSecret) return res.status(503).send("postback_not_configured");
  if (!safeStringEqual(expectedSecret, receivedSecret)) return res.status(403).send("forbidden");
  if (!accessStoreConfigured()) return res.status(503).send("access_store_not_configured");

  const event = String(req.query?.event || "").toLowerCase();
  const sub1 = normalizeUserId(req.query?.sub1);
  if (!sub1) return res.status(400).send("invalid_sub1");

  const minDeposit = minDepositAmount();
  let access;

  if (["registration", "register", "reg"].includes(event)) {
    await redisCommand([
      "HSET", accessKey(sub1),
      "registered", "1",
      "registered_at", new Date().toISOString(),
      "updated_at", new Date().toISOString()
    ]);
    access = await getAccessStatus(sub1, minDeposit);
    await forwardPostbackLog(`${sub1}|Registration`);
  } else if (["firstdep", "deposit", "first_deposit"].includes(event)) {
    const amount = parseAmount(req.query?.amount);
    if (!(amount > 0)) return res.status(400).send("invalid_amount");
    const enough = amount >= minDeposit;
    const now = new Date().toISOString();
    await redisCommand([
      "HSET", accessKey(sub1),
      "registered", "1",
      "deposit_amount", String(amount),
      "deposit_ok", enough ? "1" : "0",
      "deposit_at", now,
      "updated_at", now
    ]);
    access = await getAccessStatus(sub1, minDeposit);
    await forwardPostbackLog(`${sub1}|Firstdep|${amount}`);
  } else {
    return res.status(400).send("unknown_event");
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(access.allowed ? "ok|access_granted" : "ok|saved");
}

async function handleAnalysis(req, res) {
  const requireTelegramAuth = String(process.env.REQUIRE_TELEGRAM_AUTH ?? "true").toLowerCase() !== "false";
  const accessRequiredEnv = process.env.REQUIRE_DEPOSIT_ACCESS;
  const requireDepositAccess = accessRequiredEnv == null
    ? accessStoreConfigured()
    : String(accessRequiredEnv).toLowerCase() === "true";

  let auth = { ok: false, user: null, reason: "telegram_auth_disabled" };
  if (requireTelegramAuth || requireDepositAccess) {
    auth = telegramAuth(req);
    if (!auth.ok) {
      return res.status(401).json({ error: "telegram_auth_failed", reason: auth.reason });
    }
  }

  if (requireDepositAccess) {
    if (!accessStoreConfigured()) return res.status(503).json({ error: "access_store_not_configured" });
    const access = await getAccessStatus(auth.user.id, minDepositAmount());
    if (!access.allowed) return res.status(403).json({ error: "access_required", access });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "missing_openai_api_key" });

  const image = req.body?.image;
  const timeframe = String(req.body?.timeframe || "M5").toUpperCase();
  const expiration = String(req.body?.expiration || "3");
  const locale = normalizeLocale(req.body?.locale);
  const language = LANGUAGES[locale];

  if (!ALLOWED_TIMEFRAMES.has(timeframe)) return res.status(400).json({ error: "invalid_timeframe" });
  if (!ALLOWED_EXPIRATIONS.has(expiration)) return res.status(400).json({ error: "invalid_expiration" });
  if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) {
    return res.status(400).json({ error: "invalid_image" });
  }
  if (image.length > MAX_DATA_URL_LENGTH) return res.status(413).json({ error: "image_too_large" });

  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const minConfidence = clamp(Number(process.env.MIN_CONFIDENCE || 72), 50, 95);

  const schema = {
    type: "object",
    properties: {
      signal: { type: "string", enum: ["UP", "DOWN", "NO_SIGNAL"] },
      confidence: { type: "integer", minimum: 0, maximum: 100 },
      chart_quality: { type: "string", enum: ["good", "medium", "poor"] },
      trend: { type: "string" },
      reason: { type: "string" },
      invalid_chart: { type: "boolean" }
    },
    required: ["signal", "confidence", "chart_quality", "trend", "reason", "invalid_chart"],
    additionalProperties: false
  };

  const prompt = `Analyze ONLY what is actually visible in the attached trading-chart screenshot.

User parameters:
- timeframe: ${timeframe}
- intended trade duration: ${expiration} minutes
- selected interface language: ${language.native} (${language.name})

Task:
Give a short visual assessment of the nearest price direction using only visible evidence such as price structure, highs/lows, candles, local levels, and indicators if they are genuinely visible.

Rules:
- Never invent the asset, price, indicators, levels, or market context that are not visible.
- If the screenshot is not a trading chart, is unreadable, critically cropped, or contains too little information, use signal=NO_SIGNAL and invalid_chart=true.
- If the setup is ambiguous, use signal=NO_SIGNAL.
- confidence is internal analysis confidence, NOT a win probability and NOT a guarantee.
- UP/DOWN requires a clearly expressed visual direction.
- trend MUST be a short, natural phrase written ONLY in ${language.native}.
- reason MUST contain no more than 2 short sentences written ONLY in ${language.native}.
- Do NOT use Russian in trend or reason unless the selected language is Russian.
- Do NOT mix languages in trend or reason.
- No promises of profit and no guarantees.
- signal, chart_quality and JSON property names remain technical English values exactly as required by the schema.`;

  const openaiRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: "none" },
      instructions: `You are a visual trading-chart analyzer. Return only data matching the JSON schema. Human-readable fields trend and reason must be written exclusively in ${language.native} (${language.name}).`,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: image, detail: "auto" }
        ]
      }],
      text: { format: { type: "json_schema", name: "trading_signal", strict: true, schema } },
      max_output_tokens: 500
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
  if (result.invalid_chart) result.signal = "NO_SIGNAL";
  if (typeof parsed?.trend !== "string" || !parsed.trend.trim()) result.trend = "—";
  if (typeof parsed?.reason !== "string" || !parsed.reason.trim()) result.reason = "—";

  return res.status(200).json({
    ok: true,
    result,
    meta: {
      timeframe,
      expiration_minutes: Number(expiration),
      locale,
      language: language.name,
      model,
      min_confidence: minConfidence,
      disclaimer: "AI chart analysis does not guarantee the outcome of a trade."
    }
  });
}

function telegramAuth(req) {
  const botToken = process.env.BOT_TOKEN;
  const maxAge = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || 86400);
  const auth = validateTelegramInitData(req.body?.tgInitData, botToken, maxAge);
  if (!auth.ok) return auth;
  const id = normalizeUserId(auth.user?.id);
  if (!id) return { ok: false, reason: "missing_user_id" };
  return { ok: true, user: { ...auth.user, id } };
}

function accessStoreConfigured() {
  return Boolean(storeUrl() && storeToken());
}

function storeUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
}

function storeToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
}

function accessKey(userId) {
  return `ai-signal:access:${String(userId)}`;
}

async function getAccessStatus(userId, minDeposit) {
  const result = await redisCommand([
    "HMGET", accessKey(userId),
    "registered", "registered_at", "deposit_amount", "deposit_ok", "deposit_at"
  ]);
  const values = Array.isArray(result) ? result : [];
  const registered = String(values[0] || "") === "1";
  const depositAmount = parseAmount(values[2]);
  const depositOk = String(values[3] || "") === "1" || depositAmount >= minDeposit;
  return {
    configured: true,
    registered,
    registered_at: values[1] || null,
    deposit_amount: depositAmount,
    deposit_ok: depositOk,
    deposit_at: values[4] || null,
    min_deposit: minDeposit,
    allowed: registered && depositOk
  };
}

async function redisCommand(command) {
  const response = await fetch(storeUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${storeToken()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  let data = null;
  try { data = await response.json(); } catch {}
  if (!response.ok || data?.error) {
    console.error("Access store error", response.status, data?.error || "invalid_response");
    const error = new Error("access_store_error");
    error.code = "access_store_error";
    throw error;
  }
  return data?.result;
}

async function forwardPostbackLog(text) {
  const chatId = process.env.POSTBACK_LOG_CHAT_ID;
  const botToken = process.env.BOT_TOKEN;
  if (!chatId || !botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (error) {
    console.warn("Postback log delivery failed", error?.message || error);
  }
}

function minDepositAmount() {
  return clamp(Number(process.env.MIN_DEPOSIT_AMOUNT || 5), 1, 10000);
}

function normalizeUserId(value) {
  const raw = String(value ?? "").trim();
  return /^\d{4,20}$/.test(raw) ? raw : "";
}

function parseAmount(value) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : 0;
  const raw = String(value ?? "").trim().replace(/\s+/g, "").replace(",", ".");
  const match = raw.match(/\d+(?:\.\d+)?/);
  const amount = match ? Number(match[0]) : 0;
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function safeStringEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function normalizeLocale(value) {
  const raw = String(value || "ru").toLowerCase().replace("_", "-").split("-")[0];
  if (LANGUAGES[raw]) return raw;
  if (raw === "ua") return "uk";
  if (raw === "cn") return "zh";
  return "ru";
}

function getOutputText(response) {
  if (typeof response?.output_text === "string") return response.output_text;
  for (const item of response?.output || []) {
    if (item?.type !== "message") continue;
    for (const part of item?.content || []) {
      if (part?.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  return "";
}

function clamp(n, min, max) {
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}
