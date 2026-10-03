from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.pipeline.rules import RULES, analyze_text
from app.routers.audio import router as audio_router
from app.routers.feedback import router as feedback_router
from app.schemas import AnalyzeTextRequest, AnalysisResult
from app.storage.db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Rakshak AI API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Local evaluation prototype; restrict this before deployment.
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(feedback_router)
app.include_router(audio_router)


@app.get("/")
def root() -> dict[str, object]:
    return {"service": "Rakshak AI API", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health() -> dict[str, object]:
    from app.pipeline import llm as llm_mod
    from app.pipeline import semantic as semantic_mod

    return {
        "status": "ok",
        "engine": "rules-only",
        "rulesVersion": RULES["version"],
        "llm": "ready" if llm_mod.is_available() else "off",
        "semantic": "ready" if semantic_mod.is_available() else "off",
    }


@app.get("/v1/rules")
def get_rules() -> dict[str, object]:
    """P2 OTA: app can refresh rules without a new build. Server mode uses this live."""
    return RULES


@app.post("/v1/analyze/text", response_model=AnalysisResult)
def analyze(request: AnalyzeTextRequest) -> AnalysisResult:
    try:
        return analyze_text(request.text)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
