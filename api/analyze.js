import crypto from "node:crypto";
import pg from "pg";
import { validateTelegramInitData } from "../lib/telegram-auth.js";
import { normalizeSignal } from "../lib/signal.js";

const { Pool } = pg;
const ALLOWED_TIMEFRAMES = new Set(["M1","M5","M15","M30","H1"]);
const ALLOWED_EXPIRATIONS = new Set(["1","3","5","10","15"]);
const MAX_DATA_URL_LENGTH = 3_200_000;
const DEFAULT_AFFILIATE_URL = "https://lkus.cc/f6f3ab";
const LANGUAGES = {
  ru:{name:"Russian",native:"русском"}, en:{name:"English",native:"English"}, de:{name:"German",native:"Deutsch"},
  fr:{name:"French",native:"français"}, it:{name:"Italian",native:"italiano"}, es:{name:"Spanish",native:"español"},
  pt:{name:"Portuguese",native:"português"}, ja:{name:"Japanese",native:"日本語"}, hi:{name:"Hindi",native:"हिन्दी"},
  id:{name:"Indonesian",native:"Bahasa Indonesia"}, ko:{name:"Korean",native:"한국어"}, tr:{name:"Turkish",native:"Türkçe"},
  uk:{name:"Ukrainian",native:"українська"}, sv:{name:"Swedish",native:"svenska"}, no:{name:"Norwegian",native:"norsk"},
  zh:{name:"Simplified Chinese",native:"简体中文"}
};

let pool = null;
let schemaPromise = null;

export default async function handler(req,res){
  try{
    res.setHeader("Cache-Control","no-store");
    const postbackInput = readPostbackInput(req);
    if(["GET","POST"].includes(req.method) && postbackInput.event) return await handlePostback(req,res,postbackInput);
    if(req.method !== "POST"){
      res.setHeader("Allow","GET, POST");
      return res.status(405).json({error:"method_not_allowed"});
    }
    const action = String(req.body?.action || "analyze");
    if(action === "access_status") return await handleAccessStatus(req,res);
    if(action === "referral") return await handleReferral(req,res);
    return await handleAnalysis(req,res);
  }catch(error){
    console.error("API error",error);
    return res.status(500).json({error:error?.code || "internal_error"});
  }
}

async function handleAccessStatus(req,res){
  const auth = telegramAuth(req);
  if(!auth.ok) return res.status(401).json({error:"telegram_auth_failed",reason:auth.reason});
  const minDeposit = minDepositAmount();
  if(!databaseConfigured()) return res.status(200).json({ok:true,access:{configured:false,registered:false,deposit_amount:0,deposit_ok:false,allowed:false,min_deposit:minDeposit}});
  await syncUserContext(auth.user.id,req,auth.user);
  return res.status(200).json({ok:true,access:await getAccessStatus(auth.user.id,minDeposit)});
}

async function handleReferral(req,res){
  const auth = telegramAuth(req);
  if(!auth.ok) return res.status(401).json({error:"telegram_auth_failed",reason:auth.reason});
  if(databaseConfigured()) await syncUserContext(auth.user.id,req,auth.user);
  let url;
  try{ url = new URL(process.env.AFFILIATE_REF_URL || DEFAULT_AFFILIATE_URL); }
  catch{ return res.status(500).json({error:"invalid_affiliate_url"}); }
  url.searchParams.set("sub1",String(auth.user.id));
  return res.status(200).json({ok:true,url:url.toString(),sub1:String(auth.user.id)});
}

async function handlePostback(req,res,input){
  const expectedSecret = String(process.env.POSTBACK_SECRET || "");
  const receivedSecret = String(input.secret || req.headers["x-postback-secret"] || "");
  if(!expectedSecret) return res.status(503).send("postback_not_configured");
  if(!safeStringEqual(expectedSecret,receivedSecret)) return res.status(403).send("forbidden");
  if(!databaseConfigured()) return res.status(503).send("database_not_configured");

  const event = String(input.event || "").trim().toLowerCase();
  const sub1 = normalizeUserId(input.sub1 || input.click_id || input.clickid || input.telegram_id);
  if(!sub1) return res.status(400).send("invalid_sub1");
  const minDeposit = minDepositAmount();

  if(["registration","register","reg"].includes(event)){
    await upsertRegistration(sub1);
    const profile = await getUserProfile(sub1);
    const access = await getAccessStatus(sub1,minDeposit);
    await forwardPostbackLog(buildPostbackMessage({type:"registration",userId:sub1,profile,access,minDeposit}));
    console.info("Postback accepted",{event:"registration",country:profile?.geo_country || null});
  }else if(["firstdep","deposit","first_deposit"].includes(event)){
    const amount = parseAmount(input.amount);
    if(!(amount > 0)) return res.status(400).send("invalid_amount");
    await upsertDeposit(sub1,amount,minDeposit);
    const profile = await getUserProfile(sub1);
    const access = await getAccessStatus(sub1,minDeposit);
    await forwardPostbackLog(buildPostbackMessage({type:"firstdep",userId:sub1,amount,profile,access,minDeposit}));
    console.info("Postback accepted",{event:"firstdep",amount,country:profile?.geo_country || null});
  }else{
    return res.status(400).send("unknown_event");
  }

  const access = await getAccessStatus(sub1,minDeposit);
  return res.status(200).send(access.allowed ? "ok|access_granted" : "ok|saved");
}

async function handleAnalysis(req,res){
  const requireTelegramAuth = String(process.env.REQUIRE_TELEGRAM_AUTH ?? "true").toLowerCase() !== "false";
  const requireDepositAccess = String(process.env.REQUIRE_DEPOSIT_ACCESS ?? "false").toLowerCase() === "true";
  let auth = {ok:false,user:null,reason:"telegram_auth_disabled"};
  if(requireTelegramAuth || requireDepositAccess){
    auth = telegramAuth(req);
    if(!auth.ok) return res.status(401).json({error:"telegram_auth_failed",reason:auth.reason});
  }
  if(auth.ok && databaseConfigured()) await syncUserContext(auth.user.id,req,auth.user);
  if(requireDepositAccess){
    if(!databaseConfigured()) return res.status(503).json({error:"database_not_configured"});
    const access = await getAccessStatus(auth.user.id,minDepositAmount());
    if(!access.allowed) return res.status(403).json({error:"access_required",access});
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey) return res.status(500).json({error:"missing_openai_api_key"});
  const image = req.body?.image;
  const timeframe = String(req.body?.timeframe || "M5").toUpperCase();
  const expiration = String(req.body?.expiration || "3");
  const locale = normalizeLocale(req.body?.locale);
  const language = LANGUAGES[locale];
  if(!ALLOWED_TIMEFRAMES.has(timeframe)) return res.status(400).json({error:"invalid_timeframe"});
  if(!ALLOWED_EXPIRATIONS.has(expiration)) return res.status(400).json({error:"invalid_expiration"});
  if(typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) return res.status(400).json({error:"invalid_image"});
  if(image.length > MAX_DATA_URL_LENGTH) return res.status(413).json({error:"image_too_large"});

  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const minConfidence = clamp(Number(process.env.MIN_CONFIDENCE || 72),50,95);
  const schema = {type:"object",properties:{
    signal:{type:"string",enum:["UP","DOWN","NO_SIGNAL"]}, confidence:{type:"integer",minimum:0,maximum:100},
    chart_quality:{type:"string",enum:["good","medium","poor"]}, trend:{type:"string"}, reason:{type:"string"}, invalid_chart:{type:"boolean"}
  },required:["signal","confidence","chart_quality","trend","reason","invalid_chart"],additionalProperties:false};

  const prompt = `Analyze ONLY what is actually visible in the attached trading-chart screenshot.\n\nUser parameters:\n- timeframe: ${timeframe}\n- intended trade duration: ${expiration} minutes\n- selected interface language: ${language.native} (${language.name})\n\nTask:\nGive a short visual assessment of the nearest price direction using only visible evidence such as price structure, highs/lows, candles, local levels, and indicators if they are genuinely visible.\n\nRules:\n- Never invent the asset, price, indicators, levels, or market context that are not visible.\n- If the screenshot is not a trading chart, is unreadable, critically cropped, or contains too little information, use signal=NO_SIGNAL and invalid_chart=true.\n- If the setup is ambiguous, use signal=NO_SIGNAL.\n- confidence is internal analysis confidence, NOT a win probability and NOT a guarantee.\n- UP/DOWN requires a clearly expressed visual direction.\n- trend MUST be a short, natural phrase written ONLY in ${language.native}.\n- reason MUST contain no more than 2 short sentences written ONLY in ${language.native}.\n- Do NOT use Russian in trend or reason unless the selected language is Russian.\n- Do NOT mix languages in trend or reason.\n- No promises of profit and no guarantees.\n- signal, chart_quality and JSON property names remain technical English values exactly as required by the schema.`;

  const openaiRes = await fetch("https://api.openai.com/v1/responses",{
    method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({model,store:false,reasoning:{effort:"none"},
      instructions:`You are a visual trading-chart analyzer. Return only data matching the JSON schema. Human-readable fields trend and reason must be written exclusively in ${language.native} (${language.name}).`,
      input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_image",image_url:image,detail:"auto"}]}],
      text:{format:{type:"json_schema",name:"trading_signal",strict:true,schema}},max_output_tokens:500})
  });
  const data = await openaiRes.json();
  if(!openaiRes.ok){
    console.error("OpenAI error",openaiRes.status,JSON.stringify(data).slice(0,1600));
    return res.status(502).json({error:"openai_error"});
  }
  const outputText = getOutputText(data);
  if(!outputText) return res.status(502).json({error:"empty_model_output"});
  let parsed;
  try{ parsed = JSON.parse(outputText); }
  catch{ console.error("Invalid model JSON",outputText.slice(0,1000)); return res.status(502).json({error:"invalid_model_output"}); }
  const result = normalizeSignal(parsed,minConfidence);
  if(result.invalid_chart) result.signal = "NO_SIGNAL";
  if(typeof parsed?.trend !== "string" || !parsed.trend.trim()) result.trend = "—";
  if(typeof parsed?.reason !== "string" || !parsed.reason.trim()) result.reason = "—";
  return res.status(200).json({ok:true,result,meta:{timeframe,expiration_minutes:Number(expiration),locale,language:language.name,model,min_confidence:minConfidence,disclaimer:"AI chart analysis does not guarantee the outcome of a trade."}});
}

function readPostbackInput(req){
  const query = req.query && typeof req.query === "object" ? req.query : {};
  let body = req.body;
  if(typeof body === "string"){
    try{ body = Object.fromEntries(new URLSearchParams(body).entries()); }catch{ body = {}; }
  }
  if(!body || typeof body !== "object" || Array.isArray(body)) body = {};
  return {...body,...query};
}

function telegramAuth(req){
  const botToken = process.env.BOT_TOKEN;
  const maxAge = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS || process.env.TELEGRAM_AUTH_X_AGE_SECONDS || 86400);
  const auth = validateTelegramInitData(req.body?.tgInitData,botToken,maxAge);
  if(!auth.ok) return auth;
  const id = normalizeUserId(auth.user?.id);
  if(!id) return {ok:false,reason:"missing_user_id"};
  return {ok:true,user:{...auth.user,id}};
}

function databaseConfigured(){ return Boolean(process.env.DATABASE_URL); }
function getPool(){
  if(!databaseConfigured()){ const e = new Error("database_not_configured"); e.code="database_not_configured"; throw e; }
  if(!pool){
    pool = new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:8000,ssl:{rejectUnauthorized:false}});
    pool.on("error",e=>console.error("Postgres pool error",e));
  }
  return pool;
}

async function ensureSchema(){
  if(!schemaPromise){
    schemaPromise = (async()=>{
      await getPool().query(`CREATE TABLE IF NOT EXISTS ai_signal_access (
        telegram_id BIGINT PRIMARY KEY, registered BOOLEAN NOT NULL DEFAULT FALSE, registered_at TIMESTAMPTZ NULL,
        deposit_amount NUMERIC(18,2) NOT NULL DEFAULT 0, deposit_ok BOOLEAN NOT NULL DEFAULT FALSE,
        deposit_at TIMESTAMPTZ NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await getPool().query(`ALTER TABLE ai_signal_access
        ADD COLUMN IF NOT EXISTS tg_username TEXT NULL,
        ADD COLUMN IF NOT EXISTS tg_first_name TEXT NULL,
        ADD COLUMN IF NOT EXISTS language_code TEXT NULL,
        ADD COLUMN IF NOT EXISTS geo_country TEXT NULL,
        ADD COLUMN IF NOT EXISTS geo_region TEXT NULL,
        ADD COLUMN IF NOT EXISTS geo_city TEXT NULL,
        ADD COLUMN IF NOT EXISTS geo_timezone TEXT NULL,
        ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NULL`);
    })().catch(error=>{schemaPromise=null;error.code=error.code||"database_error";throw error;});
  }
  await schemaPromise;
}

async function getAccessStatus(userId,minDeposit){
  await ensureSchema();
  const r = await getPool().query(`SELECT registered,registered_at,deposit_amount,deposit_ok,deposit_at FROM ai_signal_access WHERE telegram_id=$1 LIMIT 1`,[String(userId)]);
  const row = r.rows[0];
  if(!row) return {configured:true,registered:false,registered_at:null,deposit_amount:0,deposit_ok:false,deposit_at:null,min_deposit:minDeposit,allowed:false};
  const depositAmount = parseAmount(row.deposit_amount);
  const depositOk = Boolean(row.deposit_ok) || depositAmount >= minDeposit;
  const registered = Boolean(row.registered);
  return {configured:true,registered,registered_at:row.registered_at||null,deposit_amount:depositAmount,deposit_ok:depositOk,deposit_at:row.deposit_at||null,min_deposit:minDeposit,allowed:registered&&depositOk};
}

async function syncUserContext(userId,req,user={}){
  await ensureSchema();
  const geo = extractRequestGeo(req);
  await getPool().query(`INSERT INTO ai_signal_access (
    telegram_id,tg_username,tg_first_name,language_code,geo_country,geo_region,geo_city,geo_timezone,last_seen_at,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET
      tg_username=COALESCE(EXCLUDED.tg_username,ai_signal_access.tg_username),
      tg_first_name=COALESCE(EXCLUDED.tg_first_name,ai_signal_access.tg_first_name),
      language_code=COALESCE(EXCLUDED.language_code,ai_signal_access.language_code),
      geo_country=COALESCE(EXCLUDED.geo_country,ai_signal_access.geo_country),
      geo_region=COALESCE(EXCLUDED.geo_region,ai_signal_access.geo_region),
      geo_city=COALESCE(EXCLUDED.geo_city,ai_signal_access.geo_city),
      geo_timezone=COALESCE(EXCLUDED.geo_timezone,ai_signal_access.geo_timezone),
      last_seen_at=NOW(),updated_at=NOW()`,[
        String(userId),cleanText(user?.username),cleanText(user?.first_name),cleanText(user?.language_code),
        geo.country,geo.region,geo.city,geo.timezone
      ]);
}

async function getUserProfile(userId){
  await ensureSchema();
  const r = await getPool().query(`SELECT tg_username,tg_first_name,language_code,geo_country,geo_region,geo_city,geo_timezone,last_seen_at FROM ai_signal_access WHERE telegram_id=$1 LIMIT 1`,[String(userId)]);
  return r.rows[0] || null;
}

async function upsertRegistration(userId){
  await ensureSchema();
  await getPool().query(`INSERT INTO ai_signal_access (telegram_id,registered,registered_at,updated_at) VALUES ($1,TRUE,NOW(),NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET registered=TRUE,registered_at=COALESCE(ai_signal_access.registered_at,EXCLUDED.registered_at),updated_at=NOW()`,[String(userId)]);
}

async function upsertDeposit(userId,amount,minDeposit){
  await ensureSchema();
  await getPool().query(`INSERT INTO ai_signal_access (telegram_id,registered,registered_at,deposit_amount,deposit_ok,deposit_at,updated_at)
    VALUES ($1,TRUE,NOW(),$2,$3,NOW(),NOW()) ON CONFLICT (telegram_id) DO UPDATE SET
    registered=TRUE,registered_at=COALESCE(ai_signal_access.registered_at,NOW()),
    deposit_amount=GREATEST(ai_signal_access.deposit_amount,EXCLUDED.deposit_amount),
    deposit_ok=ai_signal_access.deposit_ok OR EXCLUDED.deposit_ok,
    deposit_at=COALESCE(ai_signal_access.deposit_at,EXCLUDED.deposit_at),updated_at=NOW()`,[String(userId),amount,amount>=minDeposit]);
}

async function forwardPostbackLog(text){
  const chatId = process.env.POSTBACK_LOG_CHAT_ID;
  const botToken = process.env.BOT_TOKEN;
  if(!chatId || !botToken) return;
  try{
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({chat_id:chatId,text,parse_mode:"HTML",disable_web_page_preview:true})
    });
    if(!response.ok) console.warn("Postback log delivery failed",response.status);
  }catch(error){ console.warn("Postback log delivery failed",error?.message || error); }
}

function buildPostbackMessage({type,userId,amount=0,profile,access,minDeposit}){
  const geo = formatGeo(profile);
  const username = profile?.tg_username ? `@${escapeHtml(profile.tg_username)}` : "—";
  const firstName = profile?.tg_first_name ? escapeHtml(profile.tg_first_name) : "—";
  const language = profile?.language_code ? escapeHtml(profile.language_code) : "—";
  const time = formatMoscowTime(new Date());
  if(type === "registration") return [
    "🟢 <b>НОВАЯ РЕГИСТРАЦИЯ</b>","",
    `👤 <b>Пользователь:</b> ${firstName}`,
    `🆔 <b>Telegram ID:</b> <code>${escapeHtml(userId)}</code>`,
    `🔗 <b>Username:</b> ${username}`,
    `🌍 <b>ГЕО:</b> ${geo.countryLine}`,
    ...(geo.cityLine ? [`🏙 <b>Город:</b> ${geo.cityLine}`] : []),
    `🗣 <b>Язык Telegram:</b> ${language}`,
    "✅ <b>Регистрация:</b> подтверждена",
    `💰 <b>Депозит:</b> ${access?.deposit_ok ? `$${formatAmount(access.deposit_amount)}` : "ожидается"}`,
    `🕒 <b>Время:</b> ${time}`
  ].join("\n");
  const enough = Number(amount) >= Number(minDeposit);
  return [
    "💸 <b>ПЕРВЫЙ ДЕПОЗИТ</b>","",
    `👤 <b>Пользователь:</b> ${firstName}`,
    `🆔 <b>Telegram ID:</b> <code>${escapeHtml(userId)}</code>`,
    `🔗 <b>Username:</b> ${username}`,
    `🌍 <b>ГЕО:</b> ${geo.countryLine}`,
    ...(geo.cityLine ? [`🏙 <b>Город:</b> ${geo.cityLine}`] : []),
    `🗣 <b>Язык Telegram:</b> ${language}`,
    `💵 <b>Сумма:</b> $${formatAmount(amount)}`,
    `${enough?"✅":"⚠️"} <b>Минимум $${formatAmount(minDeposit)}:</b> ${enough?"выполнен":"не выполнен"}`,
    `${access?.allowed?"🔓 <b>Доступ к сигналам:</b> открыт":"🔒 <b>Доступ к сигналам:</b> закрыт"}`,
    `🕒 <b>Время:</b> ${time}`
  ].join("\n");
}

function extractRequestGeo(req){
  return {
    country:cleanCountryCode(req.headers?.["x-vercel-ip-country"]),
    region:cleanText(req.headers?.["x-vercel-ip-country-region"]),
    city:decodeHeader(req.headers?.["x-vercel-ip-city"]),
    timezone:cleanText(req.headers?.["x-vercel-ip-timezone"])
  };
}

function formatGeo(profile){
  const code = cleanCountryCode(profile?.geo_country);
  if(!code) return {countryLine:"не определено",cityLine:""};
  let name = code;
  try{ name = new Intl.DisplayNames(["ru"],{type:"region"}).of(code) || code; }catch{}
  const flag = countryFlag(code);
  const city = cleanText(profile?.geo_city);
  const region = cleanText(profile?.geo_region);
  return {countryLine:`${flag?flag+" ":""}${escapeHtml(name)} (${escapeHtml(code)})`,cityLine:city?`${escapeHtml(city)}${region?` · ${escapeHtml(region)}`:""}`:""};
}

function countryFlag(code){ return /^[A-Z]{2}$/.test(code||"") ? [...code].map(c=>String.fromCodePoint(127397+c.charCodeAt(0))).join("") : ""; }
function cleanCountryCode(value){ const code=String(value||"").trim().toUpperCase(); return /^[A-Z]{2}$/.test(code)?code:""; }
function decodeHeader(value){ const raw=cleanText(value); if(!raw) return null; try{return decodeURIComponent(raw);}catch{return raw;} }
function cleanText(value){ if(value==null) return null; const text=String(value).trim().slice(0,160); return text||null; }
function escapeHtml(value){ return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function formatMoscowTime(date){
  try{return new Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Moscow",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(date)+" МСК";}
  catch{return date.toISOString();}
}
function minDepositAmount(){ return clamp(Number(process.env.MIN_DEPOSIT_AMOUNT || 5),1,10000); }
function normalizeUserId(value){ const raw=String(value??"").trim(); return /^\d{4,20}$/.test(raw)?raw:""; }
function parseAmount(value){
  if(value==null) return 0;
  const normalized=String(value).trim().replace(/\s+/g,"").replace(",",".").replace(/[^\d.-]/g,"");
  const amount=Number(normalized); return Number.isFinite(amount)&&amount>0?amount:0;
}
function formatAmount(amount){ return Number(amount).toFixed(2).replace(/\.00$/,"").replace(/(\.\d)0$/,"$1"); }
function safeStringEqual(a,b){ const l=Buffer.from(String(a)),r=Buffer.from(String(b)); return l.length===r.length && crypto.timingSafeEqual(l,r); }
function normalizeLocale(value){ const raw=String(value||"ru").toLowerCase().replace("_","-").split("-")[0]; if(LANGUAGES[raw]) return raw; if(raw==="ua")return"uk"; if(raw==="cn")return"zh"; return"ru"; }
function getOutputText(response){
  if(typeof response?.output_text==="string") return response.output_text;
  for(const item of response?.output||[]){ if(item?.type!=="message")continue; for(const part of item?.content||[]) if(part?.type==="output_text"&&typeof part.text==="string") return part.text; }
  return "";
}
function clamp(n,min,max){ return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min; }
