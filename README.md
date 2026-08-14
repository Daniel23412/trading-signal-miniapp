# AI Trading Signal — Telegram Mini App

Готовый MVP Telegram Mini App: пользователь загружает скрин торгового графика, выбирает таймфрейм и длительность сделки, а сервер отправляет изображение в OpenAI Vision и возвращает один из трёх результатов:

- `ВВЕРХ`
- `ВНИЗ`
- `НЕТ СИГНАЛА`

При слабой уверенности или плохом качестве скрина сервер принудительно переводит результат в `НЕТ СИГНАЛА`.

## Что внутри

- чистый HTML/CSS/JS в корне проекта — быстрый Mini App без тяжёлого фронтенд-фреймворка;
- Vercel serverless API `/api/analyze`;
- OpenAI Responses API + image input + Structured Outputs;
- модель по умолчанию: `gpt-5.6-luna`;
- изображения не сохраняются в базе или на диске;
- `store: false` для OpenAI Responses API;
- проверка подписи `Telegram.WebApp.initData` на сервере;
- клиентское сжатие скрина перед отправкой;
- загрузка файлом, drag & drop и вставка изображения из буфера;
- haptic feedback внутри Telegram;
- порог уверенности задаётся через `MIN_CONFIDENCE`.
- отдельный quality gate проверяет читаемость, свечи и таймфрейм до направления;
- выбранный язык, GEO, источник, регистрация и первый депозит синхронизируются через Railway Postgres;
- история последних трёх анализов живёт только в памяти вкладки и не содержит изображений;
- Telegram-админка: `/stats`, `/today`, `/user <telegram_id>`;
- одно мягкое follow-up сообщение после регистрации без депозита (Vercel Cron).

## 1. Создать Telegram-бота

1. Открой `@BotFather`.
2. Выполни `/newbot`.
3. Сохрани токен — это `BOT_TOKEN`.

## 2. Получить OpenAI API key

Создай API key в OpenAI Platform. Он должен храниться только на сервере в `OPENAI_API_KEY`.

## 3. Задеплоить на Vercel

Можно загрузить папку в GitHub и импортировать репозиторий в Vercel.

Для этого проекта в Vercel оставь:

- Framework Preset: `Other`;
- Root Directory: корень репозитория (`./`, не `api` и не `public`);
- Build Command: пусто / Default;
- Output Directory: пусто / Default.

`/api/analyze.js` определяется Vercel автоматически как Function. В `vercel.json` специально нет ручного `functions`-паттерна, чтобы не ловить ошибку `unmatched-function-pattern`.

В Vercel → Project → Settings → Environment Variables добавь:

```env
OPENAI_API_KEY=sk-...
BOT_TOKEN=123456789:AA...
OPENAI_MODEL=gpt-5.6-luna
MIN_CONFIDENCE=72
REQUIRE_TELEGRAM_AUTH=true
TELEGRAM_AUTH_MAX_AGE_SECONDS=86400
REQUIRE_DEPOSIT_ACCESS=true
MIN_DEPOSIT_AMOUNT=5
DATABASE_URL=postgresql://...
POSTBACK_SECRET=replace-with-a-long-random-secret
INSTALL_SECRET=replace-with-a-different-long-random-secret
AFFILIATE_REF_URL=https://lkus.cc/f6f3ab
MINIAPP_URL=https://trading-signal-miniapp-clean-vercel.vercel.app
POSTBACK_LOG_CHAT_ID=123456789
ADMIN_TELEGRAM_IDS=123456789
FOLLOWUP_DELAY_HOURS=6
CRON_SECRET=replace-with-a-long-random-secret
```

Опциональные GEO-настройки:

```env
# Если список пуст, разрешены все определённые и неопределённые GEO.
ALLOWED_GEO_COUNTRIES=DE,FR,IT,ES,BR

# Разные офферы по стране; ключ default используется как fallback.
AFFILIATE_REF_URLS={"DE":"https://example.com/de","BR":"https://example.com/br","default":"https://example.com"}
```

При отсутствующем или служебном GEO (`XX`, `ZZ`, proxy-заглушки) система не угадывает страну: в логе будет
`GEO: не определено`, а язык берётся из сохранённого выбора или Telegram.

После деплоя получишь адрес вида:

```text
https://your-project.vercel.app
```

## 4. Подключить Mini App в Telegram

Самый удобный вариант — в `@BotFather` настроить **Main Mini App** и указать HTTPS-адрес Vercel.

Также можно установить Menu Button через BotFather или скриптом из проекта.

Пример в PowerShell:

```powershell
$env:BOT_TOKEN="123456789:AA..."
$env:WEBAPP_URL="https://your-project.vercel.app"
node scripts/set-webapp-menu.mjs
```

После этого в чате с ботом появится кнопка, открывающая приложение.

После установки webhook доступны пользовательские команды `/start`, `/language`. Для ID из
`ADMIN_TELEGRAM_IDS` доступны `/stats`, `/today` и `/user 867371536`. Если лог пишется в группу,
команды также разрешены администраторам этой группы.

В production также есть защищённый одноразовый установщик webhook. Он работает только с
`INSTALL_SECRET` (или с `POSTBACK_SECRET`, если отдельный секрет не задан):

```text
https://your-project.vercel.app/api/install-bot?secret=YOUR_INSTALL_SECRET
```

Не публикуй эту ссылку и не передавай секрет пользователям.

Vercel Cron вызывает `/api/follow-up` ежедневно и передаёт `CRON_SECRET` в заголовке Authorization.
Каждому пользователю отправляется не более одного напоминания; кнопка «не напоминать» отключает его до
следующего явного изменения в базе.

## Локальный тест

По умолчанию API принимает запросы только из настоящего Telegram Mini App. Для локальной проверки можно временно выставить:

```env
REQUIRE_TELEGRAM_AUTH=false
```

Не оставляй этот режим на публичном production-домене — иначе посторонние смогут расходовать твой OpenAI API баланс.

Запуск через Vercel CLI:

```bash
npm run dev
```

## Настройки

### Более дешёвая/быстрая модель

По умолчанию уже используется:

```env
OPENAI_MODEL=gpt-5.6-luna
```

Модель можно заменить переменной окружения без изменения кода.

### Порог сигнала

```env
MIN_CONFIDENCE=72
```

Если модель вернула меньше этого значения, сервер автоматически показывает `НЕТ СИГНАЛА`, даже если модель выбрала `UP` или `DOWN`.

Рекомендуемый диапазон для тестов: 70–85. Сначала измерь фактические результаты на демо/истории, а не подбирай порог по ощущениям.

## Важно про точность

Скриншот не содержит полного рыночного контекста. `confidence` — внутренняя оценка модели, а не математическая вероятность успешной сделки. Перед любым реальным использованием нужно собрать датасет сигналов и отдельно измерить hit rate по каждому таймфрейму/активу/длительности.
