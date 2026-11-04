from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.pipeline.rules import RULES, analyze_text
from app.routers.audio import router as audio_router
from app.routers.feedback import router as feedback_router
from app.routers.link import router as link_router
from app.routers.file import router as file_router
from app.routers.report import router as report_router
from app.routers.auth import router as auth_router
from app.pipeline.safe_browsing import is_available as sb_is_available
from app.pipeline.virustotal import is_available as vt_is_available
from app.schemas import AnalyzeTextRequest, AnalysisResult
from app.storage.db import init_db, init_reported_links, init_users


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    init_reported_links()
    init_users()
    yield


app = FastAPI(title="Rakshak AI API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(feedback_router)
app.include_router(audio_router)
app.include_router(link_router)
app.include_router(file_router)
app.include_router(report_router)
app.include_router(auth_router)


@app.get("/")
def root() -> dict[str, object]:
    return {"service": "Rakshak AI API", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health(req: Request) -> dict[str, object]:
    from app.pipeline import llm as llm_mod
    from app.pipeline import semantic as semantic_mod

    client_key = req.headers.get("x-gemini-api-key")
    llm_ready = llm_mod.is_available(override_key=client_key)
    semantic_ready = semantic_mod.is_available()
    engine_mode = "hybrid-llm" if llm_ready else ("hybrid" if semantic_ready else "rules-only")

    return {
        "status": "ok",
        "engine": engine_mode,
        "rulesVersion": RULES["version"],
        "llm": "ready" if llm_ready else "off",
        "semantic": "ready" if semantic_ready else "off",
        "safeBrowsing": "ready" if sb_is_available() else "off",
        "virustotal": "ready" if vt_is_available() else "off",
    }


@app.get("/v1/rules")
def get_rules() -> dict[str, object]:
    """P2 OTA: app can refresh rules without a new build. Server mode uses this live."""
    return RULES


@app.post("/v1/analyze/text", response_model=AnalysisResult)
def analyze(request: AnalyzeTextRequest, req: Request) -> AnalysisResult:
    try:
        client_key = req.headers.get("x-gemini-api-key")
        return analyze_text(request.text, gemini_key=client_key)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
