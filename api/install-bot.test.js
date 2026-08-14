import test from "node:test";
import assert from "node:assert/strict";
import handler from "./install-bot.js";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test("bot installer rejects requests without the install secret", async () => {
  process.env.BOT_TOKEN = "123:test-token";
  process.env.INSTALL_SECRET = "install-secret";
  const res = responseRecorder();

  await handler({ method: "GET", query: {}, headers: {} }, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { ok: false, error: "forbidden" });
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("bot installer configures webhook, commands and menu with a valid secret", async () => {
  process.env.BOT_TOKEN = "123:test-token";
  process.env.INSTALL_SECRET = "install-secret";
  process.env.MINIAPP_URL = "https://example.vercel.app";
  delete process.env.ADMIN_TELEGRAM_IDS;
  delete process.env.BOT_ADMIN_IDS;
  delete process.env.POSTBACK_LOG_CHAT_ID;
  const previousFetch = global.fetch;
  const methods = [];
  global.fetch = async (url) => {
    methods.push(new URL(url).pathname.split("/").pop());
    return { ok: true, status: 200, json: async () => ({ ok: true, result: true }) };
  };

  try {
    const res = responseRecorder();
    await handler({ method: "GET", query: { secret: "install-secret" }, headers: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.deepEqual(methods, ["setWebhook", "setMyCommands", "setChatMenuButton"]);
  } finally {
    global.fetch = previousFetch;
  }
});
