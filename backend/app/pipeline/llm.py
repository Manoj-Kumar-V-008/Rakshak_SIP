"""Server-side LLM second opinion (P1+). Gemini or NVIDIA NIM. Graceful None.

Set on the laptop before starting uvicorn:
  $env:RAKSHAK_LLM_PROVIDER="gemini"   # gemini | nim | off
  $env:RAKSHAK_LLM_API_KEY="..."
  # optional: $env:RAKSHAK_LLM_MODEL="gemini-1.5-flash" / "meta/llama-3.1-8b-instruct"

Without a key the pipeline stays rules-only (or e5 hybrid). Offline mode never
calls the cloud. When enabled, the scanned text IS sent to the provider.
"""

from __future__ import annotations

import json
import os
import re

KNOWN_TYPES = {
    "digital_arrest",
    "credential_phishing",
    "utility_disconnection",
    "lottery_prize",
    "fake_job",
    "investment_fraud",
    "loan_harassment",
    "malicious_app_or_hijack",
    "suspicious_link",
    "unverified",
    "safe",
}

PROMPT = (
    "You score scam messages for an Indian fraud-awareness app. Reply with STRICT JSON only: "
    '{"p_scam": 0.0-1.0, "scam_type": "<one of digital_arrest, credential_phishing, utility_disconnection, '
    "lottery_prize, fake_job, investment_fraud, loan_harassment, malicious_app_or_hijack, suspicious_link, "
    'unverified, safe>", "reason": "<under 20 words>"}. '
    "p_scam is the probability this is a scam. Genuine OTP/bank alerts and ordinary chat are safe (p under 0.2). "
    "Message: "
)


def provider() -> str:
    return os.getenv("RAKSHAK_LLM_PROVIDER", "off").lower()


def is_available() -> bool:
    return provider() in {"gemini", "nim"} and bool(os.getenv("RAKSHAK_LLM_API_KEY"))


def _parse_json(text: str) -> dict | None:
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group())
        except Exception:
            return None


def _call_gemini(api_key: str, model: str, message: str, timeout_s: float) -> str:
    import httpx

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": PROMPT + message[:800]}]}], "generationConfig": {"temperature": 0.0, "maxOutputTokens": 200}}
    with httpx.Client(timeout=timeout_s) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
    parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts if isinstance(part, dict))


def _call_nim(api_key: str, model: str, message: str, timeout_s: float) -> str:
    import httpx

    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Reply with strict JSON only."},
            {"role": "user", "content": PROMPT + message[:800]},
        ],
        "temperature": 0.0,
        "max_tokens": 200,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    with httpx.Client(timeout=timeout_s) as client:
        response = client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
    choices = data.get("choices") or [{}]
    return ((choices[0].get("message") or {}).get("content")) or ""


def score(text: str) -> tuple[float | None, str | None, str]:
    """Return (p_llm, scam_type_or_None, detail). Never raises."""
    if not is_available():
        return None, None, "skipped (no LLM key)"
    prov = provider()
    api_key = os.getenv("RAKSHAK_LLM_API_KEY", "")
    default_model = "gemini-3.5-flash-lite" if prov == "gemini" else "meta/llama-3.1-8b-instruct"
    model = os.getenv("RAKSHAK_LLM_MODEL", default_model)
    try:
        timeout_s = float(os.getenv("RAKSHAK_LLM_TIMEOUT", "12"))
    except ValueError:
        timeout_s = 12.0
    try:
        raw = _call_gemini(api_key, model, text, timeout_s) if prov == "gemini" else _call_nim(api_key, model, text, timeout_s)
        parsed = _parse_json(raw)
        if not parsed:
            return None, None, "unparseable LLM reply"
        p = max(0.0, min(1.0, float(parsed.get("p_scam", -1))))
        if p < 0:
            return None, None, "bad p_scam"
        scam_type = str(parsed.get("scam_type", "unverified"))
        if scam_type not in KNOWN_TYPES:
            scam_type = "unverified"
        reason = str(parsed.get("reason", ""))[:120]
        return p, scam_type, f"{prov}/{model}: p={p:.2f} {scam_type} {reason}".strip()
    except Exception as error:
        return None, None, f"LLM error: {str(error)[:100]}"
