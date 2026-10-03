from app.pipeline.fusion import fuse


def test_rules_only_passthrough():
    fused, risk, level = fuse(0.84, None, "unverified", False)
    assert fused == 0.84
    assert risk == 84
    assert level == "danger"


def test_type_floor_applies():
    fused, risk, level = fuse(0.2, None, "digital_arrest", False)
    assert fused == 0.85
    assert risk == 85
    assert level == "danger"


def test_benign_cap():
    fused, risk, level = fuse(0.9, None, "unverified", True)
    assert fused <= 0.10
    assert level == "safe"


def test_hybrid_averages():
    fused, _, _ = fuse(0.8, 0.6, "suspicious_link", False)
    assert abs(fused - 0.7) < 1e-9


def test_disagreement_clamps_to_suspicious():
    fused, risk, level = fuse(0.9, 0.1, "suspicious_link", False)
    assert 0.35 <= fused <= 0.65
    assert level == "suspicious"
    assert risk == round(fused * 100)
