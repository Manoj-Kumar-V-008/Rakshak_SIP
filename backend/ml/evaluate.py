"""Evaluate the rules engine against the curated golden regression set.

This is a regression/evaluation aid, not evidence of real-world accuracy. The
set is intentionally small and curated; report it as such in the presentation.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.pipeline.rules import analyze_text


ROOT = Path(__file__).resolve().parents[2]
CASES = ROOT / "shared" / "golden_cases.jsonl"


def main() -> None:
    cases = [json.loads(line) for line in CASES.read_text(encoding="utf-8").splitlines() if line.strip()]
    counts = {"tp": 0, "tn": 0, "fp": 0, "fn": 0, "type_correct": 0, "typed": 0}
    rows: list[str] = []
    for case in cases:
        result = analyze_text(case["text"])
        actual_scam = case["expectLevel"] != "safe"
        predicted_scam = result.level != "safe"
        if actual_scam and predicted_scam:
            counts["tp"] += 1
        elif not actual_scam and not predicted_scam:
            counts["tn"] += 1
        elif not actual_scam:
            counts["fp"] += 1
        else:
            counts["fn"] += 1
        if "expectType" in case:
            counts["typed"] += 1
            counts["type_correct"] += result.scamTypeId == case["expectType"]
        rows.append(f"| {case['expectLevel']} | {result.level} | {case.get('expectType', '—')} | {result.scamTypeId} |")

    precision = counts["tp"] / max(1, counts["tp"] + counts["fp"])
    recall = counts["tp"] / max(1, counts["tp"] + counts["fn"])
    fpr = counts["fp"] / max(1, counts["fp"] + counts["tn"])
    accuracy = (counts["tp"] + counts["tn"]) / len(cases)
    type_accuracy = counts["type_correct"] / max(1, counts["typed"])

    print("# Rules-engine evaluation (golden regression set)")
    print()
    print(f"- Cases: {len(cases)} curated messages")
    print(f"- Accuracy: {accuracy:.1%}; precision: {precision:.1%}; recall: {recall:.1%}; false-positive rate: {fpr:.1%}")
    print(f"- Scam-type accuracy: {type_accuracy:.1%} ({counts['type_correct']}/{counts['typed']})")
    print(f"- Confusion matrix: TP={counts['tp']}, TN={counts['tn']}, FP={counts['fp']}, FN={counts['fn']}")
    print()
    print("This is a small, hand-curated regression set. It does not establish real-world accuracy or multilingual performance.")
    print()
    print("| Expected level | Predicted level | Expected type | Predicted type |")
    print("| --- | --- | --- | --- |")
    print("\n".join(rows))


if __name__ == "__main__":
    main()
