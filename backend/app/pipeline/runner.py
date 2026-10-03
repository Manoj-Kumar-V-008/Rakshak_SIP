"""Orchestrates normalize -> rules -> semantic -> fusion -> explain with real trace."""

from __future__ import annotations

import os
import time

from app.pipeline import fusion as fusion_mod
from app.pipeline import llm as llm_mod
from app.pipeline import semantic as semantic_mod
from app.pipeline.entities import extract_entities
from app.pipeline.normalize import detect_language, normalize_text
from app.pipeline.rules import RULES, TYPE_DETAILS, _type_for, rule_signals
from app.schemas import AnalysisResult, Engine, SubScores, TraceStep


def run_pipeline(text: str) -> AnalysisResult:
    started = time.perf_counter()
    normalized = normalize_text(text)
    lang = detect_language(normalized)

    t_rules = time.perf_counter()
    signals, benign, p_rules = rule_signals(normalized)
    rules_ms = round((time.perf_counter() - t_rules) * 1000)

    t_sem = time.perf_counter()
    p_semantic = semantic_mod.score(normalized)
    semantic_ms = round((time.perf_counter() - t_sem) * 1000)

    t_llm = time.perf_counter()
    p_llm, llm_type, llm_detail = llm_mod.score(normalized)
    llm_ms = round((time.perf_counter() - t_llm) * 1000)
    second = p_llm if p_llm is not None else p_semantic

    type_id = _type_for(signals)
    if p_llm is not None and llm_type and llm_type not in {"unverified", "safe"} and (type_id in {"unverified", "suspicious_link"} or abs(p_rules - p_llm) > 0.4):
        type_id = llm_type
    fused, risk_score, level = fusion_mod.fuse(p_rules, second, type_id, benign)

    categories = {
        category: sum(signal.weight for signal in signals if signal.category == category)
        for category in {"urgency", "impersonation", "coercion", "financial"}
    }
    details = TYPE_DETAILS[type_id]
    elapsed = round((time.perf_counter() - started) * 1000)
    indicator_labels = [signal.label for signal in signals] or (
        ["Recognised as a legitimate transactional or OTP message"] if benign else ["No strong known scam pattern found"]
    )
    if p_llm is not None and llm_detail and llm_detail != "skipped (no LLM key)":
        reason = llm_detail.split(None, 1)[-1] if " " in llm_detail else llm_detail
        indicator_labels = indicator_labels + [f"AI second opinion: {reason[:100]}"]
    if p_llm is not None:
        mode: str = "hybrid-llm"
        model = f"{llm_mod.provider()}/{os.getenv('RAKSHAK_LLM_MODEL', 'default')}"
    elif p_semantic is not None:
        mode = "hybrid"
        model = os.getenv("EMBED_MODEL", "multilingual-e5-small")
    else:
        mode = "rules-only"
        model = None
    trace = [
        TraceStep(stage="normalize", ms=0, detail=f"{len(normalized)} chars, lang={lang}"),
        TraceStep(stage="rules", ms=rules_ms, detail=f"{len(signals)} signals; rules score {round(p_rules * 100)}"),
        TraceStep(
            stage="semantic",
            ms=semantic_ms,
            detail=f"p(scam)={p_semantic:.2f}" if p_semantic is not None else "skipped (model unavailable)",
        ),
        TraceStep(stage="llm", ms=llm_ms, detail=llm_detail),
        TraceStep(stage="fusion", ms=0, detail=f"score {risk_score} → {level}"),
    ]
    return AnalysisResult(
        displayText=normalized,
        riskScore=risk_score,
        level=level,  # type: ignore[arg-type]
        scamTypeId=type_id,
        scamType=details[0],
        indicators=indicator_labels,
        remediationSteps=details[1],
        subScores=SubScores(
            **{key: min(100, round(value * 100)) for key, value in categories.items()},  # type: ignore[arg-type]
            financialAsk=min(100, round(categories["financial"] * 100)),
        ),
        signals=signals,
        entities=extract_entities(normalized),
        detectedLanguage=lang,
        scores={"rules": p_rules, "semantic": p_semantic, "llm": p_llm, "fused": fused},
        engine=Engine(mode=mode, model=model, rulesVersion=RULES["version"], latencyMs=elapsed),  # type: ignore[arg-type]
        trace=trace,
    )
