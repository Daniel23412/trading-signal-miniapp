import crypto from "node:crypto";

export function validateTelegramInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || typeof initData !== "string") {
    return { ok: false, reason: "missing_init_data" };
  }
  if (!botToken) {
    return { ok: false, reason: "missing_bot_token" };
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDateRaw = params.get("auth_date");

  if (!receivedHash || !authDateRaw) {
    return { ok: false, reason: "invalid_init_data" };
  }

  const entries = [];
  for (const [key, value] of params.entries()) {
    if (key !== "hash") entries.push(`${key}=${value}`);
  }
  entries.sort();
  const dataCheckString = entries.join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const a = Buffer.from(calculatedHash, "hex");
  const b = Buffer.from(receivedHash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  const authDate = Number(authDateRaw);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate <= 0 || now - authDate > maxAgeSeconds || authDate - now > 60) {
    return { ok: false, reason: "expired_init_data" };
  }

  let user = null;
  const userRaw = params.get("user");
  if (userRaw) {
    try { user = JSON.parse(userRaw); } catch { /* ignore malformed optional user */ }
  }

  return { ok: true, user };
}
