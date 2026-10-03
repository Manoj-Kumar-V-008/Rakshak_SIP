# Rakshak API (Sprint 1)

Run from this directory:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000/docs` for the interactive API contract. Run regression tests with:

```powershell
python -m pytest
python -m ml.evaluate
```

Rules are kept in `../shared/rules.json`; golden regression cases live in `../shared/golden_cases.jsonl`.

## Server AI second opinion (Gemini / NVIDIA NIM, optional)

Without a key the server is rules-only, so server and offline scores match. Set a key to make the server visibly different (`hybrid-llm` chip + `llm` trace stage):

```powershell
# Gemini (free at https://aistudio.google.com/app/apikey)
$env:RAKSHAK_LLM_PROVIDER="gemini"
$env:RAKSHAK_LLM_API_KEY="AIza..."
# optional: $env:RAKSHAK_LLM_MODEL="gemini-3.5-flash-lite"

# or NVIDIA NIM (https://build.nvidia.com)
$env:RAKSHAK_LLM_PROVIDER="nim"
$env:RAKSHAK_LLM_API_KEY="nvapi-..."
# optional: $env:RAKSHAK_LLM_MODEL="meta/llama-3.1-8b-instruct"

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Check `GET /health` shows `"llm": "ready"`. The same Google key can also be pasted in the app (Demo Connection -> Gemini) for the opt-in `Explain in simple words` button. Note: with a server key, scanned text IS sent to that cloud provider; offline mode never does.

## Voice troubleshooting

Transcription priority: local faster-whisper (free, no cloud) → Gemini cloud (same server key as the LLM second opinion) → honest 503. To skip the ~500 MB Whisper download, just set `RAKSHAK_LLM_PROVIDER=gemini` + key; voice then works with cloud transcription. Note: cloud transcription sends the clip to Google; say so in the demo.

`Upload failed though server is reachable` with older bundles meant `fetch()` FormData, which this SDK rejects — voice now uploads via the native `expo-file-system/legacy` uploader. If upload still fails: confirm the backend was restarted with the latest code, `python-multipart` is installed, Test connection passes, Expo runs with `--lan`, and clips stay under 20 s.

For physical-phone setup and the rehearsal script, see `../docs/DEMO_CHECKLIST.md`.
