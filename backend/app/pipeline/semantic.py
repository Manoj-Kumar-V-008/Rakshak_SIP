"""Frozen multilingual semantic scorer (P1). Graceful None when unavailable.

Uses intfloat/multilingual-e5-small (frozen) + LogisticRegression head on
frozen embeddings. Same interface p(scam) with two modes:
- head: embed train split -> LogReg -> head.joblib (preferred)
- prototype: cosine to hand-written scam prototypes (zero-training fallback,
  SEMANTIC_MODE=prototype)
"""

from __future__ import annotations

import os
from pathlib import Path

_embedder = None
_head = None
_prototype_embs = None

PROTOTYPES = [
    "You are under digital arrest. Stay on video call and transfer money for verification.",
    "Your account will be blocked. Update KYC immediately at this link and share your OTP.",
    "Your electricity connection will be disconnected tonight. Call this number immediately.",
    "Congratulations you won a lottery. Pay a fee to claim your prize.",
    "Part time job earning money by liking videos. Join our telegram group.",
]

ARTIFACTS = Path(__file__).resolve().parents[2] / "ml" / "artifacts" / "head.joblib"


def is_available() -> bool:
    if os.getenv("SEMANTIC_ENABLED", "true").lower() in {"0", "false", "off", "no"}:
        return False
    try:
        import sentence_transformers  # noqa: F401
    except Exception:
        return False
    if os.getenv("SEMANTIC_MODE", "head") == "head" and not ARTIFACTS.exists():
        # Fall through to prototype mode only if explicitly requested.
        return os.getenv("SEMANTIC_MODE") == "prototype"
    return True


def _embedder_lazy():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer

        model_name = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-small")
        _embedder = SentenceTransformer(model_name)
        _embedder.encode(["query: warmup"], normalize_embeddings=True)
    return _embedder


def _head_lazy():
    global _head
    if _head is None:
        import joblib

        _head = joblib.load(ARTIFACTS)
    return _head


def score(text: str) -> float | None:
    """Return p(scam) in [0,1], or None when the semantic stack is unavailable."""
    if not is_available():
        return None
    try:
        embedder = _embedder_lazy()
        vec = embedder.encode([f"query: {text[:1000]}"], normalize_embeddings=True)
        if os.getenv("SEMANTIC_MODE", "head") == "prototype" or not ARTIFACTS.exists():
            global _prototype_embs
            if _prototype_embs is None:
                _prototype_embs = embedder.encode([f"query: {p}" for p in PROTOTYPES], normalize_embeddings=True)
            import numpy as np

            sims = (vec @ _prototype_embs.T).max()
            return float(max(0.0, min(1.0, (float(sims) - 0.35) / 0.4)))
        head = _head_lazy()
        proba = head.predict_proba(vec)[0]
        # Assume scam is the positive class (index 1 for binary LogReg).
        return float(proba[1] if len(proba) > 1 else proba[0])
    except Exception:
        return None
