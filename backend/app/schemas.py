from __future__ import annotations

from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class AnalyzeTextRequest(BaseModel):
    text: str = Field(min_length=5, max_length=1_000)
    lang: str = "auto"
    source: Literal["paste", "sms", "transcript"] = "paste"


class Match(BaseModel):
    start: int = Field(ge=0)
    end: int = Field(gt=0)
    text: str


class Signal(BaseModel):
    id: str
    label: str
    category: Literal["urgency", "impersonation", "coercion", "financial", "link"]
    weight: float = Field(ge=0, le=1)
    matches: list[Match]


class SubScores(BaseModel):
    urgency: int = Field(ge=0, le=100)
    impersonation: int = Field(ge=0, le=100)
    coercion: int = Field(ge=0, le=100)
    financialAsk: int = Field(ge=0, le=100)


class Engine(BaseModel):
    mode: Literal["rules-only"] = "rules-only"
    rulesVersion: str
    latencyMs: int = Field(ge=0)


class TraceStep(BaseModel):
    stage: str
    ms: int = Field(ge=0)
    detail: str


class AnalysisResult(BaseModel):
    analysisId: str = Field(default_factory=lambda: str(uuid4()))
    displayText: str
    riskScore: int = Field(ge=0, le=100)
    level: Literal["safe", "suspicious", "danger"]
    scamTypeId: str
    scamType: str
    indicators: list[str]
    remediationSteps: list[str]
    subScores: SubScores
    signals: list[Signal]
    entities: dict[str, list[str]]
    detectedLanguage: str
    scores: dict[str, float | None]
    engine: Engine
    trace: list[TraceStep]
