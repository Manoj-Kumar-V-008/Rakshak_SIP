from __future__ import annotations

from fastapi import APIRouter

from app.schemas import FeedbackRequest, FeedbackResponse
from app.storage.db import save_feedback

router = APIRouter()


@router.post("/v1/feedback", response_model=FeedbackResponse)
def submit_feedback(request: FeedbackRequest) -> FeedbackResponse:
    save_feedback(request.analysisId, request.verdict, request.text)
    return FeedbackResponse(ok=True)
