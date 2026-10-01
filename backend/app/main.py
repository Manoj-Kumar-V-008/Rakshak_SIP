from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.pipeline.rules import analyze_text
from app.schemas import AnalyzeTextRequest, AnalysisResult

app = FastAPI(title="Rakshak AI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Local evaluation prototype; restrict this before deployment.
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "engine": "rules-only", "rulesVersion": "1.0.0"}


@app.post("/v1/analyze/text", response_model=AnalysisResult)
def analyze(request: AnalyzeTextRequest) -> AnalysisResult:
    try:
        return analyze_text(request.text)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
