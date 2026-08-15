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
  let modelRequest;

  global.fetch = async (_url, options) => {
    modelRequest = JSON.parse(options.body);
    return ({
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
            direction_bias: "UP",
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
  };

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
  assert.equal(res.body.meta.quality_gate, "v3");
  assert.equal(res.body.meta.signal_policy, "closest_direction_on_valid_chart");
  assert.equal(res.body.meta.model, "gpt-5.6-luna");
  assert.equal(modelRequest.input[0].content[1].detail, "high");
  assert.match(modelRequest.input[0].content[0].text, /signal MUST be UP or DOWN/);
  assert.match(modelRequest.input[0].content[0].text, /2 or 3 short, plain-language sentences/);
  assert.match(modelRequest.instructions, /choose the closest visible UP or DOWN direction/);

  global.fetch = oldFetch;
  process.env = oldEnv;
});
