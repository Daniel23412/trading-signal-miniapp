import crypto from "node:crypto";
import { claimDueFollowups, databaseConfigured, getAccessStatus, markFollowupSent, releaseFollowupClaim } from "../lib/database.js";
import { getBotCopy, normalizeLocale } from "../lib/locales.js";

const DEFAULT_MINIAPP_URL = "https://trading-signal-miniapp-clean-vercel.vercel.app";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  const cronSecret = String(process.env.CRON_SECRET || "");
  if (!cronSecret) return res.status(503).json({ ok: false, error: "cron_not_configured" });
  const received = String(req.headers?.authorization || "").replace(/^Bearer\s+/i, "");
  if (!safeEqual(cronSecret, received)) return res.status(401).json({ ok: false, error: "unauthorized" });
  if (!databaseConfigured() || !process.env.BOT_TOKEN) return res.status(503).json({ ok: false, error: "service_not_configured" });

  const due = await claimDueFollowups(50);
  let sent = 0;
  let failed = 0;
  for (const user of due) {
    const locale = normalizeLocale(user.locale, "en");
    const copy = getBotCopy(locale);
    try {
      const access = await getAccessStatus(user.telegram_id);
      if (access.allowed) {
        await releaseFollowupClaim(user.telegram_id);
        continue;
      }
      await sendTelegram(process.env.BOT_TOKEN, {
        chat_id: String(user.telegram_id), text: copy.followup, parse_mode: "HTML", disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [
          [{ text: copy.open, web_app: { url: miniappUrl(locale) } }],
          [{ text: copy.stop, callback_data: "followup:stop" }]
        ] }
      });
      await markFollowupSent(user.telegram_id);
      sent += 1;
    } catch (error) {
      failed += 1;
      await releaseFollowupClaim(user.telegram_id).catch(() => {});
      console.warn("Follow-up delivery failed", { userId: String(user.telegram_id), error: error?.message || error });
    }
  }
  return res.status(200).json({ ok: true, due: due.length, sent, failed });
}

function miniappUrl(locale) {
  const url = new URL(process.env.MINIAPP_URL || DEFAULT_MINIAPP_URL);
  url.searchParams.set("lang", locale);
  url.searchParams.set("src", "followup");
  return url.toString();
}

async function sendTelegram(token, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(`telegram_sendMessage_failed_${response.status}`);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
