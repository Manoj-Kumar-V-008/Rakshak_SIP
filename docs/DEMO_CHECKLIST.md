# Rakshak AI evaluation demo checklist

## Before leaving for the demo

1. Start the backend from the project root:

   ```powershell
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. Run the quality gates:

   ```powershell
   cd ..
   python -m pytest -q
   npm run parity
   npm run ts:check
   ```

3. Connect the phone and laptop to the same Wi-Fi network. If college Wi-Fi isolates devices, use a phone hotspot and connect the laptop to it.
4. Find the laptop IPv4 address using `ipconfig`. In Expo Go, open **Settings → Developer Tools → Demo Connection**, enter `http://<IPv4-address>:8000`, then tap **Test connection**.
5. Allow Python/uvicorn through Windows Firewall on private networks if the health check fails.
6. Keep the laptop awake and charger-connected. Start Expo with `npx expo start --lan -c`.

## Rehearsal sequence

1. Scan the digital-arrest sample. Confirm: `Server · rules engine`, danger score, evidence highlights, and `Call 1930` button.
2. Scan the bank OTP and debit-alert golden cases. Confirm: safe score and no false-positive evidence.
3. On the result screen, tap `Report as scam` / `Mark as safe`. Confirm: success message and a row in server SQLite. Use `Share warning` for the poster flow.
4. In **Demo Connection**, choose **Force offline**. Scan the digital-arrest sample again. Confirm: `Offline · rules on device`.
5. Return to **Auto** mode and use **Test connection**. Confirm the app returns to server mode.
6. Voice (only if Whisper is pre-downloaded): pick a pre-recorded clip in **Voice Scanner**. Confirm: transcript shown, then danger result. If the server returns 503, state honestly that the voice model is not ready.
7. P2 only if green: in **Voice Scanner** turn Live meter ON, record 16s, confirm 8s chunk transcripts and live offline-rules meter updates. In **Demo Connection** tap Refresh rules, confirm offline version updates. On a result, tap Explain (needs Gemini key) and confirm consent prompt first.
8. Keep these exact fallback samples on the phone clipboard or in a note; do not rely on live SMS access.

## Honest presentation claims

- Text scanning is a real, explainable rules engine served by FastAPI, with a matching offline rules fallback in the Expo app (`npm run parity` 23/23).
- Voice scanning uses the same pipeline via Whisper transcription (`POST /v1/analyze/audio`); it needs the server model pre-downloaded or it honestly returns 503.
- Reporting (`POST /v1/feedback`) and rules OTA (`GET /v1/rules` + Refresh in Demo Connection, auto-refresh on launch) are real. Server mode always uses live server rules; offline mode uses refreshed or bundled rules.
- P2 live voice meter records in 8s chunks, transcribes each via the server, and shows an offline-rules meter on the rolling partial transcript. It is a prototype, not live-call interception.
- P1 semantic hybrid is wired (e5-small + head, `SEMANTIC_MODE=head|prototype`) with graceful fallback: without the model, `semantic` is N/A and hybrid equals rules-only. See `ml/reports/eval.md` for the rules/semantic/hybrid table.
- Gemini explainer is opt-in and off by default (key in SecureStore). It sends text to Google only after an explicit consent tap.
- The demo evaluates a curated 23-message regression set. Its result is not a real-world benchmark.
- Live SMS inbox monitoring, live-call interception, semantic ML scoring, and broad multilingual support are not part of this evaluation build.
