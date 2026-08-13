import { validateTelegramInitData } from "../lib/telegram-auth.js";
import { normalizeSignal } from "../lib/signal.js";

const ALLOWED_TIMEFRAMES = new Set(["M1", "M5", "M15", "M30", "H1"]);
const ALLOWED_EXPIRATIONS = new Set(["1", "3", "5", "10", "15"]);
const MAX_DATA_URL_LENGTH = 3_200_000;

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
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const requireTelegramAuth = String(process.env.REQUIRE_TELEGRAM_AUTH ?? "true").toLowerCase() !== "false";
    const botToken = process.env.BOT_TOKEN;

    if (requireTelegramAuth) {
      const maxAge = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || 86400);
      const auth = validateTelegramInitData(req.body?.tgInitData, botToken, maxAge);
      if (!auth.ok) {
        return res.status(401).json({
          error: "telegram_auth_failed",
          reason: auth.reason
        });
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "missing_openai_api_key" });

    const image = req.body?.image;
    const timeframe = String(req.body?.timeframe || "M5").toUpperCase();
    const expiration = String(req.body?.expiration || "3");
    const locale = normalizeLocale(req.body?.locale);
    const language = LANGUAGES[locale];

    if (!ALLOWED_TIMEFRAMES.has(timeframe)) {
      return res.status(400).json({ error: "invalid_timeframe" });
    }
    if (!ALLOWED_EXPIRATIONS.has(expiration)) {
      return res.status(400).json({ error: "invalid_expiration" });
    }
    if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) {
      return res.status(400).json({ error: "invalid_image" });
    }
    if (image.length > MAX_DATA_URL_LENGTH) {
      return res.status(413).json({ error: "image_too_large" });
    }

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
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: image, detail: "auto" }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "trading_signal",
            strict: true,
            schema
          }
        },
        max_output_tokens: 500
      })
    });

    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      console.error("OpenAI error", openaiRes.status, JSON.stringify(data).slice(0, 1600));
      return res.status(502).json({ error: "openai_error" });
    }

    const outputText = getOutputText(data);
    if (!outputText) {
      return res.status(502).json({ error: "empty_model_output" });
    }

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      console.error("Invalid model JSON", outputText.slice(0, 1000));
      return res.status(502).json({ error: "invalid_model_output" });
    }

    const result = normalizeSignal(parsed, minConfidence);
    if (result.invalid_chart) result.signal = "NO_SIGNAL";

    // Avoid Russian fallback strings from normalizeSignal if the model ever returns an empty string.
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "internal_error" });
  }
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
