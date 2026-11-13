// FINSTAT Telegram Assistant v1: rule-based information only, zero PII storage.
// Webhook must be configured via Telegram setWebhook and protected by header secret.
import { timingSafeEqual } from "node:crypto";

const BASE = "https://api.telegram.org/bot";
const CHANNEL = "https://t.me/finstatpro";
const OWNER = "https://t.me/artemovasg";
const WA = "https://wa.me/79687700477";
const MAX_REQUEST_BYTES = 64_000;

function equalSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const menu = () => ({
  inline_keyboard: [
    [{ text: "Бухгалтерское обслуживание", callback_data: "accounting" }],
    [{ text: "Финансовый директор / CFO", callback_data: "cfo" }],
    [{ text: "Налоговые риски и диагностика", callback_data: "tax" }],
    [{ text: "ВЭД, импорт и маркетплейсы", callback_data: "trade" }],
    [{ text: "Family Office", callback_data: "family" }],
    [{ text: "Стоимость и заявка", callback_data: "prices" }],
    [{ text: "Связаться с FINSTAT", callback_data: "contact" }],
    [{ text: "Читать наш канал", url: CHANNEL }],
  ],
});

const contactKeyboard = () => ({
  inline_keyboard: [
    [{ text: "Написать в Telegram", url: OWNER }],
    [{ text: "Написать в WhatsApp", url: WA }],
    [{ text: "Вернуться к услугам", callback_data: "home" }],
  ],
});

const texts = {
  accounting: "Бухгалтерское сопровождение ООО и ИП: учёт, налоги, зарплата, отчётность. Объём и стоимость зависят от налогового режима, операций, работников и отрасли. Для первичной оценки напишите нам.",
  cfo: "FINSTAT CFO: движение денежных средств, платёжный календарь, бюджеты, управленческие отчёты и анализ прибыльности для собственника. Начинаем с оценки задач бизнеса.",
  tax: "Налоговая диагностика: проверка учёта, анализ возможных рисков и законных способов оптимизации. Налоговый совет зависит от документов, фактических операций и действующих норм; бот не даёт индивидуальных заключений.",
  trade: "Сопровождаем российский учёт импорта, операций с НДС и маркетплейсами. Помогаем сверять отчёты площадок и отражать комиссии, возвраты и закупки. Международные вопросы требуют отдельной проверки.",
  family: "FINSTAT Family Office — направление в разработке: учёт капитала, активов, обязательств, денежных потоков семьи и финансовая отчётность собственника. Обсудить запрос можно с основателем.",
  prices: "Стоимость определяется после короткого знакомства с бизнесом. При обращении к специалисту укажите: ООО или ИП, сферу деятельности, налоговый режим, количество работников и основную задачу. Не отправляйте в бот паспортные данные, выписки, документы или другие конфиденциальные материалы.",
  contact: "Свяжитесь с FINSTAT удобным способом: Telegram @artemovasg, WhatsApp +7 968 770-04-77 или почта info@proffofis.ru. Первичная оценка запроса без оплаты. Для коммерческого предложения уточним задачи и объём работ.",
};

async function telegram(method, payload, token) {
  const response = await fetch(BASE + token + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Telegram API HTTP " + response.status);
  const answer = await response.json();
  if (!answer.ok) throw new Error("Telegram API rejected method " + method);
  return answer;
}

function reply(chatId, text, token, keyboard) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: keyboard || menu(),
    link_preview_options: { is_disabled: true },
  }, token);
}

export default async function handler(request) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const token = process.env.FINSTAT_TELEGRAM_BOT_TOKEN;
  const secret = process.env.FINSTAT_TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) return new Response("Not configured", { status: 503 });
  if (!equalSecret(request.headers.get("x-telegram-bot-api-secret-token"), secret)) {
    return new Response("Forbidden", { status: 403 });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_REQUEST_BYTES) return new Response("OK", { status: 200 });
  let update;
  try { update = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }

  const callback = update?.callback_query;
  const message = update?.message;
  const chat = callback?.message?.chat || message?.chat;
  if (!chat || chat.type !== "private") return new Response("OK", { status: 200 });

  try {
    if (callback) {
      const action = callback.data;
      await telegram("answerCallbackQuery", { callback_query_id: callback.id }, token);
      if (action === "home") await reply(chat.id, "Выберите направление FINSTAT:", token);
      else if (Object.hasOwn(texts, action)) {
        await reply(chat.id, texts[action], token,
          action === "prices" || action === "contact" ? contactKeyboard() : {
            inline_keyboard: [
              [{ text: "Задать вопрос специалисту", url: OWNER }],
              [{ text: "Главное меню", callback_data: "home" }],
            ]
          });
      }
      return new Response("OK", { status: 200 });
    }
    const text = typeof message?.text === "string" ? message.text.trim() : "";
    if (!text) {
      await reply(chat.id, "Пожалуйста, используйте кнопки меню. Документы, фото и файлы бот не обрабатывает.", token);
    } else if (/^\/(start|help|services)(?:@\w+)?(?:\s.*)?$/i.test(text)) {
      await reply(chat.id, "Здравствуйте! Я FINSTAT Assistant. Помогу выбрать бухгалтерские и финансовые услуги. Я отвечаю по готовым правилам, не являюсь живым консультантом и не принимаю конфиденциальные документы.", token);
    } else {
      await reply(chat.id, "Спасибо за вопрос. Сейчас бот отвечает на типовые темы из меню. Для индивидуальной консультации и заявки напишите специалисту. Не присылайте сюда личные или финансовые документы.", token, contactKeyboard());
    }
    return new Response("OK", { status: 200 });
  } catch {
    // Keep Telegram token, message contents and personal data out of logs.
    return new Response("Temporary delivery failure", { status: 502 });
  }
}

export const config = { path: "/api/telegram" };
