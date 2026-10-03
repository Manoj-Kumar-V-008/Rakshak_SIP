# Evaluation: rules vs semantic vs hybrid — curated golden set

Run: `cd backend; python -m ml.build_dataset; python -m ml.train_head; python -m ml.evaluate` and `npm run parity`

| Config | Accuracy | P / R / F1 (scam) | FPR | Confusion |
| --- | --- | --- | --- | --- |
| rules-only | 100.0% | 100.0% / 100.0% / 100.0% | 0.0% | TP=12 TN=11 FP=0 FN=0 |
| semantic-only | N/A (model unavailable) | — | — | — |
| hybrid | 100.0% (falls back to rules) | 100.0% / 100.0% / 100.0% | 0.0% | TP=12 TN=11 FP=0 FN=0 |

| Metric | Result |
| --- | ---: |
| Curated messages | 23 (en 22, hinglish 1) |
| Scam-type accuracy (rules) | 12/12 (100.0%) |
| Rules latency p50 / p95 | ~1 ms / ~1 ms (local CPU) |
| Hybrid latency p50 / p95 | ~1 ms / ~2 ms (fallback, no model) |
| JS parity (`npm run parity`) | 23/23 match Python engine |
| Dataset splits | `ml/data/processed/` train 16 / test 7 (group split, seed 42; generated, gitignored) |

To enable semantic: uncomment P1 deps in `backend/requirements.txt`, run the server once with internet (e5-small download), then `python -m ml.train_head`. Until then hybrid honestly falls back to rules-only and semantic shows N/A.

This is a small hand-curated regression set (bank OTPs, debit alerts, safety advice, ordinary conversation + covered scam types). It is **not** a real-world accuracy claim, a held-out benchmark, or evidence of Tamil/Telugu/Kannada performance. Re-run after every rules change; the golden test suite must also pass.
