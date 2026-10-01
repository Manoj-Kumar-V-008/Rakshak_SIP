from __future__ import annotations

import re

URL_RE = re.compile(r"(?:https?://|www\.)[^\s<>]+", re.IGNORECASE)
PHONE_RE = re.compile(r"(?<!\d)(?:\+91[- ]?)?[6-9]\d{9}(?!\d)")
AMOUNT_RE = re.compile(r"(?:₹|Rs\.?|INR)\s?\d[​\d,]*(?:\.\d{1,2})?", re.IGNORECASE)


def extract_entities(text: str) -> dict[str, list[str]]:
    return {
        "urls": URL_RE.findall(text),
        "phones": PHONE_RE.findall(text),
        "amounts": AMOUNT_RE.findall(text),
    }
