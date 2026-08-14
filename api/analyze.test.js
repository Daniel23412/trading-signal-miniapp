import test from "node:test";
import assert from "node:assert/strict";
import handler from "./analyze.js";

function makeRes() {
  return {
    code: 200,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(n) { this.code = n; return this; },
    json(x) { this.body = x; return this; }
  };
}

test("analyze returns normalized signal with mocked OpenAI", async () => {
  const oldFetch = global.fetch;
  const oldEnv = { ...process.env };
  process.env.REQUIRE_TELEGRAM_AUTH = "false";
  process.env.OPENAI_API_KEY = "test-key";
  process.env.MIN_CONFIDENCE = "72";

  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        output: [{
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify({
            has_candles: true,
            timeframe_readable: true,
            screenshot_readability: "high",
            chart_type: "candlestick",
            quality_ok: true,
            quality_reason: "График читаемый.",
            signal: "UP",
            confidence: 84,
            chart_quality: "good",
            trend: "восходящий",
            reason: "Повышаются локальные максимумы и минимумы.",
            invalid_chart: false
          }) }]
        }]
      };
    }
  });

  const req = {
    method: "POST",
    body: {
      image: "data:image/jpeg;base64,AA==",
      timeframe: "M5",
      expiration: "3",
      tgInitData: ""
    }
  };
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.result.signal, "UP");
  assert.equal(res.body.result.quality_ok, true);
  assert.equal(res.body.meta.quality_gate, "v2");
  assert.equal(res.body.meta.model, "gpt-5.6-luna");

  global.fetch = oldFetch;
  process.env = oldEnv;
});
