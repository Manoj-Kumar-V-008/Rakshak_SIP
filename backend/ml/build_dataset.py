"""Build dataset.jsonl + train/test splits grouped by template_group.

Source of truth today is the curated golden set (23 cases). The full 400-row
synthetic + UCI ham stress set is the documented next step; this script already
implements dedupe + group split so that data can grow without code changes.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GOLDEN = ROOT / "shared" / "golden_cases.jsonl"
OUT_DIR = Path(__file__).resolve().parent / "data" / "processed"
ARTIFACT_SPLITS = OUT_DIR


def main() -> None:
    from app.pipeline.normalize import detect_language

    rows = []
    for i, line in enumerate(GOLDEN.read_text(encoding="utf-8").splitlines()):
        if not line.strip():
            continue
        case = json.loads(line)
        text = case["text"]
        rows.append(
            {
                "id": f"golden-{i}",
                "text": text,
                "label": "genuine" if case["expectLevel"] == "safe" else "scam",
                "scam_type": case.get("expectType", "safe" if case["expectLevel"] == "safe" else "unknown"),
                "lang": detect_language(text),
                "source": "curated",
                "template_group": f"golden-{i}",
            }
        )
    # Dedupe exact text duplicates.
    seen, unique = set(), []
    for row in rows:
        if row["text"] not in seen:
            seen.add(row["text"])
            unique.append(row)
    groups = sorted({row["template_group"] for row in unique})
    rng = random.Random(42)
    rng.shuffle(groups)
    split_at = max(1, int(len(groups) * 0.7))
    train_groups = set(groups[:split_at])
    train = [row for row in unique if row["template_group"] in train_groups]
    test = [row for row in unique if row["template_group"] not in train_groups]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "dataset.jsonl").write_text("\n".join(json.dumps(r) for r in unique), encoding="utf-8")
    (OUT_DIR / "train.jsonl").write_text("\n".join(json.dumps(r) for r in train), encoding="utf-8")
    (OUT_DIR / "test.jsonl").write_text("\n".join(json.dumps(r) for r in test), encoding="utf-8")
    print(f"dataset={len(unique)} train={len(train)} test={len(test)} (group split, seed 42)")
    print("NOTE: full 400-row synthetic + 500 ham UCI stress set pending (see build plan §7.1).")


if __name__ == "__main__":
    main()
