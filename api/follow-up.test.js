import test from "node:test";
import assert from "node:assert/strict";
import handler from "./follow-up.js";

function res() {
  return {
    code: 200, body: null, headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(value) { this.code = value; return this; },
    json(value) { this.body = value; return this; }
  };
}

test("follow-up route requires Vercel cron authorization", async () => {
  const oldSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "cron-secret";
  try {
    const response = res();
    await handler({ method: "GET", headers: {} }, response);
    assert.equal(response.code, 401);
    assert.deepEqual(response.body, { ok: false, error: "unauthorized" });
    assert.equal(response.headers["Cache-Control"], "no-store");
  } finally {
    if (oldSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = oldSecret;
  }
});
