"""Fit the tiny LogisticRegression head on frozen e5 embeddings (seconds on CPU).

Requires: sentence-transformers, torch, scikit-learn, and dataset splits from
build_dataset.py. Exits 0 with a message when the stack is unavailable so the
evaluation build stays green without the model.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

TRAIN = Path(__file__).resolve().parent / "data" / "processed" / "train.jsonl"
ARTIFACT = Path(__file__).resolve().parent / "artifacts" / "head.joblib"


def main() -> None:
    if not TRAIN.exists():
        print("No train split. Run: python -m ml.build_dataset")
        return
    try:
        from sentence_transformers import SentenceTransformer
        from sklearn.linear_model import LogisticRegression
        import joblib
    except Exception as error:
        print(f"Semantic training stack unavailable ({error}). Install P1 deps to enable.")
        return
    rows = [json.loads(line) for line in TRAIN.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not rows:
        print("Empty train split.")
        return
    model_name = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-small")
    embedder = SentenceTransformer(model_name)
    texts = [f"query: {row['text'][:1000]}" for row in rows]
    X = embedder.encode(texts, normalize_embeddings=True)
    y = [1 if row["label"] == "scam" else 0 for row in rows]
    clf = LogisticRegression(C=1.0, class_weight="balanced", max_iter=1000)
    clf.fit(X, y)
    ARTIFACT.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, ARTIFACT)
    print(f"Saved {ARTIFACT} ({len(rows)} rows)")


if __name__ == "__main__":
    main()
