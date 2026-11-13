#!/usr/bin/env python3
"""Publish a manually approved FINSTAT Telegram post. No third-party Python packages."""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APPROVED = (ROOT / "telegram-posts" / "approved").resolve()


def main() -> int:
    supplied = os.getenv("POST_FILE", "")
    candidate = (ROOT / supplied).resolve()
    if not supplied or not candidate.is_relative_to(APPROVED) or candidate.suffix != ".txt":
        print("Only .txt files inside telegram-posts/approved/ may be published.", file=sys.stderr)
        return 2
    if not candidate.is_file():
        print("Approved post file not found.", file=sys.stderr)
        return 2

    message = candidate.read_text(encoding="utf-8").strip()
    if not message or len(message) > 4096:
        print("Post must contain between 1 and 4096 characters.", file=sys.stderr)
        return 2

    token = os.getenv("FINSTAT_TELEGRAM_BOT_TOKEN", "").strip()
    channel = os.getenv("TELEGRAM_CHANNEL", "@finstatpro")
    if not token:
        print("Missing FINSTAT_TELEGRAM_BOT_TOKEN repository secret.", file=sys.stderr)
        return 2
    if channel != "@finstatpro":
        print("Unexpected target channel; refusing to publish.", file=sys.stderr)
        return 2

    payload = urllib.parse.urlencode({
        "chat_id": channel,
        "text": message,
        "disable_web_page_preview": "true",
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://api.telegram.org/bot" + token + "/sendMessage",
        data=payload,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            result = json.loads(response.read().decode("utf-8"))
        if not result.get("ok"):
            print("Telegram did not confirm delivery.", file=sys.stderr)
            return 1
        print("Telegram post sent to @finstatpro; message ID:", result.get("result", {}).get("message_id", "unknown"))
        return 0
    except urllib.error.HTTPError as err:
        print("Telegram rejected publication (HTTP status %s)." % err.code, file=sys.stderr)
        return 1
    except Exception:
        print("Publication failed; check bot permissions or network access.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
