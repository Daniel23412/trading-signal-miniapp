import { validateTelegramInitData } from "../lib/telegram-auth.js";
import { normalizeSignal } from "../lib/signal.js";

const ALLOWED_TIMEFRAMES = new Set(["M1", "M5", "M15", "M30", "H1"]);
const ALLOWED_EXPIRATIONS = new Set(["1", "3", "5", "10", "15"]);
const MAX_DATA_URL_LENGTH = 3_200_000;

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
          reason: auth.reason,
          message: "Откройте приложение внутри Telegram и попробуйте ещё раз."
        });
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "missing_openai_api_key" });

    const image = req.body?.image;
    const timeframe = String(req.body?.timeframe || "M5").toUpperCase();
    const expiration = String(req.body?.expiration || "3");

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
      return res.status(413).json({ error: "image_too_large", message: "Изображение слишком большое." });
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

    const prompt = `Проанализируй только то, что реально видно на приложенном скриншоте торгового графика.
Параметры пользователя: таймфрейм ${timeframe}, предполагаемая длительность сделки ${expiration} мин.

Твоя задача — дать краткую оценку направления ближайшего движения только по визуальным данным: структуре цены, последовательности максимумов/минимумов, свечам, локальным уровням и индикаторам, если они действительно видны.

Правила:
- Не выдумывай цену, актив, индикаторы или уровни, которых не видно.
- Если скриншот не является торговым графиком, нечитаемый, обрезан критически или данных мало — signal=NO_SIGNAL, invalid_chart=true.
- Если сетап неоднозначный — signal=NO_SIGNAL.
- confidence — это внутренняя уверенность анализа, НЕ вероятность выигрыша и НЕ гарантия.
- Для UP/DOWN используй высокий порог: направление должно быть визуально выраженным.
- reason: максимум 2 коротких предложения на русском языке.
- trend: коротко: «восходящий», «нисходящий», «боковой» или «неясный».
- Никаких обещаний прибыли и никаких гарантий.`;

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
        instructions: "Ты анализатор изображения торгового графика. Возвращай только данные по заданной JSON-схеме.",
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
      return res.status(502).json({
        error: "openai_error",
        message: data?.error?.message || "Не удалось выполнить анализ."
      });
    }

    const outputText = getOutputText(data);
    if (!outputText) {
      return res.status(502).json({ error: "empty_model_output", message: "Модель не вернула результат." });
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

    return res.status(200).json({
      ok: true,
      result,
      meta: {
        timeframe,
        expiration_minutes: Number(expiration),
        model,
        min_confidence: minConfidence,
        disclaimer: "AI-анализ графика не гарантирует исход сделки."
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "internal_error", message: "Внутренняя ошибка сервера." });
  }
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
