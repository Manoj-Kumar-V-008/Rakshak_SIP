# Rules-engine evaluation — curated golden set

Run: `cd backend; python -m ml.evaluate`

| Metric | Result |
| --- | ---: |
| Curated messages | 23 |
| Scam-positive messages | 12 |
| Benign messages | 11 |
| True positives / negatives | 12 / 11 |
| False positives / negatives | 0 / 0 |
| Precision / recall | 100.0% / 100.0% |
| False-positive rate | 0.0% |
| Scam-type accuracy | 12/12 (100.0%) |

This is a small hand-curated regression set, created to catch known false positives (bank OTPs, debit alerts, safety advice, ordinary conversation) and cover the supported rule categories. It is **not** a real-world accuracy claim, a held-out benchmark, or evidence of multilingual performance. Re-run the command after every rules change; the golden test suite must also pass.
