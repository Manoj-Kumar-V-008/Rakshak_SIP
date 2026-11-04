"""Server-side LLM second opinion (P1+). Gemini or NVIDIA NIM. Graceful None.

Set on the laptop before starting uvicorn:
  $env:RAKSHAK_LLM_PROVIDER="gemini"   # gemini | nim | openai | off
  $env:RAKSHAK_LLM_API_KEY="..."                # or GEMINI_API_KEY / GOOGLE_API_KEY / OPENAI_API_KEY / NVIDIA_API_KEY
  # optional: $env:RAKSHAK_LLM_MODEL="gemini-3.5-flash-lite" / "meta/llama-3.1-8b-instruct" / "gpt-4o-mini"

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


DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite"


def provider() -> str:
    provider_name = os.getenv("RAKSHAK_LLM_PROVIDER", "off").lower()
    if provider_name not in {"gemini", "nim", "off"} and any(
        os.getenv(name) for name in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY")
    ):
        return "gemini" if any(os.getenv(name) for name in ("GEMINI_API_KEY", "GOOGLE_API_KEY")) else "openai"
    return provider_name


def api_key_for(provider_name: str | None = None) -> str:
    selected = provider_name or provider()
    names = {
        "gemini": ("RAKSHAK_LLM_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"),
        "nim": ("RAKSHAK_LLM_API_KEY", "NVIDIA_API_KEY"),
        "openai": ("RAKSHAK_LLM_API_KEY", "OPENAI_API_KEY"),
    }
    for name in names.get(selected, ("RAKSHAK_LLM_API_KEY",)):
        value = os.getenv(name)
        if value:
            return value
    return ""


def default_model() -> str:
    selected = provider()
    if selected == "openai":
        return "gpt-4o-mini"
    return "meta/llama-3.1-8b-instruct" if selected == "nim" else DEFAULT_GEMINI_MODEL


def is_available(override_key: str | None = None) -> bool:
    if override_key:
        return True
    return provider() in {"gemini", "nim", "openai"} and bool(api_key_for())


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
    return _call_openai_compatible(url, api_key, model, message, timeout_s)


def _call_openai(api_key: str, model: str, message: str, timeout_s: float) -> str:
    return _call_openai_compatible("https://api.openai.com/v1/chat/completions", api_key, model, message, timeout_s)


def _call_openai_compatible(url: str, api_key: str, model: str, message: str, timeout_s: float) -> str:
    import httpx

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


def score(text: str, override_key: str | None = None) -> tuple[float | None, str | None, str]:
    """Return (p_llm, scam_type_or_None, detail). Never raises."""
    if not is_available(override_key):
        return None, None, "skipped (no LLM key)"
    prov = "gemini" if override_key else provider()
    api_key = override_key or api_key_for(prov)
    model = os.getenv("RAKSHAK_LLM_MODEL", default_model())
    try:
        timeout_s = float(os.getenv("RAKSHAK_LLM_TIMEOUT", "25"))
    except ValueError:
        timeout_s = 25.0
    try:
        if prov == "gemini":
            raw = _call_gemini(api_key, model, text, timeout_s)
        elif prov == "nim":
            raw = _call_nim(api_key, model, text, timeout_s)
        else:
            raw = _call_openai(api_key, model, text, timeout_s)
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
