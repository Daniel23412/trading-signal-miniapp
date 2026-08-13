export const SIGNALS = new Set(["UP", "DOWN", "NO_SIGNAL"]);
export const QUALITIES = new Set(["good", "medium", "poor"]);

export function normalizeSignal(raw, minConfidence = 72) {
  const confidence = clampInt(raw?.confidence, 0, 100, 0);
  const quality = QUALITIES.has(raw?.chart_quality) ? raw.chart_quality : "poor";
  let signal = SIGNALS.has(raw?.signal) ? raw.signal : "NO_SIGNAL";

  // Safety/quality gate: never force a direction on a weak or unreadable chart.
  if (confidence < minConfidence || quality === "poor") signal = "NO_SIGNAL";

  return {
    signal,
    confidence,
    chart_quality: quality,
    trend: cleanText(raw?.trend, 80) || "Не определён",
    reason: cleanText(raw?.reason, 280) || "Недостаточно данных для уверенного вывода.",
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
