#!/usr/bin/env python3
"""Manually register the Netlify HTTPS endpoint as a Telegram webhook.
Never prints API tokens or webhook secret.
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from urllib.parse import urlparse

token = os.getenv("FINSTAT_TELEGRAM_BOT_TOKEN", "").strip()
secret = os.getenv("FINSTAT_TELEGRAM_WEBHOOK_SECRET", "").strip()
url = os.getenv("WEBHOOK_URL", "").strip()
u = urlparse(url)
if not token or not secret or u.scheme != "https" or not u.netloc or u.path != "/api/telegram":
    sys.exit("Missing secrets or invalid HTTPS webhook endpoint (expected /api/telegram).")
if not (1 <= len(secret) <= 256) or not all(ch.isalnum() or ch in "_-" for ch in secret):
    sys.exit("Webhook secret must be 1-256 characters: letters, digits, hyphen or underscore.")

params = urllib.parse.urlencode({
    "url": url,
    "secret_token": secret,
    "allowed_updates": json.dumps(["message", "callback_query"]),
    "drop_pending_updates": "true",
}).encode()
req = urllib.request.Request("https://api.telegram.org/bot" + token + "/setWebhook", data=params, method="POST")
try:
    with urllib.request.urlopen(req, timeout=25) as r:
        payload = json.loads(r.read())
    if not payload.get("ok"):
        sys.exit("Telegram rejected webhook configuration.")
    print("Webhook successfully configured for FINSTAT Assistant.")
except Exception:
    sys.exit("Webhook setup failed; check URL, secrets and deployment.")
