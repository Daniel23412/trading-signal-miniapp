const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;
const text = process.env.MENU_BUTTON_TEXT || "AI Сигнал";

if (!token || !webAppUrl) {
  console.error("Нужны BOT_TOKEN и WEBAPP_URL в переменных окружения.");
  process.exit(1);
}
if (!/^https:\/\//i.test(webAppUrl)) {
  console.error("WEBAPP_URL должен начинаться с https://");
  process.exit(1);
}

const api = `https://api.telegram.org/bot${token}`;
const response = await fetch(`${api}/setChatMenuButton`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    menu_button: {
      type: "web_app",
      text,
      web_app: { url: webAppUrl }
    }
  })
});
const data = await response.json();
if (!data.ok) {
  console.error(data);
  process.exit(1);
}
console.log(`Готово. Menu Button → ${text} → ${webAppUrl}`);
