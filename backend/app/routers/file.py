"""File analysis endpoint (P5 Phase 1).

Accepts base64-encoded file contents, computes SHA-256 hash, and checks
the hash against VirusTotal for reputation. Never uploads the full file
to third parties - only the hash is sent.

Endpoints:
  POST /v1/analyze/file - scan a file for malware/reputation
"""

from __future__ import annotations

import base64
import hashlib
import time
from typing import Any, Literal

from fastapi import APIRouter, HTTPException

from app.pipeline.virustotal import check_hash, compute_sha256, is_available, verdict_from_vt
from app.schemas import (
    FileAnalysisRequest,
    FileAnalysisResult,
    FileVerdict,
)

router = APIRouter()

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB max


def _heuristic_verdict(file_name: str, file_size: int) -> FileVerdict:
    """Fallback heuristic when VirusTotal is unavailable or hash not found."""
    reasons: list[str] = []
    score = 0

    lower = file_name.lower()
    dangerous_extensions = {
        ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js",
        ".jar", ".apk", ".ipa", ".dmg", ".pkg", ".deb", ".rpm",
    }
    suspicious_extensions = {".zip", ".rar", ".7z", ".doc", ".docx", ".xls", ".xlsx", ".pdf"}

    ext = lower.rsplit(".", 1)[-1] if "." in lower else ""
    ext = "." + ext

    if ext in dangerous_extensions:
        reasons.append("executable_extension")
        score += 40
    elif ext in suspicious_extensions:
        reasons.append("archive_or_document")
        score += 15

    if file_size > 50 * 1024 * 1024:
        reasons.append("oversized_file")
        score += 10

    if score >= 60:
        verdict: Literal["safe", "suspicious", "danger"] = "danger"
    elif score >= 30:
        verdict = "suspicious"
    else:
        verdict = "safe"

    return FileVerdict(verdict=verdict, riskScore=min(score, 100), reasons=reasons)


@router.post("/v1/analyze/file", response_model=FileAnalysisResult)
async def analyze_file(request: FileAnalysisRequest) -> FileAnalysisResult:
    started = time.perf_counter()

    # Decode base64 content.
    try:
        file_bytes = base64.b64decode(request.fileContentBase64)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid base64 content: {str(exc)}",
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max {MAX_FILE_SIZE // (1024 * 1024)}MB.",
        )

    file_hash = compute_sha256(file_bytes)
    elapsed_ms = round((time.perf_counter() - started) * 1000)

    # Check VirusTotal.
    vt_result = check_hash(file_hash) if is_available() else None
    vt_verdict = verdict_from_vt(vt_result)

    # Fallback to heuristics if VT unknown/unavailable.
    if vt_verdict["verdict"] == "unknown":
        heuristic = _heuristic_verdict(request.fileName, len(file_bytes))
        verdict = heuristic.verdict
        risk_score = heuristic.riskScore
        reasons = heuristic.reasons + ["virustotal_not_found"]
        reputation = None
    else:
        verdict = vt_verdict["verdict"]
        risk_score = vt_verdict["riskScore"]
        reasons = vt_verdict["reasons"]
        reputation = vt_verdict["reputation"]

    engine_mode = "virustotal" if is_available() else "heuristic-only"

    return FileAnalysisResult(
        fileName=request.fileName,
        fileSizeBytes=len(file_bytes),
        sha256=file_hash,
        verdict=FileVerdict(
            verdict=verdict,
            riskScore=risk_score,
            reasons=reasons,
            reputation=reputation,
        ),
        engine={"mode": engine_mode, "version": "1.0.0"},
        trace=[
            {"stage": "decode", "ms": round(elapsed_ms / 2), "detail": f"{len(file_bytes)} bytes"},
            {"stage": "hash", "ms": round(elapsed_ms / 2), "detail": f"sha256={file_hash[:12]}..."},
            {
                "stage": "reputation",
                "ms": 0,
                "detail": f"virustotal={'on' if is_available() else 'off'}",
            },
            {"stage": "score", "ms": 0, "detail": f"{verdict} ({risk_score}/100)"},
        ],
    )
