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


def analyze_text(text: str) -> AnalysisResult:
    import time

    started = time.perf_counter()
    normalized = normalize_text(text)
    signals: list[Signal] = []
    for definition in RULES["signals"]:
        found: list[Match] = []
        for pattern in definition["patterns"]:
            found.extend(_matches(pattern, normalized))
        if found:
            signals.append(Signal(id=definition["id"], label=definition["label"], category=definition["category"], weight=definition["weight"], matches=found))

    benign = any(re.search(pattern, normalized, re.IGNORECASE) for pattern in RULES["benignPatterns"])
    score = _risk(signals)
    if benign:
        score = min(score, 10)
        signals = []
    type_id = _type_for(signals)
    if score <= 20:
        level = "safe"
    elif score <= 60:
        level = "suspicious"
    else:
        level = "danger"
    categories = {category: sum(signal.weight for signal in signals if signal.category == category) for category in {"urgency", "impersonation", "coercion", "financial"}}
    details = TYPE_DETAILS[type_id]
    elapsed = round((time.perf_counter() - started) * 1000)
    indicator_labels = [signal.label for signal in signals] or (["Recognised as a legitimate transactional or OTP message"] if benign else ["No strong known scam pattern found"])
    return AnalysisResult(
        displayText=normalized, riskScore=score, level=level, scamTypeId=type_id, scamType=details[0],
        indicators=indicator_labels, remediationSteps=details[1], subScores=SubScores(**{key: min(100, round(value * 100)) for key, value in categories.items()}, financialAsk=min(100, round(categories["financial"] * 100))),
        signals=signals, entities=extract_entities(normalized), detectedLanguage=detect_language(normalized),
        scores={"rules": score / 100, "semantic": None, "fused": score / 100}, engine=Engine(rulesVersion=RULES["version"], latencyMs=elapsed),
        trace=[TraceStep(stage="normalize", ms=0, detail=f"{len(normalized)} chars, lang={detect_language(normalized)}"), TraceStep(stage="rules", ms=elapsed, detail=f"{len(signals)} signals; rules score {score}")],
    )
