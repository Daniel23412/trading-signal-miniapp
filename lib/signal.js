export const SIGNALS = new Set(["UP", "DOWN", "NO_SIGNAL"]);
export const QUALITIES = new Set(["good", "medium", "poor"]);
export const READABILITIES = new Set(["high", "medium", "low"]);
export const CHART_TYPES = new Set(["candlestick", "line", "other", "none"]);

export function normalizeSignal(raw, minConfidence = 72) {
  const confidence = clampInt(raw?.confidence, 0, 100, 0);
  const quality = QUALITIES.has(raw?.chart_quality) ? raw.chart_quality : "poor";
  const readability = READABILITIES.has(raw?.screenshot_readability) ? raw.screenshot_readability : "low";
  const chartType = CHART_TYPES.has(raw?.chart_type) ? raw.chart_type : "none";
  const hasCandles = Boolean(raw?.has_candles);
  const timeframeReadable = Boolean(raw?.timeframe_readable);
  const qualityOk = Boolean(raw?.quality_ok) && !Boolean(raw?.invalid_chart);
  let signal = SIGNALS.has(raw?.signal) ? raw.signal : "NO_SIGNAL";

  // Safety/quality gate: never force a direction on a weak or unreadable chart.
  if (confidence < minConfidence || quality === "poor" || readability === "low" || !qualityOk || !hasCandles || chartType !== "candlestick") {
    signal = "NO_SIGNAL";
  }

  return {
    signal,
    confidence,
    chart_quality: quality,
    screenshot_readability: readability,
    chart_type: chartType,
    has_candles: hasCandles,
    timeframe_readable: timeframeReadable,
    quality_ok: qualityOk,
    quality_reason: cleanText(raw?.quality_reason, 180) || "—",
    trend: cleanText(raw?.trend, 80) || "—",
    reason: cleanText(raw?.reason, 280) || "—",
    invalid_chart: Boolean(raw?.invalid_chart)
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
