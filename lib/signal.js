export const SIGNALS = new Set(["UP", "DOWN", "NO_SIGNAL"]);
export const QUALITIES = new Set(["good", "medium", "poor"]);
export const READABILITIES = new Set(["high", "medium", "low"]);
export const CHART_TYPES = new Set(["candlestick", "line", "other", "none"]);
export const DIRECTION_BIASES = new Set(["UP", "DOWN", "NONE"]);

export function normalizeSignal(raw) {
  const confidence = clampInt(raw?.confidence, 0, 100, 0);
  const quality = QUALITIES.has(raw?.chart_quality) ? raw.chart_quality : "poor";
  const readability = READABILITIES.has(raw?.screenshot_readability) ? raw.screenshot_readability : "low";
  const chartType = CHART_TYPES.has(raw?.chart_type) ? raw.chart_type : "none";
  const hasCandles = Boolean(raw?.has_candles);
  const timeframeReadable = Boolean(raw?.timeframe_readable);
  const invalidChart = Boolean(raw?.invalid_chart);
  const directionBias = DIRECTION_BIASES.has(raw?.direction_bias) ? raw.direction_bias : "NONE";
  let signal = SIGNALS.has(raw?.signal) ? raw.signal : "NO_SIGNAL";
  const validVisualChart = !invalidChart && hasCandles && chartType === "candlestick" && readability !== "low" && quality !== "poor";
  const qualityOk = validVisualChart;

  // Reserve NO_SIGNAL for invalid visual input. A valid candle chart should keep
  // the closest model direction and communicate uncertainty through confidence.
  if (!validVisualChart) {
    signal = "NO_SIGNAL";
  } else if (signal === "NO_SIGNAL" && directionBias !== "NONE") {
    signal = directionBias;
  }

  return {
    signal,
    direction_bias: directionBias,
    confidence,
    chart_quality: quality,
    screenshot_readability: readability,
    chart_type: chartType,
    has_candles: hasCandles,
    timeframe_readable: timeframeReadable,
    quality_ok: qualityOk,
    quality_reason: cleanText(raw?.quality_reason, 240) || "—",
    trend: cleanText(raw?.trend, 120) || "—",
    reason: cleanText(raw?.reason, 520) || "—",
    invalid_chart: invalidChart
  };
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function cleanText(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLen);
}
