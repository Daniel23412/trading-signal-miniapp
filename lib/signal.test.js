import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSignal } from "./signal.js";

const quality = { screenshot_readability: "high", chart_type: "candlestick", has_candles: true, timeframe_readable: true, quality_ok: true };

test("keeps strong UP", () => {
  const x = normalizeSignal({ ...quality, signal: "UP", direction_bias: "UP", confidence: 82, chart_quality: "good", trend: "восходящий", reason: "x", invalid_chart: false });
  assert.equal(x.signal, "UP");
});

test("keeps a cautious direction on a readable chart", () => {
  const x = normalizeSignal({ ...quality, signal: "DOWN", direction_bias: "DOWN", confidence: 50, chart_quality: "medium", screenshot_readability: "medium", trend: "нисходящий", reason: "x", invalid_chart: false });
  assert.equal(x.signal, "DOWN");
  assert.equal(x.confidence, 50);
});

test("uses closest direction when model marks a valid chart as NO_SIGNAL", () => {
  const x = normalizeSignal({ ...quality, quality_ok: false, signal: "NO_SIGNAL", direction_bias: "UP", confidence: 54, chart_quality: "medium", screenshot_readability: "medium", trend: "слабый рост", reason: "x", invalid_chart: false });
  assert.equal(x.signal, "UP");
  assert.equal(x.direction_bias, "UP");
  assert.equal(x.quality_ok, true);
});

test("forces NO_SIGNAL on poor chart", () => {
  const x = normalizeSignal({ ...quality, signal: "UP", direction_bias: "UP", confidence: 90, chart_quality: "poor", trend: "неясный", reason: "x", invalid_chart: false });
  assert.equal(x.signal, "NO_SIGNAL");
});

test("forces NO_SIGNAL without readable candlesticks", () => {
  const x = normalizeSignal({ ...quality, signal: "UP", direction_bias: "UP", confidence: 91, chart_quality: "good", screenshot_readability: "low", has_candles: false, chart_type: "line", quality_ok: false, reason: "x" });
  assert.equal(x.signal, "NO_SIGNAL");
  assert.equal(x.has_candles, false);
  assert.equal(x.screenshot_readability, "low");
});
