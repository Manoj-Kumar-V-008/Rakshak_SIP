from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analysis_has_explainable_contract():
    response = client.post("/v1/analyze/text", json={"text": "Call me immediately and share your OTP."})
    assert response.status_code == 200
    body = response.json()
    assert body["level"] == "danger"
    assert body["signals"]
    assert body["engine"]["mode"] == "rules-only"
