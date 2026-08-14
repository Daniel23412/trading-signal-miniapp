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

test("official Vercel schedule header is a constrained fallback when no secret exists", async () => {
  const oldSecret = process.env.CRON_SECRET;
  const oldDatabase = process.env.DATABASE_URL;
  const oldToken = process.env.BOT_TOKEN;
  delete process.env.CRON_SECRET;
  delete process.env.DATABASE_URL;
  delete process.env.BOT_TOKEN;
  try {
    const unauthorized = res();
    await handler({ method: "GET", headers: {} }, unauthorized);
    assert.equal(unauthorized.code, 401);
    const scheduled = res();
    await handler({ method: "GET", headers: { "x-vercel-cron-schedule": "0 10 * * *" } }, scheduled);
    assert.equal(scheduled.code, 503);
    assert.equal(scheduled.body.error, "service_not_configured");
  } finally {
    if (oldSecret === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = oldSecret;
    if (oldDatabase === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldDatabase;
    if (oldToken === undefined) delete process.env.BOT_TOKEN; else process.env.BOT_TOKEN = oldToken;
  }
});
