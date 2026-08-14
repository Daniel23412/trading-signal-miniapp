import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSignal } from "./signal.js";

const quality = { screenshot_readability: "high", chart_type: "candlestick", has_candles: true, timeframe_readable: true, quality_ok: true };

test("keeps strong UP", () => {
  const x = normalizeSignal({ ...quality, signal: "UP", confidence: 82, chart_quality: "good", trend: "восходящий", reason: "x", invalid_chart: false }, 72);
  assert.equal(x.signal, "UP");
});

test("forces NO_SIGNAL under threshold", () => {
  const x = normalizeSignal({ ...quality, signal: "DOWN", confidence: 68, chart_quality: "good", trend: "нисходящий", reason: "x", invalid_chart: false }, 72);
  assert.equal(x.signal, "NO_SIGNAL");
});

test("forces NO_SIGNAL on poor chart", () => {
  const x = normalizeSignal({ ...quality, signal: "UP", confidence: 90, chart_quality: "poor", trend: "неясный", reason: "x", invalid_chart: false }, 72);
  assert.equal(x.signal, "NO_SIGNAL");
});

test("forces NO_SIGNAL without readable candlesticks", () => {
  const x = normalizeSignal({ ...quality, signal: "UP", confidence: 91, chart_quality: "good", screenshot_readability: "low", has_candles: false, chart_type: "line", quality_ok: false, reason: "x" }, 72);
  assert.equal(x.signal, "NO_SIGNAL");
  assert.equal(x.has_candles, false);
  assert.equal(x.screenshot_readability, "low");
});
