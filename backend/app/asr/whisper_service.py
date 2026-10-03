"""Audio transcription: local faster-whisper, else Gemini cloud fallback.

Priority: faster-whisper (free, no cloud) -> Gemini cloud (needs
RAKSHAK_LLM_PROVIDER=gemini + RAKSHAK_LLM_API_KEY) -> MODEL_NOT_READY.
Set ASR_ENABLED=false to force off (default on). The Whisper model downloads
on first use, so pre-run the server once with internet before the demo — or
just set the Gemini key and skip the 500 MB download entirely.
"""

from __future__ import annotations

import base64
import os
from pathlib import Path

_model = None
_load_error: str | None = None

_MIME = {".m4a": "audio/mp4", ".mp3": "audio/mp3", ".wav": "audio/wav", ".ogg": "audio/ogg", ".webm": "audio/webm"}


def _whisper_present() -> bool:
    try:
        import faster_whisper  # noqa: F401
    except Exception as error:
        global _load_error
        _load_error = str(error)
        return False
    return True


def _gemini_ready() -> bool:
    return os.getenv("RAKSHAK_LLM_PROVIDER", "off").lower() == "gemini" and bool(os.getenv("RAKSHAK_LLM_API_KEY"))


def is_available() -> bool:
    if os.getenv("ASR_ENABLED", "true").lower() in {"0", "false", "off", "no"}:
        return False
    return _whisper_present() or _gemini_ready()


def _transcribe_gemini(path: Path) -> str:
    import httpx

    api_key = os.getenv("RAKSHAK_LLM_API_KEY", "")
    # Default matches the app explainer model, which is known-accessible.
    # The 2.x models 404 for keys without prior 2.x usage.
    model = os.getenv("RAKSHAK_TRANSCRIBE_MODEL", "gemini-3.5-flash-lite")
    raw = path.read_bytes()
    b64 = base64.b64encode(raw).decode()
    mime = _MIME.get(path.suffix.lower(), "audio/mp4")
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "Transcribe this audio clip verbatim in its original language. Reply with the transcription text only, no commentary."},
                    {"inline_data": {"mime_type": mime, "data": b64}},
                ]
            }
        ],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 1000},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    with httpx.Client(timeout=60.0) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
    parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts if isinstance(part, dict)).strip()


def transcribe(path: Path) -> tuple[str, str]:
    """Transcribe an audio file to (text, language). Raises RuntimeError if unavailable."""
    global _model
    if os.getenv("ASR_ENABLED", "true").lower() in {"0", "false", "off", "no"}:
        raise RuntimeError("MODEL_NOT_READY: transcription disabled (ASR_ENABLED=false)")
    if _whisper_present():
        from faster_whisper import WhisperModel

        model_name = os.getenv("WHISPER_MODEL", "small")
        if _model is None:
            _model = WhisperModel(model_name, device="cpu", compute_type="int8")
        segments, info = _model.transcribe(str(path), beam_size=1, vad_filter=True)
        text = "".join(segment.text for segment in segments).strip()
        return text, getattr(info, "language", "en") or "en"
    if _gemini_ready():
        from app.pipeline.normalize import detect_language

        try:
            text = _transcribe_gemini(path)
        except Exception as error:
            raise RuntimeError(f"MODEL_NOT_READY: Gemini transcription failed ({str(error)[:150]})") from error
        if not text:
            raise RuntimeError("MODEL_NOT_READY: Gemini returned an empty transcription")
        return text, detect_language(text)
    raise RuntimeError(
        "MODEL_NOT_READY: no transcription backend "
        f"({_load_error or 'faster-whisper not installed'}; set RAKSHAK_LLM_PROVIDER=gemini + key for cloud fallback)"
    )
