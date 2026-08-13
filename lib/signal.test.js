import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSignal } from "./signal.js";

test("keeps strong UP", () => {
  const x = normalizeSignal({ signal: "UP", confidence: 82, chart_quality: "good", trend: "восходящий", reason: "x", invalid_chart: false }, 72);
  assert.equal(x.signal, "UP");
});

test("forces NO_SIGNAL under threshold", () => {
  const x = normalizeSignal({ signal: "DOWN", confidence: 68, chart_quality: "good", trend: "нисходящий", reason: "x", invalid_chart: false }, 72);
  assert.equal(x.signal, "NO_SIGNAL");
});

test("forces NO_SIGNAL on poor chart", () => {
  const x = normalizeSignal({ signal: "UP", confidence: 90, chart_quality: "poor", trend: "неясный", reason: "x", invalid_chart: false }, 72);
  assert.equal(x.signal, "NO_SIGNAL");
});
