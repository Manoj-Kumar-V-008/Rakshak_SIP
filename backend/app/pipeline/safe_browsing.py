"""Google Safe Browsing API v4 integration (P3).

Checks expanded URLs against Google's threat lists (malware, social
engineering / phishing, unwanted software). Requires a Google Safe Browsing
API key set as the SAFE_BROWSING_API_KEY environment variable.

Without a key, reputation checks are skipped gracefully and the pipeline
falls back to heuristic scoring only.

Privacy note: URLs are sent to Google Safe Browsing for lookup. Enable only
with user consent.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

SAFE_BROWSING_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"

THREAT_TYPES = [
    "MALWARE",
    "SOCIAL_ENGINEERING",
    "UNWANTED_SOFTWARE",
    "POTENTIALLY_HARMFUL_APPLICATION",
]

PLATFORM_TYPES = ["ANY_PLATFORM"]
THREAT_ENTRY_TYPES = ["URL"]


def is_available() -> bool:
    return bool(os.getenv("SAFE_BROWSING_API_KEY"))


def check_urls(urls: list[str], timeout_s: float = 10.0) -> dict[str, dict[str, Any]]:
    """Return a mapping of url -> threat match info, or {} if unavailable/no match."""
    if not is_available():
        return {}

    api_key = os.getenv("SAFE_BROWSING_API_KEY", "")
    payload = {
        "client": {"clientId": "rakshak-ai", "clientVersion": "1.0.0"},
        "threatInfo": {
            "threatTypes": THREAT_TYPES,
            "platformTypes": PLATFORM_TYPES,
            "threatEntryTypes": THREAT_ENTRY_TYPES,
            "threatEntries": [{"url": u} for u in urls],
        },
    }

    results: dict[str, dict[str, Any]] = {}
    try:
        with httpx.Client(timeout=timeout_s) as client:
            response = client.post(
                f"{SAFE_BROWSING_URL}?key={api_key}",
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            if response.status_code != 200:
                return {}
            data = response.json()
            for match in data.get("matches", []) or []:
                threat_entry = match.get("threat", {}) or {}
                url = threat_entry.get("url")
                if url:
                    results[url] = {
                        "threatType": match.get("threatType", "UNKNOWN"),
                        "platformType": match.get("platformType", "UNKNOWN"),
                        "threatEntryType": match.get("threatEntryType", "UNKNOWN"),
                        "cacheDuration": match.get("cacheDuration"),
                    }
    except Exception:
        # Network or parse failure - degrade gracefully.
        pass

    return results
