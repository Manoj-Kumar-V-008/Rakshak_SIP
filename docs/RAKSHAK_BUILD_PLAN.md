# Rakshak AI (SIP) — End-to-End Build Plan

**Goal:** by Monday (5 Oct 2026) demo a *working* scam-detection app (React Native/Expo → FastAPI → pretrained models) that is structured so the full product (on-device models, SMS/call monitoring, more languages) plugs in later without rewrites.
**Rule of the week:** no model training/fine-tuning. We use frozen pretrained models + rules. Only a tiny scikit-learn head is fitted on embeddings (seconds on CPU) — optional, and removable (see §7.3).

---

## 0. TL;DR

| | |
|---|---|
| **P0 (must work Monday)** | Text/SMS scanner → real backend → real result screen (score, type, highlighted evidence, sub-scores, actions). Offline fallback (rules on-device). |
| **P1 (should work)** | Voice: record or pick an audio clip → Whisper transcript → same pipeline. Evaluation report (rules vs ML vs hybrid). |
| **P2 (only if everything else is green)** | Rules OTA endpoint, pseudo-live chunked voice meter, Gemini "explain in simple words" (opt-in). |
| **Mock / roadmap only** | Live call monitoring, SMS inbox listener, notification scanning, on-device ONNX, federated learning. Show honestly as "Phase 2+" screens. |
| **Stack** | Expo SDK 54 + TS + Zustand (existing) · FastAPI · `intfloat/multilingual-e5-small` (frozen) + LogisticRegression head · `faster-whisper` · `rules.json` shared by app and server |
| **Network** | Phone and laptop on the same Wi-Fi/hotspot. Backend URL is editable in-app (no rebuild at demo time). |

---

## 1. Audit of the current repo (what must change)

I read `ScannerScreen.tsx` and `ScamAnalysisResultScreen.tsx`. These are the real problems, in priority order:

| # | Finding | Why it matters | Fix |
|---|---|---|---|
| 1 | Loading console prints "Initializing Mobile-BERT classifier… Computing local neural threat score" on a fixed 2 s `setTimeout`. **No model runs.** | If mam asks "where is the model?", this is exposed. It's also not honest. | Replace with a **real trace** returned by the backend (stages + real ms). Animate the replay; content is real (§5.3). |
| 2 | Detection uses `String.includes()` on substrings, first-match-wins. `'won'` matches *"I won't be late"* → Lottery 88. `'court'` matches *"courtesy"* → Digital Arrest 98. `'pan'` matches *"company"* → Phishing 96. Also `win`→window/winter, `bill`→billion, `earn`→learn, `power`→powerful, `card`→discard. | False positives on ordinary messages will show up in any live demo. | Word-boundary rules + multi-signal scoring + ML (§6). |
| 3 | A **genuine bank OTP SMS** ("Your OTP is 123456, do not share") contains `otp`/`bank` → scored 96 "Credential Phishing". | Most embarrassing possible false positive for a scam app. | Benign-template detection + negation guard (§6.2). |
| 4 | Demo templates are matched by exact text and return hard-coded scores. | They prove nothing about detection. | Templates become plain sample text only; results come from the engine. |
| 5 | Result screen "AI Classifier Metrics": urgency = `riskScore - 6`, impersonation = `riskScore - 12`, sentiment hard-coded. | Fabricated numbers presented as model output. | Real `subScores` from the engine (§5.1). |
| 6 | "Block Sender" says the sender was blocked; "Report to Database" says the message was added to a threat database. **Neither does anything** (there is no sender field either). | Shows false statements to users. | Replace with: **Call 1930**, **Report as scam / Mark as safe** (real `POST /v1/feedback`), **Share warning**. |
| 7 | Header copy says "On-Device AI Parser… local NLP". | Won't be true when the semantic model runs on a server. | Engine chip: `Server (hybrid)` vs `Offline (rules on-device)`. |
| 8 | `(navigation as any).navigate(...)`, `maxLength={400}`. | Type hole; 400 chars truncates real scam scripts. | Typed navigation; raise to 1000. |
| 9 | `ARCHITECTURE.md` says Expo SDK 51; `package.json` is SDK 54 (React 19, RN 0.81). | Docs contradict code. | Update doc in Task T20. |
| 10 | README claims English, Hindi, Tamil, Telugu, Kannada. | Not tested; rules/data don't exist for them. | Claim only what the eval report supports (§3). |

**Good news:** the screens, theme, store (`addScanRecord`) and `RootStackParamList` are solid. The navigation params already look like `{riskScore, scamType, indicators[], remediationSteps[]}`, so the new backend contract is a *superset* of what the UI already consumes. We refactor, not rewrite.

---

## 2. Scope by tier

| Tier | Feature | Acceptance (Definition of Done) |
|---|---|---|
| **P0-1** | Text scan via backend | Paste text → result in < 2 s on LAN; highlights + sub-scores are real; history saved. |
| **P0-2** | Offline fallback | Kill the server → scan still works, chip says "Offline mode (rules only)". |
| **P0-3** | Honest actions | Call 1930 opens dialer; Report/Mark-safe hits `/v1/feedback` and stores a row. |
| **P0-4** | Golden test suite | `pytest` + a TS script pass all cases in §13.2 (parity between server rules and app rules). |
| **P1-1** | Voice scan | Record 10–20 s or pick an audio file → transcript shown → result. |
| **P1-2** | Eval report | `ml/reports/eval.md` with confusion matrix, per-language metrics, FPR, latency, rules-vs-ML-vs-hybrid table. |
| **P2** | `GET /v1/rules`, chunked live meter, Gemini explainer | Only after P0+P1 are demo-stable. |

---

## 3. Honest claims table (use this in the presentation)

| Claim | Status Monday | Say this |
|---|---|---|
| Detects scam SMS/text | ✅ real | "Hybrid: rule signals + multilingual semantic model." |
| On-device | ⚠️ partial | "Rules engine runs fully on the phone (offline mode). The semantic model runs on a local server in the prototype; on-device ONNX is Phase 2 — same interface, so no UI change." |
| No cloud / privacy-first | ✅ if Gemini stays off | "Server runs on our own laptop, doesn't store message text by default; text is only saved when the user taps Report." |
| Voice scams | ⚠️ partial | "Record/upload a call clip → transcript → analysis. Live in-call monitoring is Phase 2 (Android restricts call audio)." |
| Multilingual | ⚠️ | English, Hindi, Hinglish tested. Kannada experimental. Tamil/Telugu: **don't claim** unless the eval table shows it. |
| Intervenes before a transaction | ❌ roadmap | "Designed for it: SMS/notification hook + UPI intent warning are Phase 3." |

---

## 4. Architecture

```
┌────────────────────────── Expo app (Android) ───────────────────────────┐
│ Scanner (paste)   Voice (record/pick)   History/Dashboard   Admin       │
│        │                  │                                     │       │
│        └────── useScanner() hook ───────────────────────────────┘       │
│                       │                                                 │
│        services/engine/analyze.ts   (orchestrator)                      │
│           ├─ try ► services/api/scamService.ts ──► HTTP (timeout 6 s)   │
│           └─ catch ► services/engine/localEngine.ts (rules.json, on-device)
│                       │                                                 │
│        zod: AnalysisResultSchema  ──►  Zustand store (history, settings)│
└──────────────────────────┬──────────────────────────────────────────────┘
                           │  JSON over LAN  (X-API-Key)
┌──────────────────────────▼──────────────────────────────────────────────┐
│ FastAPI (laptop)                                                        │
│  POST /v1/analyze/text   POST /v1/analyze/audio   POST /v1/feedback     │
│  GET  /health            GET /v1/rules (P2)                             │
│                                                                         │
│  pipeline:  normalize ► entities ► RULES ► SEMANTIC ► FUSION ► EXPLAIN  │
│                           │           │         │                       │
│                      rules.json   e5-small   score + type + subScores   │
│                      (shared)     + LR head  + highlights + trace       │
│  audio:  faster-whisper(small, int8) ► transcript ► same pipeline       │
│  storage: SQLite (feedback, anonymised analysis log)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Technology choices

| Concern | Choice | Why / alternative rejected |
|---|---|---|
| Mobile | Existing Expo SDK 54 / TS / Zustand / Paper | Already built. Run in **Expo Go**; no native build needed Monday. |
| API | FastAPI + pydantic v2 | Typed contract, auto docs at `/docs` (great to show mam). |
| Semantic model | `intfloat/multilingual-e5-small` (384-d, 12 layers, MIT) | Covers the 100 XLM-R languages incl. Hindi/Kannada/Tamil/Telugu — **but** the model card warns low-resource languages degrade, so we *measure* before claiming. Replaces my earlier suggestion `paraphrase-multilingual-MiniLM`, whose language list does not include Kannada/Tamil/Telugu. Needs the `"query: "` prefix. |
| Classifier head | scikit-learn `LogisticRegression` on frozen embeddings | Fits in seconds; no GPU; swappable. |
| ASR | `faster-whisper` `small`, `int8`, CPU, `vad_filter=True` | Whisper supports Hindi/Kannada/Tamil/Telugu; `small` is the quality/speed compromise (use `base` if laptop is slow). Decodes audio via PyAV — no system ffmpeg needed. |
| Rules | One `shared/rules.json` consumed by Python **and** TypeScript | Single source of truth; the TS port is ~100 lines; golden tests enforce parity. |
| Audio in app | `expo-audio` (+ `expo-document-picker` for pre-recorded clips) | `expo-av` is deprecated in SDK 54. Picker matters: **demo with pre-recorded clips**, mics are unreliable in classrooms. |
| Storage | SQLite on server (feedback only); Zustand+AsyncStorage on phone | Matches existing store. |
| Optional LLM | Gemini "explain simply" button, off by default | Opt-in only, matches your ARCHITECTURE.md privacy section. P2. |

---

## 5. API contract v1 (freeze first — both sides code against this)

### 5.1 Response (`AnalysisResult`)

`indicators` and `remediationSteps` stay `string[]` so the existing UI keeps working. Everything else is additive.

```jsonc
POST /v1/analyze/text
// req
{ "text": "…", "lang": "auto", "source": "paste" }   // source: paste | sms | transcript

// res 200
{
  "analysisId": "b1f0…",                 // uuid4
  "displayText": "…",                    // the exact string all offsets refer to
  "riskScore": 91,                       // 0–100
  "level": "danger",                     // safe ≤20 | suspicious ≤60 | danger  (same cut-offs as the Result screen)
  "scamTypeId": "digital_arrest",
  "scamType": "Digital Arrest Scam",
  "indicators": ["Impersonates law enforcement (CBI)", "Demands secrecy / staying on video call"],
  "remediationSteps": ["Disconnect. Real police never investigate over video calls", "Call 1930"],
  "subScores": { "urgency": 70, "impersonation": 88, "coercion": 91, "financialAsk": 75 },   // 0–100, real
  "signals": [
    { "id": "authority_impersonation", "label": "Impersonates authority", "weight": 0.45,
      "matches": [ { "start": 8, "end": 11, "text": "CBI" } ] }
  ],
  "entities": { "urls": [], "phones": ["9812345678"], "amounts": ["Rs 50,000"] },
  "detectedLanguage": "en",              // en | hi | hinglish | kn | ta | te | other
  "scores": { "rules": 0.84, "semantic": 0.93, "fused": 0.91 },   // semantic null if model unavailable
  "engine": { "mode": "hybrid", "model": "multilingual-e5-small", "rulesVersion": "1.0.0", "latencyMs": 212 },
  "trace": [
    { "stage": "normalize", "ms": 1,   "detail": "142 chars, lang=en" },
    { "stage": "rules",     "ms": 3,   "detail": "5 signals" },
    { "stage": "semantic",  "ms": 187, "detail": "p(scam)=0.93" },
    { "stage": "fusion",    "ms": 0,   "detail": "score 91 → danger" }
  ],
  "transcript": null                     // string for /analyze/audio
}
```

```
POST /v1/analyze/audio     multipart: file (m4a/wav/mp3, ≤ 10 MB, ≤ 60 s), lang? → same shape, transcript filled
POST /v1/feedback          { analysisId, verdict: "scam_confirmed" | "false_positive" | "missed_scam", text?: string }  → { ok: true }
GET  /health               { status, models: { embed: "ready", asr: "ready|lazy|off" }, version, rulesVersion }
GET  /v1/rules   (P2)      returns shared/rules.json (app can refresh rules without a new APK)
```
Errors: `{ "code": "TEXT_TOO_LONG" | "UNSUPPORTED_AUDIO" | "BAD_API_KEY" | "MODEL_NOT_READY", "message": "…" }`. Auth: header `X-API-Key` (env `RAKSHAK_API_KEY`; the app reads `EXPO_PUBLIC_API_KEY` — this is only a drive-by guard, it ships inside the bundle, not a secret).

### 5.2 Client types
Define `AnalysisResultSchema` in **zod** (`src/types/analysis.ts`) mirroring pydantic exactly; parse every server response with it. Client record:
`ScanRecord = AnalysisResult & { text: string; createdAt: number; origin: 'paste'|'voice'|'sms'; via: 'server'|'offline' }`.
Navigation param becomes `ScamAnalysisResult: { record: ScanRecord }` (keep the existing default fallback in the screen).

### 5.3 Trace display
Server returns real stage timings. The Scanner's black "console" keeps its look but **replays** `trace[]` with ~250 ms between lines. In offline mode the trace has only `rules`. Never print stages that didn't run.

---

## 6. Backend design

### 6.1 Layout
```
backend/
  app/
    main.py                 # app factory, lifespan: load models + warm-up
    config.py               # pydantic-settings (env): API_KEY, EMBED_MODEL, WHISPER_MODEL, ASR_ENABLED, LOG_TEXT=false
    schemas.py              # pydantic = §5 contract
    deps.py                 # api-key dependency
    routers/ analyze.py  feedback.py  health.py
    pipeline/
      normalize.py          # strip zero-width, NFKC, collapse spaces; language guess (script + hinglish heuristic)
      entities.py           # urls, phones, amounts (regex)
      rules.py              # load rules.json, match, offsets, negation guard, benign templates
      semantic.py           # e5 embed + head.joblib → p(scam); returns None if unavailable
      fusion.py             # combine → riskScore, level, floors/caps
      scam_types.py         # resolve scamTypeId, subScores, indicators, remediation
      runner.py             # orchestrates stages + builds trace
    asr/whisper_service.py
    storage/db.py           # sqlite3: feedback(id, analysis_id, verdict, text?, ts), analyses(hash, score, type, ts)
    data/remediation.json   # per scamTypeId, per language (en now; hi/kn later)
  ml/
    data/raw/  data/processed/   # dataset.jsonl
    build_dataset.py  train_head.py  evaluate.py
    artifacts/head.joblib
    reports/
  tests/ test_rules.py  test_api.py  test_golden.py
  requirements.txt  README.md  run.ps1 / run.sh
shared/
  rules.json
  golden_cases.jsonl        # used by pytest AND a TS test script
```

### 6.2 Rules engine (`rules.json` schema + behaviour)

```jsonc
{
  "version": "1.0.0",
  "signals": [
    { "id": "urgency", "label": "Creates artificial urgency", "category": "urgency", "weight": 0.35,
      "patterns": {
        "en": ["immediately", "right now", "within 24 hours", "last chance", "expires today", "tonight"],
        "hinglish": ["turant", "abhi", "jaldi", "aaj raat"],
        "hi": ["तुरंत", "अभी", "आज ही"],
        "kn": ["ತಕ್ಷಣ"] } },
    { "id": "authority_impersonation", "category": "impersonation", "weight": 0.45, "...": "…" },
    { "id": "legal_threat", "category": "coercion", "weight": 0.5, "...": "arrest, warrant, narcotics, money laundering, case registered, digital arrest…" },
    { "id": "credential_request", "category": "financial", "weight": 0.6, "negation_guard": true,
      "regex": ["(share|send|tell|give|provide|enter|bata\\w*|bhej\\w*)\\W+(\\w+\\W+){0,4}(otp|pin|cvv|password)"] },
    { "id": "payment_request", "category": "financial", "weight": 0.4, "...": "transfer, pay now, processing fee, upi, scan qr…" },
    { "id": "secrecy_isolation", "category": "coercion", "weight": 0.45, "...": "don't tell anyone, stay on video call, mat batana…" },
    { "id": "prize_claim", "category": "financial", "weight": 0.5, "...": "lucky draw, KBC, lottery, claim your prize…" },
    { "id": "task_job_offer", "category": "financial", "weight": 0.45, "...": "part time, like videos, earn per day, telegram group…" },
    { "id": "investment_guarantee", "category": "financial", "weight": 0.5, "...": "guaranteed returns, double your money, VIP group, limited seats…" },
    { "id": "loan_harassment", "category": "coercion", "weight": 0.5, "...": "overdue, message your contacts, defaulter…" },
    { "id": "kyc_threat", "category": "urgency", "weight": 0.45, "...": "kyc, account blocked/suspended, pan update…" },
    { "id": "utility_disconnect", "category": "urgency", "weight": 0.45, "...": "electricity/power connection disconnected tonight…" }
  ],
  "regex_signals": [
    { "id": "shortened_link",  "weight": 0.35, "regex": "(bit\\.ly|tinyurl\\.com|cutt\\.ly|rb\\.gy|is\\.gd)/\\S+" },
    { "id": "apk_link",        "weight": 0.7,  "regex": "https?://\\S+\\.apk\\b" },
    { "id": "ussd_forward",    "weight": 0.7,  "regex": "\\*401\\*\\d+|\\*\\*21\\*" },
    { "id": "callback_number", "weight": 0.25, "regex": "(call|contact|whatsapp)\\W+(\\w+\\W+){0,4}(\\+?91)?[6-9]\\d{9}" },
    { "id": "lookalike_domain","weight": 0.5,  "regex": "https?://[^\\s/]*(sbi|hdfc|icici|axis|kyc|paytm)[^\\s/]*\\.(xyz|top|info|click|online|in\\.net)" }
  ],
  "benign_signals": [
    { "id": "otp_notice_template", "regex": ["otp\\W+(is|for)", "do not share", "don't share", "never share"], "requires_all": true },
    { "id": "txn_alert_template",  "regex": ["(debited|credited)\\W+.{0,40}a/c", "avl\\.? bal"], "requires_all": false }
  ],
  "scam_types": [
    { "id": "digital_arrest", "label": "Digital Arrest Scam", "requires_any": ["authority_impersonation", "legal_threat"], "boost": ["secrecy_isolation", "payment_request"], "floor": 85 },
    { "id": "credential_phishing", "label": "Credential / KYC Phishing", "requires_any": ["credential_request", "kyc_threat", "lookalike_domain"], "boost": ["urgency", "shortened_link"], "floor": 85 },
    { "id": "utility_disconnection", "label": "Utility Disconnection Fraud", "requires_any": ["utility_disconnect"], "boost": ["urgency", "callback_number"], "floor": 80 },
    { "id": "lottery_prize", "label": "Lottery / Prize Scam", "requires_any": ["prize_claim"], "boost": ["payment_request", "callback_number"], "floor": 80 },
    { "id": "fake_job", "label": "Fake Job / Task Scam", "requires_any": ["task_job_offer"], "boost": ["payment_request"], "floor": 75 },
    { "id": "investment_fraud", "label": "Investment Fraud", "requires_any": ["investment_guarantee"], "boost": ["urgency", "payment_request"], "floor": 75 },
    { "id": "loan_harassment", "label": "Instant-Loan Harassment", "requires_any": ["loan_harassment"], "boost": ["payment_request"], "floor": 75 },
    { "id": "malicious_app_or_hijack", "label": "Malicious APK / Call-Forward Hijack", "requires_any": ["apk_link", "ussd_forward"], "boost": [], "floor": 85 },
    { "id": "suspicious_link", "label": "Suspicious Link", "requires_any": ["shortened_link"], "boost": [], "floor": 0 }
  ],
  "fusion": { "w_rules": 0.5, "w_semantic": 0.5, "safe_max": 20, "suspicious_max": 60, "benign_cap": 15 }
}
```
*(The JSON above shows structure and a few seed patterns. Have the AI expand each signal to ~15–30 patterns per language, then review. Your field-visit categories — digital arrest, investment/pig-butchering, job, instant-loan, matrimony, APK, call forwarding `*401*` — map 1:1 to these signals.)*

**Matching rules (important — this fixes the substring bug):**
- Latin-script patterns: compile with `(?<![a-z0-9])PATTERN(?![a-z0-9])`, `re.IGNORECASE`. So `won` no longer matches *won't*… and add an explicit negative lookahead `(?!['’]t)` on `won`.
- Devanagari / Kannada / Tamil / Telugu patterns: plain substring (Python `\b` is unreliable around combining vowel signs).
- **Negation guard:** for signals with `negation_guard: true`, ignore a match if the preceding ~25 chars contain `do not | don't | never | not | mat | nahi | ಬೇಡ`. This is what separates "share your OTP" (scam) from "do not share OTP" (genuine).
- **Benign templates:** if `otp_notice_template` matches and the only non-benign signals are weak/none → apply `benign_cap` (15). A genuine OTP message must come out `safe`.
- Every match returns `(start, end, text)` offsets against `displayText`.
- Offsets: `displayText` = original with zero-width chars removed and trimmed. Don't lower-case/NFKC the string you return offsets for; use `re.IGNORECASE` instead.

**Rule score:** noisy-OR over matched signal weights: `p_rules = 1 − Π(1 − w_i)`.
**sub-scores:** per category (`urgency`, `impersonation`, `coercion`, `financial`) apply the same noisy-OR over that category's signals, ×100. These replace the fake percentages on the Result screen.

### 6.3 Semantic stage
- Load `SentenceTransformer("intfloat/multilingual-e5-small")` once at startup; warm up with one dummy encode.
- Encode `"query: " + displayText`, `normalize_embeddings=True`.
- `head.joblib` (LogReg) → `p(scam)`. If the file is missing or load fails → `semantic = None`, engine mode `rules-only` (service still works).
- Truncate input to 512 tokens.

### 6.4 Fusion
```
fused = w_rules*p_rules + w_semantic*p_semantic          # if semantic is None: fused = p_rules
fused = max(fused, floor_of_resolved_scam_type/100)       # strong evidence floor
if benign_template and no strong signals: fused = min(fused, benign_cap/100)
if |p_rules - p_semantic| > 0.6: fused = clamp(fused, 0.35, 0.65)   # disagreement ⇒ "suspicious", not confident
riskScore = round(100*fused);  level from cut-offs 20/60
```
Tune `w_*`, `floor`, `benign_cap` using `evaluate.py` on the dev split, not by feel.

### 6.5 Scam type + indicators + remediation
`scamTypeId` = the type with `requires_any` satisfied and the highest (`#required hits + 0.5·#boost hits`); if none → `"unknown_suspicious"` (if score > 20) or `"safe"`. `indicators[]` = labels of matched signals (+ the entity facts, e.g. "Asks you to call 9812345678"). `remediationSteps[]` from `remediation.json[scamTypeId][lang]`, always including **Call 1930 (National Cyber Crime Helpline)** for danger.

### 6.6 ASR
`WhisperModel("small", device="cpu", compute_type="int8")`; `transcribe(file, beam_size=1, vad_filter=True)`; return text + detected language; then run the identical pipeline with `source="transcript"`. Reject > 60 s / > 10 MB. Preload at startup when `ASR_ENABLED=true`; first download needs internet — **pre-cache the model before Monday**.

### 6.7 Privacy & logging
Server never logs message text (`LOG_TEXT=false`). Persist only SHA-256(text), score, type, timestamp. Text is stored **only** when the user taps Report/Mark-safe and `/v1/feedback` includes it. State this in the UI ("Text leaves your phone only to your own server, only for analysis").

---

## 7. ML: no training — data, evaluation, optional head

### 7.1 Dataset (`ml/data/processed/dataset.jsonl`)
Schema: `{id, text, label: "scam"|"genuine", scam_type, lang, source: "synthetic"|"hand_written"|"public", template_group}`.
Target ≈ **400 rows**, balanced 50/50: en 160 · hinglish 100 · hi 60 · kn 50 · ta 15 · te 15.
- **Scam side:** 8 types × multiple phrasings, built from your field-visit categories.
- **Genuine side (the part that makes the app credible):** bank OTP, debit/credit alerts, delivery updates, telecom plan expiry, genuine electricity bill-generated notices, friend/family chat, **hard negatives that contain scammy words innocently** ("won the match", "bill split", "learn", "courtesy").
- Generate in batches of ~40 with an LLM using a fixed prompt (appendix B), then **hand-review at least 60 rows** and have a Hindi/Kannada speaker check those languages. Label the dataset as *synthetic* in the report.
- **Dedupe + group split:** drop near-duplicates (cosine > 0.95 on embeddings) and split train/test **by `template_group`**, otherwise the test score is inflated by paraphrase leakage.
- **False-positive stress set:** 500 random "ham" messages from the public UCI SMS Spam Collection (English) → measure false-positive rate on a large N.

### 7.2 Evaluation (`ml/evaluate.py` → `ml/reports/eval.md`)
Run three configs on the held-out split: **rules-only**, **semantic-only**, **hybrid**. Report: accuracy, precision/recall/F1 (scam class), confusion matrix, false-positive rate, per-language metrics (with *n* shown), scam-type accuracy (rules), latency p50/p95. This table is your answer to objectives #3, #4 and #6 in the ASIP report. Be explicit about the small, synthetic dataset.

### 7.3 Head fitting (`ml/train_head.py`)
Embed train split → `LogisticRegression(C=1.0, class_weight="balanced", max_iter=1000)` → `joblib.dump`. Takes seconds. **If you want zero training of any kind:** skip the head and score semantic similarity to ~5 hand-written prototype sentences per scam type (cosine, max-pooled, mapped to 0–1). Same interface (`p(scam)`), a little less accurate; swap by config `SEMANTIC_MODE=prototype|head`.

---

## 8. Frontend changes, file by file

| File | Change |
|---|---|
| `src/types/analysis.ts` (new) | zod `AnalysisResultSchema`, `ScanRecord`, `Level`, `Signal`. |
| `src/navigation/types.ts` | `ScamAnalysisResult: { record: ScanRecord }`; add `VoiceScanner` to the Scanner stack. |
| `src/store/useConfigStore.ts` | Add `apiUrl`, `apiKey`, `engineMode` (`auto|offline`), extend scan record (id, createdAt, origin, via, subScores…). Persist `apiUrl`. |
| `src/services/api/apiClient.ts` | Base URL from store/`EXPO_PUBLIC_API_URL`; `X-API-Key`; 6 s default timeout. |
| `src/services/api/scamService.ts` | `analyzeText()`, `analyzeAudio(uri)` (use `fetch` + `FormData`; 45 s timeout), `sendFeedback()`, `health()`. Zod-parse every response. |
| `shared/rules.json` | Imported by the app. |
| `src/services/engine/ruleEngine.ts` (new) | TS port of §6.2 (word-boundary regex, negation guard, benign cap, noisy-OR, offsets, sub-scores). **Move the old if-else out of the screen and delete it.** |
| `src/services/engine/localEngine.ts` (new) | Calls `ruleEngine`, returns `AnalysisResult` with `engine.mode="rules-only"`. |
| `src/services/engine/analyze.ts` (new) | `analyze(text, origin)`: if `engineMode==='auto'` try server (timeout) → on failure use local. Returns `{ result, via }`. |
| `src/hooks/useScanner.ts` (new) | `scan(text|audioUri)` → loading state, trace, navigation, `addScanRecord`. |
| `ScannerScreen.tsx` | Remove fake logs/timeouts/template results. Keep UI: templates just fill the input; **trace replay** console; engine chip (`Server · hybrid` / `Offline · rules`); raise `maxLength` to 1000; typed navigation; add "Voice" entry. |
| `ScamAnalysisResultScreen.tsx` | Read `record`; metrics = `subScores` (Urgency, Impersonation, Coercion, Financial Ask); render `displayText` with highlighted spans from `signals[].matches`; show engine chip + latency; transcript block for voice; actions: **Call 1930** (`Linking.openURL('tel:1930')`), **Report as scam** / **Mark as safe** (→ `/v1/feedback`, real success/failure message), **Share warning** (`Share.share`). Remove "Block Sender". |
| `VoiceScannerScreen.tsx` (new) | `expo-audio` record button (permission flow), "Pick audio file" (`expo-document-picker`), upload, progress ("Transcribing…"), then result. |
| `AdminSettings` screen | Backend URL field, API key field, **Test connection** (`/health`), engine mode toggle (Auto / Force offline — lets you demo the fallback on demand). |
| `app.json` | `expo-audio` plugin with `microphonePermission` text. |

Install: `npx expo install expo-audio expo-document-picker`. (zod, axios, zustand already present.)

Highlight rendering: sort matches by `start`, merge overlaps, split `displayText` into `[plain | flagged]` segments → nested `<Text>` with `backgroundColor: threat.color + '33'`.

---

## 9. Running it (and what fails on demo day)

```
# backend
cd backend && python -m venv .venv && .venv\Scripts\activate    (Windows)
pip install -r requirements.txt
python ml/train_head.py                  # once (seconds)
uvicorn app.main:app --host 0.0.0.0 --port 8000
# find laptop IP: ipconfig → IPv4 (e.g. 192.168.1.23). Test from phone browser: http://192.168.1.23:8000/health

# app
npm install --legacy-peer-deps
npx expo start --tunnel -c        # or LAN mode
# in app: Profile → Dev options → Backend URL = http://192.168.1.23:8000 → Test connection
```

| Failure | Mitigation |
|---|---|
| College Wi-Fi isolates devices / blocks port 8000 | Use **phone hotspot** (laptop joins it) or laptop hotspot. Backup: Cloudflare/ngrok quick tunnel to port 8000 and paste the HTTPS URL in Admin. |
| Windows firewall blocks 8000 | Allow Python/uvicorn on private networks *before* Monday. |
| Server dies mid-demo | Offline fallback is built in — **turn that into a demo step.** |
| First-run model downloads need internet | Run the backend once at home so e5 + Whisper are cached. |
| Laptop sleeps / changes IP | Disable sleep; re-test IP Monday morning; URL is editable in-app. |
| Mic problems | Use pre-recorded clips via file picker. |
| Whisper too slow | `WHISPER_MODEL=base`, keep clips ≤ 20 s. |
| APK builds (later) | Android release builds block plain `http://` — needs `usesCleartextTraffic` via `expo-build-properties` or an HTTPS tunnel. Not needed for Expo Go. |

---

## 10. Schedule (today = Thu 1 Oct → demo Mon 5 Oct)

**Day 0 – Thu night (≈ 2 h): foundations**
1. `git tag v0-frontend-mock`. Make `backend/`, `shared/`.
2. Freeze §5 contract: `schemas.py` + `analysis.ts` zod (T1, T2).
3. Start model downloads in the background (e5-small, Whisper small).
4. Phone ↔ laptop connectivity check (`/health` from phone browser). **Do this first; network problems are the #1 demo risk.**

**Fri – P0 backend + app wiring**
- AM: `rules.json` v1 + rules engine + golden tests (T3–T5). Server returns real rules-only results.
- PM: app: apiClient/scamService/analyze orchestrator/useScanner, Scanner refactor, Admin settings (T10–T13). End-to-end text scan works over LAN.
- Evening: start dataset generation (T8).

**Sat – semantic + result screen + voice**
- AM: dataset review → `train_head.py` → semantic + fusion + trace (T6–T9). Result screen rewrite (T14).
- PM: TS `ruleEngine` + offline fallback + parity test (T10b); Whisper endpoint + Voice screen (T15–T16).

**Sun – eval, polish, rehearse**
- AM: `evaluate.py` + report (T17); tune thresholds on dev split only.
- PM: demo scripts, pre-recorded audio clips, feedback endpoint, doc/poster wording fixes (T18–T20). Full rehearsal on the actual phone + actual network. Record a backup screen-capture video.
- **Feature freeze Sunday 9 pm.**

**Mon – morning only:** re-check IP, battery, firewall, caches; run golden tests; present.

*If you fall behind:* cut in this order — pseudo-live voice → voice screen (keep text) → Kannada → semantic head (go rules-only + eval of rules). Never cut the offline fallback or the false-positive tests.

### Optional split if teammates help
| Person | Owns |
|---|---|
| Manoj | Backend pipeline, fusion, integration |
| Mohammed Hashim | Dataset + evaluation report |
| Bhagyalaxmi | Result screen (highlights, sub-scores, actions) |
| Ajay | Voice screen + Whisper endpoint |
| Rohan | Golden cases + TS rule engine parity |
| Sai Deep | Hindi/Kannada rule/review, demo audio clips, poster/report wording |

---

## 11. Task cards (each is a self-contained prompt for your coding AI)

> Start every AI session by pasting **Appendix A (agent rules)** and §5 (contract).

| ID | Task | Files | Done when |
|---|---|---|---|
| T1 | Pydantic schemas exactly per §5.1; `/health`; config; api-key dep | `backend/app/schemas.py, config.py, deps.py, routers/health.py` | `GET /health` OK; `/docs` shows models |
| T2 | zod schema + `ScanRecord` types; update nav types | `src/types/analysis.ts`, `src/navigation/types.ts` | `npm run ts:check` passes |
| T3 | `normalize.py`, `entities.py` (urls/phones/amounts, language guess) | `backend/app/pipeline/` | unit tests on 10 strings |
| T4 | `rules.json` v1 (expand §6.2 seeds: ≥15 patterns/signal for en+hinglish+hi, ≥5 kn) | `shared/rules.json` | loads; schema-validated |
| T5 | Rules engine per §6.2 incl. negation guard, benign cap, offsets, noisy-OR, sub-scores, type resolver, remediation | `rules.py, scam_types.py, data/remediation.json` | **all §13.2 golden cases pass** |
| T6 | `/v1/analyze/text` using rules only + trace + latency | `routers/analyze.py, runner.py` | curl returns valid contract |
| T7 | `semantic.py` (e5 + head loader, graceful `None`), `fusion.py` | `pipeline/` | works with and without `head.joblib` |
| T8 | `build_dataset.py` (merge/dedupe/group split), `train_head.py` | `backend/ml/` | `head.joblib` exists; split files written |
| T9 | Wire hybrid into runner; golden cases still pass | `runner.py` | hybrid mode shown in `engine.mode` |
| T10 | TS `ruleEngine.ts` + `localEngine.ts` (+ parity script reading `golden_cases.jsonl`) | `src/services/engine/` | TS results ≈ Python results on golden set |
| T11 | `apiClient.ts`, `scamService.ts` (+zod parse, timeouts, `fetch` FormData) | `src/services/api/` | text request works from phone |
| T12 | `analyze.ts` orchestrator + `useScanner.ts` + store changes | `src/services/engine, hooks, store` | kill server → offline result |
| T13 | Admin settings: URL/key/test/engine toggle | `AdminSettings` screen | URL change takes effect without reload |
| T14 | Result screen rewrite (§8) | `ScamAnalysisResultScreen.tsx` | no hard-coded metrics; highlights render |
| T15 | `whisper_service.py` + `/v1/analyze/audio` | `backend/app/asr` | 15 s clip → transcript + result |
| T16 | `VoiceScannerScreen` (record + pick + upload) | `src/screens/scanner` | works with a pre-recorded clip |
| T17 | `evaluate.py` + `eval.md` (§7.2) | `backend/ml` | table with rules/semantic/hybrid |
| T18 | `/v1/feedback` + SQLite + app wiring | `routers/feedback.py, storage/db.py` | Report/Mark-safe stores a row |
| T19 | Scanner screen refactor (§8): templates fill input only; trace replay; engine chip | `ScannerScreen.tsx` | no `setTimeout` simulation left |
| T20 | Update `ARCHITECTURE.md` (SDK 54, real architecture), README claims per §3, ASIP wording | docs | matches reality |
| T21 (P2) | `GET /v1/rules` + app refresh on launch | backend + `services` | edit rules on server → app picks them up |
| T22 (P2) | Pseudo-live: 8 s audio chunks → rolling transcript → live risk meter | Voice screen | meter updates during recording |

---

## 12. How this scales to the full product (no rewrites)

The contract (§5) and three interfaces are the extension points: **`SemanticScorer`**, **`Transcriber`**, **`InputSource`**.

| Roadmap item (your ARCHITECTURE.md phases) | What changes | What stays |
|---|---|---|
| **Phase 4 – on-device model** | Export e5-small + LR head to ONNX int8; run with `onnxruntime-react-native` in an **EAS dev build** (not Expo Go). Implement `SemanticScorer` on device; `engineMode: device`. | UI, contract, rules, store, golden tests. |
| **SMS / notification scanning** | Native Android module (SMS receiver / NotificationListener) in a dev build → feeds `analyze(text, 'sms')`. Needs runtime permissions and Google Play policy review for SMS access; pilot via sideloaded APK first. | Whole pipeline. |
| **Live call analysis** | Android restricts third-party call-audio capture; realistic path is user-consented speakerphone/mic capture streamed in short chunks (the P2 chunked meter is the prototype). | `/analyze/audio`, fusion. |
| **More languages** | Add patterns + data per language; swap Whisper size; run per-language eval before claiming support. | Everything else. |
| **Rules updates without APK** | `GET /v1/rules` + versioning (T21). | — |
| **Backend hosting** | Containerize; SQLite→Postgres; deploy stateless FastAPI (Cloud Run/Render). Needs ≥ 2–4 GB RAM for torch + e5 + Whisper small, so free tiers are tight. | Contract. |
| **Federated learning** | Only meaningful once on-device scoring + feedback exist; keep as research roadmap. | — |

---

## 13. Demo plan

### 13.1 Script (≈ 6 min)
1. **Problem (30 s):** field-visit finding — expert at CEN Police Station, age-wise victim patterns, "tools check who's calling, not what's said".
2. **Digital-arrest scam in Hinglish** → trace replay → danger, highlighted evidence, sub-scores, "Call 1930".
3. **Genuine bank OTP SMS** → safe. **Friend chat with "won't / courtesy / company"** → safe. (State: "keyword matching fails here; ours doesn't.")
4. **Voice:** play pre-recorded scam call clip → transcript → danger.
5. **Kill the server** (or toggle "Force offline") → scan again → "Offline · rules on-device".
6. **Evidence:** eval table (rules vs ML vs hybrid, FPR), honest-claims slide, roadmap.

### 13.2 Golden cases (put in `shared/golden_cases.jsonl`: `{text, expectLevel, expectType?}`)
| # | Text (abridged) | Expect |
|---|---|---|
| 1 | "482913 is your OTP for HDFC Bank NetBanking login. Do not share it with anyone." | safe |
| 2 | "Rs 1,250.00 debited from A/c XX4821 on 02-Oct-26 at AMAZON PAY. Avl Bal Rs 8,420.15." | safe |
| 3 | "I won't be late, thanks for your courtesy. Bringing the company's expansion plan, and we can learn the bill split later." | safe |
| 4 | "Your Amazon order has shipped and will arrive Oct 4. Track at amazon.in/track" | safe |
| 5 | "This is Inspector Rao from CBI. A parcel in your name contains narcotics. You are under digital arrest. Stay on the video call, do not tell anyone, transfer Rs 50,000 for verification." | danger · digital_arrest |
| 6 | "Aapke naam par parcel mein drugs mile hain. Aap digital arrest mein hain, kisi ko mat batana, turant verification ke liye paise transfer karo." | danger · digital_arrest |
| 7 | "प्रिय ग्राहक, आपका SBI खाता आज बंद हो जाएगा। तुरंत KYC अपडेट करें: http://sbi-kyc-update.xyz/login" | danger · credential_phishing |
| 8 | "ALERT: your electricity power connection will be disconnected tonight at 9.30 PM. Call power officer at 9812345678 immediately." | danger · utility_disconnection |
| 9 | "CONGRATULATIONS! You won 25,00,000 INR in KBC Lucky Draw. Contact manager Mr. Kumar at 9999123456 to claim." | danger · lottery_prize |
| 10 | "Part time job! Earn Rs 5000 daily by liking YouTube videos. Join our Telegram group." | danger · fake_job |
| 11 | "Join our VIP stock group — guaranteed 300% returns in 30 days, limited seats, UPI deposit required." | danger · investment_fraud |
| 12 | "Your SBI rewards expire today! Install the app: http://bit.ly/sbi-rewards.apk" | danger · malicious_app_or_hijack |
| 13 | "Dial *401*9XXXXXXXXX# to confirm your delivery slot." | danger · malicious_app_or_hijack |
| 14 | "Your instant loan is overdue. Pay now or we will message all your contacts about your default." | danger · loan_harassment |
| 15 | "Hi, can you check this link http://tinyurl.com/x9s2 ?" | suspicious |
| 16 | "ನಿಮ್ಮ ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಇಂದು ರಾತ್ರಿ ಕಡಿತಗೊಳ್ಳುತ್ತದೆ. ತಕ್ಷಣ ಈ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ" *(experimental; have a Kannada speaker verify wording)* | danger |

Note: #2 and #4 must stay `safe`/`≤ 20` — they are the false-positive tests.

---

## 14. Risk register

| Risk | Likelihood | Impact | Response |
|---|---|---|---|
| Network blocks phone→laptop | High | High | Hotspot / tunnel; offline fallback demo step |
| False positive on live input | Med | High | Golden FP cases; benign templates; disagreement clamp |
| Semantic model weak on Hindi/Kannada | Med | Med | Rules cover those languages; per-language eval; don't over-claim |
| Whisper slow/inaccurate | Med | Med | `base` model, short clips, pre-recorded audio |
| Scope creep | High | High | Feature freeze Sun 9 pm; cut order in §10 |
| AI-generated code drifts from contract | Med | Med | Contract in every prompt; zod/pydantic parity; golden tests as the gate |
| Synthetic-data accuracy looks too good | Med | Med | Group split, FP stress set, state clearly that data is synthetic |

---

## Appendix A — Agent rules (paste at the top of every AI coding session)

```
Project: Rakshak AI — Expo SDK 54, React Native 0.81, TypeScript strict, Zustand, React Native Paper; backend in /backend (FastAPI, pydantic v2).
- The API contract in §5 is the source of truth. Never change field names/shapes without updating BOTH backend/app/schemas.py and src/types/analysis.ts (zod) and the golden tests.
- shared/rules.json is the single source of detection rules. Do not duplicate keyword lists in code.
- No `any`; validate all server responses with zod. Use theme tokens, no hard-coded colours/spacings except existing ones.
- Never print or simulate pipeline stages that did not run. UI must not display fabricated metrics.
- Latin keywords use word-boundary-style lookarounds; Indic scripts use substring matching. Respect the negation guard.
- Never log message text on the server unless LOG_TEXT=true.
- Don't add dependencies without saying why. Prefer `npx expo install` for Expo packages.
- Every change must keep `pytest` (golden cases) and `npm run ts:check` green.
```

## Appendix B — Dataset generation prompt (use per batch)

```
Generate 40 SMS/WhatsApp/call-transcript messages as JSON lines with fields:
text, label ("scam"|"genuine"), scam_type, lang (en|hinglish|hi|kn), template_group.
Context: India. Scam types: digital_arrest, credential_phishing, utility_disconnection, lottery_prize, fake_job, investment_fraud, loan_harassment, malicious_app_or_hijack.
Genuine types: bank OTP, debit/credit alert, delivery update, telecom, real utility bill notice, friend/family chat, plus hard negatives that use words like "won", "bill", "court", "bank", "link" innocently.
Rules: vary length (1–5 sentences), tone, and sender style; use fake phone numbers/URLs only; no real brands' real URLs; 50% scam / 50% genuine; give each paraphrase family the same template_group.
```

## Appendix C — Backend `requirements.txt` (pin versions after first successful install via `pip freeze`)
```
fastapi
uvicorn[standard]
pydantic>=2
pydantic-settings
python-multipart
sentence-transformers
torch            # CPU build is fine
scikit-learn
joblib
numpy
faster-whisper
pytest
httpx
```

## Appendix D — Questions I assumed answers to (correct me where wrong)
1. Demo on an **Android phone with Expo Go**, laptop as server, both on one network (hotspot fallback).
2. Laptop has ≥ 8 GB RAM; CPU-only is fine.
3. Voice is **P1**, and recorded/uploaded clips are acceptable (no live-call capture).
4. Languages shown live: English, Hindi, Hinglish; Kannada only if the eval supports it.
5. No Gemini/cloud LLM in the demo (keeps the privacy story clean).
6. Mam expects the objectives in your ASIP report (dataset, classifier, risk indicators, prototype, evaluation) — hence the dataset + `eval.md` tasks.
