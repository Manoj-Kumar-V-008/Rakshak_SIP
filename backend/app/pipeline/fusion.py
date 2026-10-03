"""Fusion of rule and semantic signals into a calibrated risk score (§6.4)."""

from __future__ import annotations

TYPE_FLOORS = {
    "digital_arrest": 85,
    "credential_phishing": 85,
    "utility_disconnection": 80,
    "lottery_prize": 80,
    "fake_job": 75,
    "investment_fraud": 75,
    "loan_harassment": 75,
    "malicious_app_or_hijack": 85,
    "suspicious_link": 0,
    "unverified": 0,
    "safe": 0,
}

W_RULES = 0.5
W_SEMANTIC = 0.5
BENIGN_CAP = 0.10
SAFE_MAX = 20
SUSPICIOUS_MAX = 60


def fuse(p_rules: float, p_semantic: float | None, scam_type_id: str, benign: bool) -> tuple[float, int, str]:
    """Combine signals. Returns (fused, riskScore, level)."""
    if p_semantic is None:
        fused = p_rules
    else:
        fused = W_RULES * p_rules + W_SEMANTIC * p_semantic
    floor = TYPE_FLOORS.get(scam_type_id, 0) / 100
    fused = max(fused, floor)
    if benign:
        fused = min(fused, BENIGN_CAP)
    if p_semantic is not None and abs(p_rules - p_semantic) > 0.6:
        fused = min(0.65, max(0.35, fused))
    fused = max(0.0, min(1.0, fused))
    risk = round(fused * 100)
    level = "safe" if risk <= SAFE_MAX else "suspicious" if risk <= SUSPICIOUS_MAX else "danger"
    return fused, risk, level
