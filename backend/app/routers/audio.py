from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.asr import whisper_service
from app.pipeline.rules import analyze_text

router = APIRouter()

MAX_BYTES = 10 * 1024 * 1024
ALLOWED_SUFFIXES = {".m4a", ".wav", ".mp3", ".ogg", ".webm"}


@router.post("/v1/analyze/audio")
def analyze_audio(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=415, detail="UNSUPPORTED_AUDIO: use m4a/wav/mp3/ogg/webm")
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            total = 0
            while chunk := file.file.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_BYTES:
                    raise HTTPException(status_code=413, detail="UNSUPPORTED_AUDIO: file over 10 MB")
                tmp.write(chunk)
            tmp_path = Path(tmp.name)
    finally:
        try:
            file.file.close()
        except Exception:
            pass
    try:
        try:
            transcript, _lang = whisper_service.transcribe(tmp_path)
        except RuntimeError as error:
            raise HTTPException(status_code=503, detail=str(error)) from error
        if len(transcript.strip()) < 5:
            raise HTTPException(status_code=422, detail="TEXT_TOO_SHORT: no speech transcribed")
        result = analyze_text(transcript[:1000])
        result.transcript = transcript[:1000]
        return result
    finally:
        try:
            tmp_path.unlink(missing_ok=True)
        except Exception:
            pass
