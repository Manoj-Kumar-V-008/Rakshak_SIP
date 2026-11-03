"""Crowd-sourced scam link reporting (P3).

Users can report a link as a scam. Reported links are stored server-side and
served as a blocklist that all clients consult during link verification, so
one user's report helps protect everyone.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas import ReportLinkRequest, ReportLinkResponse, ReportedLinkEntry
from app.storage.db import get_reported_links, is_reported_link, save_reported_link

router = APIRouter()


@router.post("/v1/report/link", response_model=ReportLinkResponse)
def report_link(request: ReportLinkRequest) -> ReportLinkResponse:
    link_id = save_reported_link(
        original_url=request.originalUrl,
        expanded_url=request.expandedUrl,
        domain=request.domain,
        reporter_text=request.reporterText,
    )
    return ReportLinkResponse(ok=True, id=link_id)


@router.get("/v1/report/links", response_model=list[ReportedLinkEntry])
def list_reported_links() -> list[ReportedLinkEntry]:
    rows = get_reported_links()
    return [
        ReportedLinkEntry(
            originalUrl=row["original_url"],
            expandedUrl=row.get("expanded_url"),
            domain=row["domain"],
            reporterText=row.get("reporter_text"),
            createdAt=row["created_at"],
        )
        for row in rows
    ]


@router.get("/v1/report/check/{domain:path}")
def check_reported(domain: str) -> dict[str, object]:
    """Quick check whether a domain has been crowd-reported as a scam."""
    reported = is_reported_link(domain)
    return {"reported": reported}
