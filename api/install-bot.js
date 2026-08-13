import crypto from "node:crypto";

const DEFAULT_BASE = "https://trading-signal-miniapp-clean-vercel.vercel.app";

export default async function handler(req,res){
  if(req.method !== "GET") return res.status(405).json({ok:false,error:"method_not_allowed"});
  const token = process.env.BOT_TOKEN;
  if(!token) return res.status(503).json({ok:false,error:"bot_not_configured"});

  const base = process.env.MINIAPP_URL || DEFAULT_BASE;
  const webhookUrl = new URL("/api/bot",base).toString();
  const secret = crypto.createHash("sha256").update(`ai-signal-webhook:${token}`).digest("hex");

  try{
    const webhook = await telegram(token,"setWebhook",{
      url:webhookUrl,
      secret_token:secret,
      allowed_updates:["message","callback_query"],
      drop_pending_updates:false
    });
    const commands = await telegram(token,"setMyCommands",{
      commands:[
        {command:"start",description:"Start / Choose language"},
        {command:"language",description:"Change language"}
      ]
    });
    const menu = await telegram(token,"setChatMenuButton",{
      menu_button:{type:"web_app",text:"AI SIGNAL",web_app:{url:base}}
    });
    return res.status(200).json({ok:true,webhook:Boolean(webhook),commands:Boolean(commands),menu:Boolean(menu),webhook_url:webhookUrl});
  }catch(error){
    console.error("Bot installation failed",error?.message || error);
    return res.status(500).json({ok:false,error:"install_failed"});
  }
}

async function telegram(token,method,payload){
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
  });
  const data = await response.json().catch(()=>null);
  if(!response.ok || !data?.ok) throw new Error(`telegram_${method}_${response.status}`);
  return data.result;
}
