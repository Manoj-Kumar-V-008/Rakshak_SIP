# Rakshak API (Sprint 1)

Run from this directory:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000/docs` for the interactive API contract. Run regression tests with:

```powershell
python -m pytest
```

Rules are kept in `../shared/rules.json`; golden regression cases live in `../shared/golden_cases.jsonl`.
