# FINSTAT Assistant — бесплатный Telegram-бот для клиентов

Это **отдельный вебхук-бот**, не публикатор канала. Использует того же Telegram-бота и токен, что FINSTAT Publisher, но не запускает публикации в канал.

## Что умеет
- Меню услуг: бухгалтерия, CFO, налоги, ВЭД, маркетплейсы, Family Office (пока в разработке).
- Ответы на часто задаваемые вопросы по шаблону, ссылки на Telegram, WhatsApp, e-mail.
- **Не использует генеративную ИИ-модель**, не принимает и не сохраняет документы/паспорта/выписки.
- **Не собирает заявки в CRM и не пересылает текст вопросов администраторам**; клиент сам нажимает контактную ссылку. Такая функция появится только после отдельной настройки политики персональных данных и процесса согласия.
- Запуск и hosting на отдельном проекте Netlify Free, без изменения основного сайта proffofis.ru.

## Для владельца — однократное подключение
1. Netlify → Add new project → Import an existing project → GitHub → artlana556/finstat-telegram-publisher.
2. Build/publish берутся из `netlify.toml` (publish `public`, functions `netlify/functions`).
3. В Netlify этого проекта открыть Project configuration → Environment variables и добавить два значения с доступом к Functions:
   - `FINSTAT_TELEGRAM_BOT_TOKEN` — существующий токен из BotFather (копировать самостоятельно, не отправлять в чат).
   - `FINSTAT_TELEGRAM_WEBHOOK_SECRET` — длинный случайный ключ из латинских букв, цифр, дефиса или подчёркивания, уникальный для вебхука.
4. Сохранить и сделать **новый deploy**, чтобы функция получила переменные.
5. В GitHub → Settings → Secrets and variables → Actions добавить `FINSTAT_TELEGRAM_WEBHOOK_SECRET` с **тем же значением**.
6. В GitHub → Actions → FINSTAT - Configure Telegram assistant webhook → Run workflow → `https://<ваш-нетлифай-адрес>/api/telegram`.
7. Проверьте бот вручную: `/start` в личном диалоге с FINSTAT Publisher, нажмите кнопки.
8. Проверяйте расходы Netlify Free и не включайте платный тариф. Отдельный проект Netlify не должен заменять публичный сайт компании.

## Безопасность
- Никогда не пишите токен в GitHub-файл, сообщения ChatGPT, клиентский JavaScript и публичные формы.
- Если токен скомпрометирован, перевыпустите его в BotFather и обновите **GitHub и Netlify**.
- Webhook использует заголовок `X-Telegram-Bot-Api-Secret-Token`.
- GitHub Actions нужен лишь для однократной установки webhook. Он не создаёт платные рекламные кампании.
- Для полноценной обработки персональных данных и заявок потребуется отдельная политика, согласие и защищённая CRM.

## Бот не активен, пока не подключён webhook
Код в GitHub — ещё не работающая поддержка клиентов. После GitHub/Netlify настройки он станет доступен в личных сообщениях Telegram.
