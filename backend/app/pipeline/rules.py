from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any

from app.pipeline.entities import extract_entities
from app.pipeline.normalize import detect_language, normalize_text
from app.schemas import AnalysisResult, Engine, Match, Signal, SubScores, TraceStep

ROOT = Path(__file__).resolve().parents[3]
RULES = json.loads((ROOT / "shared" / "rules.json").read_text(encoding="utf-8"))

TYPE_DETAILS = {
    "digital_arrest": ("Digital Arrest Scam", ["Disconnect immediately; real police do not investigate over a video call.", "Call 1930 to report the attempt."]),
    "credential_phishing": ("Credential Phishing", ["Do not share OTP, PIN, CVV, or passwords.", "Contact the organisation using its official website or number."]),
    "utility_disconnection": ("Utility Disconnection Fraud", ["Do not call the number in the message.", "Verify your bill through the utility's official channel."]),
    "lottery_prize": ("Lottery or Prize Scam", ["Do not pay a fee to claim a prize.", "Block and report the sender."]),
    "fake_job": ("Fake Job Scam", ["Do not pay deposits for online tasks or jobs.", "Verify employers through official channels."]),
    "investment_fraud": ("Investment Fraud", ["Do not transfer money for guaranteed returns.", "Use a registered financial adviser before investing."]),
    "loan_harassment": ("Loan Harassment Scam", ["Do not be pressured into payment through an unknown contact.", "Contact your lender through its official support channel."]),
    "malicious_app_or_hijack": ("Malicious App or Call Hijack", ["Do not install the app or dial the code.", "Disconnect and contact your telecom provider if you already acted."]),
    "suspicious_link": ("Suspicious Link", ["Do not open or forward an unfamiliar shortened link.", "Verify the sender before taking action."]),
    "unverified": ("No Strong Scam Signals", ["No high-risk pattern was found.", "Continue to avoid sharing credentials with unverified contacts."]),
}

TYPE_SIGNALS = {
    "digital_arrest": {"authority_impersonation", "legal_threat", "secrecy_isolation"},
    "credential_phishing": {"credential_request"}, "utility_disconnection": {"utility_disconnect"},
    "lottery_prize": {"prize_claim"}, "fake_job": {"task_job_offer"},
    "investment_fraud": {"investment_guarantee"}, "loan_harassment": {"loan_harassment"},
    "malicious_app_or_hijack": {"malicious_app"}, "suspicious_link": {"shortened_link"},
}


def _matches(pattern: str, text: str) -> list[Match]:
    return [Match(start=match.start(), end=match.end(), text=match.group()) for match in re.finditer(pattern, text, re.IGNORECASE)]


def _risk(signals: list[Signal]) -> int:
    if not signals:
        return 0
    probability = 1 - math.prod(1 - signal.weight for signal in signals)
    return round(probability * 100)


def _type_for(signals: list[Signal]) -> str:
    signal_ids = {signal.id for signal in signals}
    best_type, best_score = "unverified", 0
    for type_id, type_signals in TYPE_SIGNALS.items():
        score = sum(signal.weight for signal in signals if signal.id in type_signals)
        if score > best_score:
            best_type, best_score = type_id, score
    if {"authority_impersonation", "legal_threat"}.issubset(signal_ids):
        return "digital_arrest"
    return best_type


def rule_signals(normalized: str) -> tuple[list[Signal], bool, float]:
    """Shared rule matching used by the runner and evaluators. Returns (signals, benign, p_rules)."""
    signals: list[Signal] = []
    for definition in RULES["signals"]:
        found: list[Match] = []
        for pattern in definition["patterns"]:
            found.extend(_matches(pattern, normalized))
        if found:
            signals.append(Signal(id=definition["id"], label=definition["label"], category=definition["category"], weight=definition["weight"], matches=found))
    benign = any(re.search(pattern, normalized, re.IGNORECASE) for pattern in RULES["benignPatterns"])
    probability = 0.0 if not signals else float(1 - math.prod(1 - signal.weight for signal in signals))
    if benign:
        return [], True, probability
    return signals, False, probability


def analyze_text(text: str) -> AnalysisResult:
    # Thin wrapper so existing imports keep working; real orchestration lives in runner.py.
    from app.pipeline.runner import run_pipeline

    return run_pipeline(text)
