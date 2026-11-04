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
    mode: Literal["rules-only", "hybrid", "hybrid-llm"] = "rules-only"
    model: str | None = None
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
    transcript: str | None = None


class FeedbackRequest(BaseModel):
    analysisId: str = Field(min_length=1, max_length=100)
    verdict: Literal["scam_confirmed", "false_positive", "missed_scam"]
    text: str | None = Field(default=None, max_length=1_000)


class FeedbackResponse(BaseModel):
    ok: bool


# --- Link verification schemas ---

class UrlCheck(BaseModel):
    original: str
    expanded: str | None = None
    domain: str | None = None
    scheme: str | None = None
    isHttps: bool = False
    redirectChain: list[str] = []
    verdict: Literal["safe", "suspicious", "danger"]
    riskScore: int = Field(ge=0, le=100)
    reasons: list[str] = []
    reputation: dict[str, object] | None = None


class LinkAnalysisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2_000)


class LinkAnalysisResult(BaseModel):
    analysisId: str = Field(default_factory=lambda: str(uuid4()))
    inputText: str
    urls: list[UrlCheck]
    overallVerdict: Literal["safe", "suspicious", "danger"]
    overallRiskScore: int = Field(ge=0, le=100)
    engine: dict[str, object]
    trace: list[dict[str, object]]


# --- Crowd-sourced link reporting schemas ---

class ReportLinkRequest(BaseModel):
    originalUrl: str = Field(min_length=1, max_length=2_000)
    expandedUrl: str | None = Field(default=None, max_length=2_000)
    domain: str = Field(min_length=1, max_length=255)
    reporterText: str | None = Field(default=None, max_length=1_000)


class ReportLinkResponse(BaseModel):
    ok: bool
    id: int


class ReportedLinkEntry(BaseModel):
    originalUrl: str
    expandedUrl: str | None
    domain: str
    reporterText: str | None
    createdAt: int


# --- File analysis schemas ---

class FileAnalysisRequest(BaseModel):
    fileName: str = Field(min_length=1, max_length=255)
    fileContentBase64: str = Field(min_length=1)  # base64-encoded file contents
    maxSizeBytes: int = Field(default=25_000_000)  # 25MB default limit


class FileVerdict(BaseModel):
    verdict: Literal["safe", "suspicious", "danger", "unknown"]
    riskScore: int = Field(ge=0, le=100)
    reasons: list[str] = []
    reputation: dict[str, object] | None = None


class FileAnalysisResult(BaseModel):
    analysisId: str = Field(default_factory=lambda: str(uuid4()))
    fileName: str
    fileSizeBytes: int
    sha256: str
    verdict: FileVerdict
    engine: dict[str, object]
    trace: list[dict[str, object]]


# --- User authentication schemas ---

class UserRegisterRequest(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    name: str | None = Field(default=None, max_length=100)
    phone_number: str | None = Field(default=None, max_length=20)
    preferred_language: str = Field(default="en", max_length=10)


class UserLoginRequest(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None = None
    phone_number: str | None = None
    preferred_language: str
    created_at: int
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AuthErrorResponse(BaseModel):
    detail: str
