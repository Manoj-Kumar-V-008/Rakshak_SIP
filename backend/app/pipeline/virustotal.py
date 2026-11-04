"""VirusTotal file reputation lookup (P5 Phase 1).

Checks file SHA-256 hashes against VirusTotal's threat intelligence.
Does NOT upload file contents - only the hash is sent, preserving privacy.

Requires VIRUSTOTAL_API_KEY environment variable. Without a key, checks are
skipped gracefully and the pipeline falls back to heuristic scoring only.
"""

from __future__ import annotations

import hashlib
import os
from typing import Any

import httpx

VT_API_URL = "https://www.virustotal.com/api/v3"


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def is_available() -> bool:
    return bool(os.getenv("VIRUSTOTAL_API_KEY"))


def check_hash(file_hash: str) -> dict[str, Any] | None:
    """Look up a file hash on VirusTotal.

    Returns a dict with scan stats, or None if unavailable/not found/error.
    """
    if not is_available():
        return None

    api_key = os.getenv("VIRUSTOTAL_API_KEY", "")
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(
                f"{VT_API_URL}/files/{file_hash}",
                headers={"x-apikey": api_key},
            )
            if response.status_code == 404:
                return {"found": False}
            if response.status_code != 200:
                return None
            data = response.json()
            attributes = data.get("data", {}).get("attributes", {})
            stats = attributes.get("last_analysis_stats", {})
            malicious = int(stats.get("malicious", 0))
            suspicious = int(stats.get("suspicious", 0))
            harmless = int(stats.get("harmless", 0))
            undetected = int(stats.get("undetected", 0))
            return {
                "found": True,
                "malicious": malicious,
                "suspicious": suspicious,
                "harmless": harmless,
                "undetected": undetected,
                "total": malicious + suspicious + harmless + undetected,
                "reputation": int(attributes.get("reputation", 0)),
            }
    except Exception:
        # Network or parse failure - degrade gracefully.
        return None


def verdict_from_vt(result: dict[str, Any] | None) -> dict[str, Any]:
    """Convert VirusTotal result into a Rakshak verdict."""
    if not result or not result.get("found"):
        return {
            "verdict": "unknown",
            "riskScore": 0,
            "reasons": ["not_in_virustotal"],
            "reputation": result or {},
        }

    malicious = result.get("malicious", 0)
    suspicious = result.get("suspicious", 0)

    if malicious > 0:
        return {
            "verdict": "danger",
            "riskScore": min(100, 50 + malicious * 10),
            "reasons": [f"virustotal_malicious_{malicious}"],
            "reputation": result,
        }
    if suspicious > 0:
        return {
            "verdict": "suspicious",
            "riskScore": min(100, 30 + suspicious * 5),
            "reasons": [f"virustotal_suspicious_{suspicious}"],
            "reputation": result,
        }
    return {
        "verdict": "safe",
        "riskScore": 0,
        "reasons": ["virustotal_clean"],
        "reputation": result,
    }
