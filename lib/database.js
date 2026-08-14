import pg from "pg";
import { normalizeLocale } from "./locales.js";

const { Pool } = pg;
const RESERVED_COUNTRY_CODES = new Set(["XX", "ZZ", "EU", "AP", "A1", "A2", "O1", "T1"]);
let pool = null;
let schemaPromise = null;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function minDepositAmount() {
  return clamp(Number(process.env.MIN_DEPOSIT_AMOUNT || 5), 1, 10000);
}

export function parseAmount(value) {
  if (value == null) return 0;
  const normalized = String(value).trim().replace(/\s+/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function normalizeUserId(value) {
  const raw = String(value ?? "").trim();
  return /^\d{4,20}$/.test(raw) ? raw : "";
}

export function extractRequestGeo(req) {
  const country = cleanCountryCode(req?.headers?.["x-vercel-ip-country"]);
  return {
    country,
    status: country ? "detected" : "unknown",
    region: cleanText(req?.headers?.["x-vercel-ip-country-region"]),
    city: decodeHeader(req?.headers?.["x-vercel-ip-city"]),
    timezone: cleanText(req?.headers?.["x-vercel-ip-timezone"])
  };
}

export async function syncUserContext(userId, req, user = {}, options = {}) {
  if (!databaseConfigured()) return;
  await ensureSchema();
  const geo = extractRequestGeo(req);
  const explicitLocale = ["explicit", "stored", "bot"].includes(String(options.localeSource || ""));
  const overwriteLocale = ["explicit", "bot"].includes(String(options.localeSource || ""));
  const locale = explicitLocale ? normalizeLocale(options.locale, null) : null;
  const source = cleanSource(options.source);
  await getPool().query(`INSERT INTO ai_signal_access (
      telegram_id,tg_username,tg_first_name,language_code,selected_locale,geo_country,geo_region,geo_city,geo_timezone,
      first_source,last_source,last_seen_at,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,NOW(),NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET
      tg_username=COALESCE(EXCLUDED.tg_username,ai_signal_access.tg_username),
      tg_first_name=COALESCE(EXCLUDED.tg_first_name,ai_signal_access.tg_first_name),
      language_code=COALESCE(EXCLUDED.language_code,ai_signal_access.language_code),
      selected_locale=CASE WHEN $11::BOOLEAN
        THEN COALESCE(EXCLUDED.selected_locale,ai_signal_access.selected_locale)
        ELSE COALESCE(ai_signal_access.selected_locale,EXCLUDED.selected_locale) END,
      geo_country=COALESCE(EXCLUDED.geo_country,ai_signal_access.geo_country),
      geo_region=COALESCE(EXCLUDED.geo_region,ai_signal_access.geo_region),
      geo_city=COALESCE(EXCLUDED.geo_city,ai_signal_access.geo_city),
      geo_timezone=COALESCE(EXCLUDED.geo_timezone,ai_signal_access.geo_timezone),
      first_source=COALESCE(ai_signal_access.first_source,EXCLUDED.first_source),
      last_source=COALESCE(EXCLUDED.last_source,ai_signal_access.last_source),
      last_seen_at=NOW(),updated_at=NOW()`, [
    String(userId), cleanText(user?.username), cleanText(user?.first_name), cleanText(user?.language_code), locale,
    geo.country, geo.region, geo.city, geo.timezone, source, overwriteLocale
  ]);
  await upsertBotUser(user, locale);
}

export async function saveSelectedLocale(user, locale, source = "miniapp") {
  if (!databaseConfigured() || !user?.id) return null;
  await ensureSchema();
  const selected = normalizeLocale(locale, null);
  if (!selected) return null;
  await getPool().query(`INSERT INTO ai_signal_access (
      telegram_id,tg_username,tg_first_name,language_code,selected_locale,first_source,last_source,last_seen_at,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$6,NOW(),NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET
      tg_username=COALESCE(EXCLUDED.tg_username,ai_signal_access.tg_username),
      tg_first_name=COALESCE(EXCLUDED.tg_first_name,ai_signal_access.tg_first_name),
      language_code=COALESCE(EXCLUDED.language_code,ai_signal_access.language_code),
      selected_locale=EXCLUDED.selected_locale,
      first_source=COALESCE(ai_signal_access.first_source,EXCLUDED.first_source),last_source=EXCLUDED.last_source,
      last_seen_at=NOW(),updated_at=NOW()`, [
    String(user.id), cleanText(user.username), cleanText(user.first_name), cleanText(user.language_code), selected, cleanSource(source)
  ]);
  await upsertBotUser(user, selected);
  return selected;
}

export async function getSavedLocale(userId) {
  if (!databaseConfigured() || !userId) return null;
  await ensureSchema();
  const result = await getPool().query(`SELECT COALESCE(a.selected_locale,b.selected_locale) AS selected_locale
    FROM (SELECT $1::BIGINT AS telegram_id) x
    LEFT JOIN ai_signal_access a USING (telegram_id)
    LEFT JOIN ai_signal_bot_users b USING (telegram_id) LIMIT 1`, [String(userId)]);
  return normalizeLocale(result.rows[0]?.selected_locale, null);
}

export async function getAccessStatus(userId, minDeposit = minDepositAmount()) {
  if (!databaseConfigured()) return emptyAccess(minDeposit, false);
  await ensureSchema();
  const result = await getPool().query(`SELECT registered,registered_at,deposit_amount,first_deposit_amount,deposit_ok,deposit_at,
    access_granted_at,selected_locale,first_source,last_source,referral_opened_at,followup_sent_at
    FROM ai_signal_access WHERE telegram_id=$1 LIMIT 1`, [String(userId)]);
  const row = result.rows[0];
  if (!row) return emptyAccess(minDeposit, true);
  const depositAmount = parseAmount(row.deposit_amount);
  const registered = Boolean(row.registered);
  const depositOk = Boolean(row.deposit_ok) || depositAmount >= minDeposit;
  return {
    configured: true,
    registered,
    registered_at: row.registered_at || null,
    deposit_amount: depositAmount,
    first_deposit_amount: parseAmount(row.first_deposit_amount),
    deposit_ok: depositOk,
    deposit_at: row.deposit_at || null,
    access_granted_at: row.access_granted_at || null,
    selected_locale: normalizeLocale(row.selected_locale, null),
    source: row.last_source || row.first_source || null,
    referral_opened_at: row.referral_opened_at || null,
    min_deposit: minDeposit,
    allowed: registered && depositOk
  };
}

export async function trackReferralOpen(userId, source = "miniapp") {
  if (!databaseConfigured()) return;
  await ensureSchema();
  await getPool().query(`INSERT INTO ai_signal_access (
      telegram_id,referral_opened_at,referral_open_count,first_source,last_source,last_seen_at,updated_at)
    VALUES ($1,NOW(),1,$2,$2,NOW(),NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET
      referral_opened_at=COALESCE(ai_signal_access.referral_opened_at,EXCLUDED.referral_opened_at),
      referral_open_count=ai_signal_access.referral_open_count+1,
      first_source=COALESCE(ai_signal_access.first_source,EXCLUDED.first_source),last_source=EXCLUDED.last_source,
      last_seen_at=NOW(),updated_at=NOW()`, [String(userId), cleanSource(source)]);
}

export async function applyRegistration(userId) {
  await ensureSchema();
  const before = await getAccessStatus(userId);
  const hours = clamp(Number(process.env.FOLLOWUP_DELAY_HOURS || 6), 1, 168);
  await getPool().query(`INSERT INTO ai_signal_access (
      telegram_id,registered,registered_at,registration_event_count,followup_due_at,updated_at)
    VALUES ($1,TRUE,NOW(),1,NOW()+($2::TEXT || ' hours')::INTERVAL,NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET
      registered=TRUE,registered_at=COALESCE(ai_signal_access.registered_at,EXCLUDED.registered_at),
      registration_event_count=ai_signal_access.registration_event_count+1,
      followup_due_at=CASE WHEN ai_signal_access.deposit_ok OR ai_signal_access.followup_sent_at IS NOT NULL
        THEN ai_signal_access.followup_due_at ELSE COALESCE(ai_signal_access.followup_due_at,EXCLUDED.followup_due_at) END,
      updated_at=NOW()`, [String(userId), hours]);
  return { duplicate: before.registered, access: await getAccessStatus(userId) };
}

export async function applyDeposit(userId, amount, minDeposit = minDepositAmount()) {
  await ensureSchema();
  const before = await getAccessStatus(userId, minDeposit);
  const qualifies = Number(amount) >= Number(minDeposit);
  await getPool().query(`INSERT INTO ai_signal_access (
      telegram_id,registered,registered_at,deposit_amount,first_deposit_amount,deposit_ok,deposit_at,deposit_event_count,
      access_granted_at,followup_due_at,followup_claimed_at,updated_at)
    VALUES ($1,TRUE,NOW(),$2,$2,$3,NOW(),1,CASE WHEN $3 THEN NOW() ELSE NULL END,NULL,NULL,NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET
      registered=TRUE,registered_at=COALESCE(ai_signal_access.registered_at,NOW()),
      deposit_amount=GREATEST(ai_signal_access.deposit_amount,EXCLUDED.deposit_amount),
      first_deposit_amount=COALESCE(ai_signal_access.first_deposit_amount,EXCLUDED.first_deposit_amount),
      deposit_ok=ai_signal_access.deposit_ok OR EXCLUDED.deposit_ok,
      deposit_at=COALESCE(ai_signal_access.deposit_at,EXCLUDED.deposit_at),
      deposit_event_count=ai_signal_access.deposit_event_count+1,
      access_granted_at=CASE WHEN ai_signal_access.access_granted_at IS NOT NULL THEN ai_signal_access.access_granted_at
        WHEN ai_signal_access.deposit_ok OR EXCLUDED.deposit_ok THEN NOW() ELSE NULL END,
      followup_due_at=CASE WHEN ai_signal_access.deposit_ok OR EXCLUDED.deposit_ok THEN NULL ELSE ai_signal_access.followup_due_at END,
      followup_claimed_at=CASE WHEN ai_signal_access.deposit_ok OR EXCLUDED.deposit_ok THEN NULL ELSE ai_signal_access.followup_claimed_at END,
      updated_at=NOW()`, [String(userId), Number(amount), qualifies]);
  return { duplicate: Boolean(before.deposit_at), access: await getAccessStatus(userId, minDeposit) };
}

export async function getUserProfile(userId) {
  if (!databaseConfigured()) return null;
  await ensureSchema();
  const result = await getPool().query(`SELECT telegram_id,tg_username,tg_first_name,language_code,selected_locale,
    geo_country,geo_region,geo_city,geo_timezone,first_source,last_source,last_seen_at,
    registered,registered_at,registration_event_count,deposit_amount,first_deposit_amount,deposit_ok,deposit_at,
    deposit_event_count,access_granted_at,referral_opened_at,referral_open_count,followup_sent_at,reminders_enabled
    FROM ai_signal_access WHERE telegram_id=$1 LIMIT 1`, [String(userId)]);
  return result.rows[0] || null;
}

export async function getStats({ today = false } = {}) {
  await ensureSchema();
  const cutoff = today
    ? `date_trunc('day',NOW() AT TIME ZONE 'Europe/Moscow') AT TIME ZONE 'Europe/Moscow'`
    : `'-infinity'::TIMESTAMPTZ`;
  const result = await getPool().query(`SELECT
      COUNT(*) FILTER (WHERE referral_opened_at>=${cutoff})::INT AS opened,
      COALESCE(SUM(referral_open_count) FILTER (WHERE referral_opened_at>=${cutoff}),0)::INT AS open_events,
      COUNT(*) FILTER (WHERE registered_at>=${cutoff})::INT AS registered,
      COUNT(*) FILTER (WHERE deposit_ok AND access_granted_at>=${cutoff})::INT AS deposited,
      COALESCE(AVG(first_deposit_amount) FILTER (WHERE deposit_ok AND access_granted_at>=${cutoff}),0)::NUMERIC(18,2) AS avg_deposit,
      COALESCE(SUM(registration_event_count) FILTER (WHERE registered_at>=${cutoff}),0)::INT AS registration_events,
      COALESCE(SUM(deposit_event_count) FILTER (WHERE deposit_at>=${cutoff}),0)::INT AS deposit_events
    FROM ai_signal_access`);
  const row = result.rows[0] || {};
  const opened = Number(row.opened || 0);
  const registered = Number(row.registered || 0);
  const deposited = Number(row.deposited || 0);
  return {
    opened, open_events: Number(row.open_events || 0), registered, deposited,
    avg_deposit: Number(row.avg_deposit || 0),
    registration_events: Number(row.registration_events || 0), deposit_events: Number(row.deposit_events || 0),
    registration_conversion: opened ? registered / opened : 0,
    deposit_conversion: registered ? deposited / registered : 0
  };
}

export async function claimDueFollowups(limit = 50) {
  await ensureSchema();
  const result = await getPool().query(`WITH due AS (
      SELECT telegram_id FROM ai_signal_access
      WHERE registered=TRUE AND deposit_ok=FALSE AND reminders_enabled=TRUE
        AND followup_due_at IS NOT NULL AND followup_due_at<=NOW() AND followup_sent_at IS NULL
        AND (followup_claimed_at IS NULL OR followup_claimed_at<NOW()-INTERVAL '30 minutes')
      ORDER BY followup_due_at ASC FOR UPDATE SKIP LOCKED LIMIT $1
    )
    UPDATE ai_signal_access a SET followup_claimed_at=NOW(),updated_at=NOW()
    FROM due WHERE a.telegram_id=due.telegram_id
    RETURNING a.telegram_id,COALESCE(a.selected_locale,a.language_code,'en') AS locale`, [Math.max(1, Math.min(100, Number(limit) || 50))]);
  return result.rows;
}

export async function markFollowupSent(userId) {
  await ensureSchema();
  await getPool().query(`UPDATE ai_signal_access SET followup_sent_at=COALESCE(followup_sent_at,NOW()),followup_claimed_at=NULL,updated_at=NOW()
    WHERE telegram_id=$1 AND deposit_ok=FALSE`, [String(userId)]);
}

export async function releaseFollowupClaim(userId) {
  await ensureSchema();
  await getPool().query(`UPDATE ai_signal_access SET followup_claimed_at=NULL,updated_at=NOW()
    WHERE telegram_id=$1 AND followup_sent_at IS NULL`, [String(userId)]);
}

export async function disableReminders(userId) {
  if (!databaseConfigured()) return;
  await ensureSchema();
  await getPool().query(`INSERT INTO ai_signal_access (telegram_id,reminders_enabled,updated_at) VALUES ($1,FALSE,NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET reminders_enabled=FALSE,followup_due_at=NULL,followup_claimed_at=NULL,updated_at=NOW()`, [String(userId)]);
}

async function upsertBotUser(user, locale) {
  if (!user?.id) return;
  await getPool().query(`INSERT INTO ai_signal_bot_users (telegram_id,selected_locale,tg_username,tg_first_name,telegram_language,updated_at)
    VALUES ($1,$2,$3,$4,$5,NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET
      selected_locale=COALESCE(EXCLUDED.selected_locale,ai_signal_bot_users.selected_locale),
      tg_username=COALESCE(EXCLUDED.tg_username,ai_signal_bot_users.tg_username),
      tg_first_name=COALESCE(EXCLUDED.tg_first_name,ai_signal_bot_users.tg_first_name),
      telegram_language=COALESCE(EXCLUDED.telegram_language,ai_signal_bot_users.telegram_language),updated_at=NOW()`, [
    String(user.id), locale, cleanText(user.username), cleanText(user.first_name), cleanText(user.language_code)
  ]);
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await getPool().query(`CREATE TABLE IF NOT EXISTS ai_signal_access (
        telegram_id BIGINT PRIMARY KEY,registered BOOLEAN NOT NULL DEFAULT FALSE,registered_at TIMESTAMPTZ NULL,
        deposit_amount NUMERIC(18,2) NOT NULL DEFAULT 0,deposit_ok BOOLEAN NOT NULL DEFAULT FALSE,
        deposit_at TIMESTAMPTZ NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await getPool().query(`CREATE TABLE IF NOT EXISTS ai_signal_bot_users (
        telegram_id BIGINT PRIMARY KEY,selected_locale TEXT NULL,tg_username TEXT NULL,tg_first_name TEXT NULL,
        telegram_language TEXT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await getPool().query(`ALTER TABLE ai_signal_access
        ADD COLUMN IF NOT EXISTS tg_username TEXT NULL,
        ADD COLUMN IF NOT EXISTS tg_first_name TEXT NULL,
        ADD COLUMN IF NOT EXISTS language_code TEXT NULL,
        ADD COLUMN IF NOT EXISTS selected_locale TEXT NULL,
        ADD COLUMN IF NOT EXISTS geo_country TEXT NULL,
        ADD COLUMN IF NOT EXISTS geo_region TEXT NULL,
        ADD COLUMN IF NOT EXISTS geo_city TEXT NULL,
        ADD COLUMN IF NOT EXISTS geo_timezone TEXT NULL,
        ADD COLUMN IF NOT EXISTS first_source TEXT NULL,
        ADD COLUMN IF NOT EXISTS last_source TEXT NULL,
        ADD COLUMN IF NOT EXISTS referral_opened_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS referral_open_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS first_deposit_amount NUMERIC(18,2) NULL,
        ADD COLUMN IF NOT EXISTS registration_event_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS deposit_event_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS followup_due_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS followup_claimed_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NULL`);
      await getPool().query(`UPDATE ai_signal_access SET
        first_deposit_amount=COALESCE(first_deposit_amount,NULLIF(deposit_amount,0)),
        registration_event_count=CASE WHEN registered AND registration_event_count=0 THEN 1 ELSE registration_event_count END,
        deposit_event_count=CASE WHEN deposit_at IS NOT NULL AND deposit_event_count=0 THEN 1 ELSE deposit_event_count END,
        deposit_ok=deposit_ok OR (registered AND deposit_amount >= $1),
        access_granted_at=CASE WHEN access_granted_at IS NULL AND registered AND (deposit_ok OR deposit_amount >= $1)
          THEN COALESCE(deposit_at,updated_at) ELSE access_granted_at END
        WHERE first_deposit_amount IS NULL OR (registered AND deposit_amount >= $1 AND (deposit_ok=FALSE OR access_granted_at IS NULL))
          OR (registered AND registration_event_count=0) OR (deposit_at IS NOT NULL AND deposit_event_count=0)`, [minDepositAmount()]);
      await getPool().query(`UPDATE ai_signal_access a SET selected_locale=b.selected_locale
        FROM ai_signal_bot_users b WHERE a.telegram_id=b.telegram_id AND a.selected_locale IS NULL AND b.selected_locale IS NOT NULL`);
      await getPool().query(`UPDATE ai_signal_access SET geo_country=NULL
        WHERE geo_country IN ('XX','ZZ','EU','AP','A1','A2','O1','T1')`);
      await getPool().query(`CREATE INDEX IF NOT EXISTS ai_signal_followup_due_idx
        ON ai_signal_access (followup_due_at) WHERE registered=TRUE AND deposit_ok=FALSE AND followup_sent_at IS NULL`);
    })().catch(error => {
      schemaPromise = null;
      error.code = error.code || "database_error";
      throw error;
    });
  }
  await schemaPromise;
}

function getPool() {
  if (!databaseConfigured()) {
    const error = new Error("database_not_configured");
    error.code = "database_not_configured";
    throw error;
  }
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 8000, ssl: { rejectUnauthorized: false } });
    pool.on("error", error => console.error("Postgres pool error", error?.message || error));
  }
  return pool;
}

function emptyAccess(minDeposit, configured) {
  return { configured, registered: false, registered_at: null, deposit_amount: 0, first_deposit_amount: 0,
    deposit_ok: false, deposit_at: null, access_granted_at: null, selected_locale: null, source: null,
    referral_opened_at: null, min_deposit: minDeposit, allowed: false };
}

function cleanCountryCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && !RESERVED_COUNTRY_CODES.has(code) ? code : null;
}

function cleanSource(value) {
  const source = cleanText(value)?.toLowerCase().replace(/[^a-z0-9_.:-]/g, "_");
  return source?.slice(0, 80) || null;
}

function decodeHeader(value) {
  const raw = cleanText(value);
  if (!raw) return null;
  try { return decodeURIComponent(raw); } catch { return raw; }
}

function cleanText(value) {
  if (value == null) return null;
  const text = String(value).trim().slice(0, 160);
  return text || null;
}

function clamp(number, min, max) {
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : min;
}
