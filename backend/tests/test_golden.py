import json
from pathlib import Path

from app.pipeline.rules import analyze_text


def test_golden_cases():
    cases_path = Path(__file__).resolve().parents[2] / "shared" / "golden_cases.jsonl"
    for line in cases_path.read_text(encoding="utf-8").splitlines():
        case = json.loads(line)
        result = analyze_text(case["text"])
        assert result.level == case["expectLevel"], case["text"]
        if "expectType" in case:
            assert result.scamTypeId == case["expectType"], case["text"]
