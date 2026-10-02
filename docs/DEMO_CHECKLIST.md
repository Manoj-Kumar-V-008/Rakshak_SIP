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
   npm run ts:check
   ```

3. Connect the phone and laptop to the same Wi-Fi network. If college Wi-Fi isolates devices, use a phone hotspot and connect the laptop to it.
4. Find the laptop IPv4 address using `ipconfig`. In Expo Go, open **Settings → Developer Tools → Demo Connection**, enter `http://<IPv4-address>:8000`, then tap **Test connection**.
5. Allow Python/uvicorn through Windows Firewall on private networks if the health check fails.
6. Keep the laptop awake and charger-connected. Start Expo with `npx expo start --lan -c`.

## Rehearsal sequence

1. Scan the digital-arrest sample. Confirm: `Server · rules engine`, danger score, evidence highlights, and `Call 1930` button.
2. Scan the bank OTP and debit-alert golden cases. Confirm: safe score and no false-positive evidence.
3. In **Demo Connection**, choose **Force offline**. Scan the digital-arrest sample again. Confirm: `Offline · rules on device`.
4. Return to **Auto** mode and use **Test connection**. Confirm the app returns to server mode.
5. Keep these exact fallback samples on the phone clipboard or in a note; do not rely on live SMS access.

## Honest presentation claims

- Text scanning is a real, explainable rules engine served by FastAPI, with a matching offline rules fallback in the Expo app.
- The demo evaluates a curated 23-message regression set. Its result is not a real-world benchmark.
- Live SMS inbox monitoring, live-call interception, semantic ML scoring, and broad multilingual support are not part of this evaluation build.
