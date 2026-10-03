from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_root_links_docs():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["docs"] == "/docs"


def test_analysis_has_explainable_contract():
    response = client.post("/v1/analyze/text", json={"text": "Call me immediately and share your OTP."})
    assert response.status_code == 200
    body = response.json()
    assert body["level"] == "danger"
    assert body["signals"]
    assert body["engine"]["mode"] == "rules-only"


def test_feedback_stores_row():
    analyze = client.post("/v1/analyze/text", json={"text": "Call me immediately and share your OTP."})
    analysis_id = analyze.json()["analysisId"]
    response = client.post("/v1/feedback", json={"analysisId": analysis_id, "verdict": "scam_confirmed", "text": "Call me immediately and share your OTP."})
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_feedback_rejects_bad_verdict():
    response = client.post("/v1/feedback", json={"analysisId": "x", "verdict": "not-a-verdict"})
    assert response.status_code == 422


def test_audio_rejects_unsupported_type():
    response = client.post("/v1/analyze/audio", files={"file": ("clip.txt", b"hello", "text/plain")})
    assert response.status_code == 415


def test_audio_returns_model_not_ready_without_whisper():
    response = client.post("/v1/analyze/audio", files={"file": ("clip.wav", b"RIFF" + b"\x00" * 100, "audio/wav")})
    assert response.status_code in {200, 503}
    if response.status_code == 503:
        assert "MODEL_NOT_READY" in response.json()["detail"]


def test_audio_mocked_transcript_uses_rules_pipeline(monkeypatch):
    from app.asr import whisper_service

    monkeypatch.setattr(whisper_service, "transcribe", lambda _path: ("This is Inspector Rao from CBI. Stay on video call and transfer Rs 50000.", "en"))
    response = client.post("/v1/analyze/audio", files={"file": ("clip.wav", b"RIFF" + b"\x00" * 100, "audio/wav")})
    assert response.status_code == 200
    body = response.json()
    assert body["transcript"] is not None
    assert body["level"] == "danger"
    assert body["scamTypeId"] == "digital_arrest"


def test_rules_ota_returns_shared_version():
    response = client.get("/v1/rules")
    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "1.0.0"
    assert body["signals"]
