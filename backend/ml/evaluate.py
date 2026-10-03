"""Three-config evaluation: rules-only vs semantic-only vs hybrid.

Runs on the curated golden regression set (or ml/data/processed/test.jsonl when
present). Semantic-only and hybrid show N/A when the embedding stack or head is
unavailable. This is a regression aid, not real-world accuracy evidence.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.pipeline import semantic as semantic_mod
from app.pipeline.normalize import detect_language
from app.pipeline.rules import analyze_text
from app.pipeline.runner import run_pipeline


ROOT = Path(__file__).resolve().parents[2]
CASES = ROOT / "shared" / "golden_cases.jsonl"


def level_for(score: float) -> str:
    return "safe" if score <= 20 else "suspicious" if score <= 60 else "danger"


def metrics_for(preds: list[bool], labels: list[bool]) -> dict[str, float]:
    tp = sum(1 for p, a in zip(preds, labels) if p and a)
    tn = sum(1 for p, a in zip(preds, labels) if not p and not a)
    fp = sum(1 for p, a in zip(preds, labels) if p and not a)
    fn = sum(1 for p, a in zip(preds, labels) if not p and a)
    precision = tp / max(1, tp + fp)
    recall = tp / max(1, tp + fn)
    return {
        "accuracy": (tp + tn) / max(1, len(preds)),
        "precision": precision,
        "recall": recall,
        "f1": 2 * precision * recall / max(1e-9, precision + recall) if (precision + recall) else 0.0,
        "fpr": fp / max(1, fp + tn),
        "tp": tp,
        "tn": tn,
        "fp": fp,
        "fn": fn,
    }


def main() -> None:
    source = CASES
    raw = [json.loads(line) for line in source.read_text(encoding="utf-8").splitlines() if line.strip()]
    cases = []
    for i, item in enumerate(raw):
        if "text" in item and "expectLevel" in item:
            cases.append(item)
        elif "text" in item and "label" in item:
            cases.append({"text": item["text"], "expectLevel": "safe" if item["label"] == "genuine" else "danger"})
        else:
            cases.append({"text": item.get("text", ""), "expectLevel": "safe"})
        cases[-1]["_lang"] = detect_language(cases[-1]["text"])
    labels = [c["expectLevel"] != "safe" for c in cases]

    rules_preds, rules_lat, type_correct, typed = [], [], 0, 0
    per_lang: dict[str, dict[str, int]] = {}
    for case in cases:
        result = analyze_text(case["text"])
        rules_lat.append(result.engine.latencyMs)
        pred = result.level != "safe"
        rules_preds.append(pred)
        actual = case["expectLevel"] != "safe"
        if actual and pred:
            pass
        lang = case["_lang"]
        entry = per_lang.setdefault(lang, {"n": 0, "correct": 0})
        entry["n"] += 1
        entry["correct"] += (pred == actual)
        if "expectType" in case:
            typed += 1
            type_correct += result.scamTypeId == case["expectType"]
    rules_m = metrics_for(rules_preds, labels)

    sem_available = semantic_mod.is_available()
    sem_preds: list[bool] | None = None
    sem_m = None
    if sem_available:
        sem_preds = []
        for case in cases:
            p = semantic_mod.score(case["text"]) or 0.0
            sem_preds.append(level_for(round(p * 100)) != "safe")
        sem_m = metrics_for(sem_preds, labels)

    hybrid_preds = []
    hybrid_lat = []
    for case in cases:
        result = run_pipeline(case["text"])
        hybrid_lat.append(result.engine.latencyMs)
        hybrid_preds.append(result.level != "safe")
    hybrid_m = metrics_for(hybrid_preds, labels)
    hybrid_is_fallback = not sem_available

    def row(name: str, m: dict[str, float] | None) -> str:
        if m is None:
            return f"| {name} | N/A (model unavailable) | — | — | — | — |"
        return f"| {name} | {m['accuracy']:.1%} | {m['precision']:.1%}/{m['recall']:.1%}/{m['f1']:.1%} | {m['fpr']:.1%} | TP={m['tp']} TN={m['tn']} FP={m['fp']} FN={m['fn']} |"

    ordered = sorted(rules_lat)
    p50 = ordered[len(ordered) // 2] if ordered else 0
    p95 = ordered[min(len(ordered) - 1, int(len(ordered) * 0.95))] if ordered else 0
    h_ordered = sorted(hybrid_lat)
    h_p50 = h_ordered[len(h_ordered) // 2] if h_ordered else 0
    h_p95 = h_ordered[min(len(h_ordered) - 1, int(len(h_ordered) * 0.95))] if h_ordered else 0

    print("# Evaluation: rules vs semantic vs hybrid (curated golden set)")
    print()
    print(f"- Source: {source.name}, cases: {len(cases)}")
    print(f"- Semantic stack: {'available' if sem_available else 'unavailable (install P1 deps + train head)'}")
    if hybrid_is_fallback:
        print("- Hybrid currently falls back to rules-only (no semantic).")
    print(f"- Scam-type accuracy (rules): {type_correct}/{typed} ({type_correct / max(1, typed):.1%})")
    print(f"- Latency rules p50/p95: {p50}/{p95} ms; hybrid p50/p95: {h_p50}/{h_p95} ms")
    print()
    print("| Config | Accuracy | P / R / F1 (scam) | FPR | Confusion |")
    print("| --- | --- | --- | --- | --- |")
    print(row("rules-only", rules_m))
    print(row("semantic-only", sem_m))
    print(row("hybrid", hybrid_m))
    print()
    print("| Lang | n | Correct (rules) |")
    print("| --- | --- | --- |")
    for lang in sorted(per_lang):
        entry = per_lang[lang]
        print(f"| {lang} | {entry['n']} | {entry['correct']}/{entry['n']} |")
    print()
    print("Small curated set with per-language n shown. Not a real-world benchmark; Tamil/Telugu claims need data.")


if __name__ == "__main__":
    main()
