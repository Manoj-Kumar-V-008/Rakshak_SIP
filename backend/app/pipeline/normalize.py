from __future__ import annotations

import re
import unicodedata


def normalize_text(text: str) -> str:
    """Make matching stable without changing the text returned to the client."""
    normalized = unicodedata.normalize("NFKC", text)
    normalized = re.sub(r"[\u200b-\u200d\ufeff]", "", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def detect_language(text: str) -> str:
    if re.search(r"[\u0900-\u097f]", text):
        return "hi"
    if re.search(r"[\u0c80-\u0cff]", text):
        return "kn"
    if re.search(r"\b(aap|hai|hain|turant|paise|karo|mat)\b", text, re.IGNORECASE):
        return "hinglish"
    return "en"
