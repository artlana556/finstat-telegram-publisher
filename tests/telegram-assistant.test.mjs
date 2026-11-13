import { test, after } from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/telegram-assistant.mjs";

const initialFetch = globalThis.fetch;
process.env.FINSTAT_TELEGRAM_BOT_TOKEN = "test-token-not-real";
process.env.FINSTAT_TELEGRAM_WEBHOOK_SECRET = "test-secret-for-webhook";
after(() => { globalThis.fetch = initialFetch; });

function request(update, secret = "test-secret-for-webhook") {
  return new Request("https://finstat.example/api/telegram", {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret },
    body: JSON.stringify(update),
  });
}
function mockApi() {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return new Response(JSON.stringify({ ok: true, result: {} }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };
  return calls;
}

test("rejects an incorrect webhook secret without contacting Telegram", async () => {
  const calls = mockApi();
  const res = await handler(request({ message: { chat: { id: 1, type: "private" }, text: "/start" } }, "wrong-secret"));
  assert.equal(res.status, 403);
  assert.equal(calls.length, 0);
});

test("shows service buttons on /start", async () => {
  const calls = mockApi();
  const res = await handler(request({ message: { chat: { id: 12, type: "private" }, text: "/start" } }));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith("/sendMessage"));
  const markup = calls[0].body.reply_markup.inline_keyboard;
  assert.ok(markup.some(row => row.some(button => button.callback_data === "family")));
  assert.ok(markup.some(row => row.some(button => button.callback_data === "prices")));
});

test("ignores group updates without making a Telegram request", async () => {
  const calls = mockApi();
  const res = await handler(request({ message: { chat: { id: -40, type: "supergroup" }, text: "hello" } }));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
});

test("replies to CFO service callback with factual text", async () => {
  const calls = mockApi();
  const res = await handler(request({
    callback_query: { id: "cb1", data: "cfo", message: { chat: { id: 42, type: "private" } } },
  }));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].url.endsWith("/answerCallbackQuery"));
  assert.match(calls[1].body.text, /FINSTAT CFO/);
});

test("unrecognized free text does not forward raw user data", async () => {
  const calls = mockApi();
  const res = await handler(request({ message: { chat: { id: 42, type: "private" }, text: "confidential client number 123" } }));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.doesNotMatch(calls[0].body.text, /confidential|123/);
  assert.ok(calls[0].body.reply_markup.inline_keyboard.flat().some(button => button.url === "https://t.me/artemovasg"));
});
