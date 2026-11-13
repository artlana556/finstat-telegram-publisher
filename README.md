# FINSTAT Telegram Publisher (safe pilot)

Target channel: https://t.me/finstatpro

This repository is a standalone publishing service, separate from FINSTAT OS.

This pilot runs **only when the repository owner manually starts it** in GitHub Actions. There is no scheduled or automatic posting and no generative AI in the publication path. Text in telegram-posts/approved/ is reviewed before publishing.

## One-time setup
1. Add the Telegram bot FINSTAT Publisher as a channel admin with **post messages** permission only.
2. Open this repo → Settings → Secrets and variables → Actions → New repository secret.
3. Name: `FINSTAT_TELEGRAM_BOT_TOKEN`. Paste the BotFather token there. Never commit or send the token in chat.
4. Review the workflow and approved post files in this repository (already on the default branch `main`).
5. Open Actions → `FINSTAT - Publish approved Telegram post` → Run workflow. Leave the default post path, or specify another **approved .txt** file.

## Safety & limitations
- Manual click is explicit approval to publish. **Running twice sends two posts**.
- Draft tax guidance must be verified against official sources and approved before adding it to the approved folder.
- The script will only send to `@finstatpro`, never read subscribers or private messages.
- No paid AI or SaaS needed. GitHub Actions may consume included minutes on private repositories; watch usage to avoid charges.
- If the Telegram bot token was ever exposed, revoke it using BotFather and replace this repository secret.
