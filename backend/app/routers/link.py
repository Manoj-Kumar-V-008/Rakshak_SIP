"""Link verification endpoint (P2 + P3).

Given a message containing one or more URLs, expand shortened links by
following redirects and score each destination for scam indicators
(suspicious TLD, URL shortener, HTTP instead of HTTPS, scammy keywords).

Optionally checks expanded URLs against Google Safe Browsing for real-time
phishing/malware reputation (requires SAFE_BROWSING_API_KEY).

This never renders the page body - only headers/redirects are inspected -
so the user's device never loads potentially malicious content.
"""

from __future__ import annotations

import asyncio
import re
import uuid
from typing import Any, Literal
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter

from app.pipeline.safe_browsing import check_urls, is_available as sb_is_available
from app.schemas import LinkAnalysisRequest, LinkAnalysisResult, UrlCheck
from app.storage.db import is_reported_link

router = APIRouter()

# Suspicious / free TLDs often abused by scam campaigns.
SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".click", ".rest", ".loan", ".date", ".racing", ".win",
    ".review", ".download", ".gdn", ".cm", ".cf", ".ga", ".gq", ".ml", ".tk",
    ".buzz", ".men", ".party", ".bid",
}

# URL shorteners that hide the real destination.
SHORTENERS = {
    "bit.ly", "bitly.com", "tinyurl.com", "t.co", "tiny.cc", "rebrand.ly",
    "cutt.ly", "shorte.st", "adf.ly", "bit.do", "ow.ly", "is.gd", "buff.ly",
    "po.st", "goo.gl", "tr.im", "cli.gs", "url.ie",
}

# Keywords that commonly appear in scam domains / subdomains.
SCAMMY_KEYWORDS = {
    "kyc", "verify", "verification", "secure", "account", "bank", "sbi",
    "hdfc", "icici", "axis", "paytm", "phonepe", "gpay", "google-pay",
    "update", "login", "signin", "confirm", "suspended", "blocked",
    "unblock", "reactivate", "instant", "prize", "lottery", "reward",
    "cashback", "refund",
}

URL_RE = re.compile(r"(?:https?://|www\.)[^\s<>]+", re.IGNORECASE)


def _extract_urls(text: str) -> list[str]:
    return URL_RE.findall(text)


def _normalise(url: str) -> str:
    if not re.match(r"^https?://", url, re.IGNORECASE):
        return "http://" + url
    return url


def _domain(url: str) -> str | None:
    try:
        return (urlparse(url).hostname or "").lower()
    except Exception:
        return None


def _tld(domain: str) -> str:
    *_, last = domain.rsplit(".", 1)
    return "." + last.lower()


def _is_shortener(domain: str) -> bool:
    return any(domain == s or domain.endswith("." + s) for s in SHORTENERS)


def _has_scammy_keywords(domain: str) -> bool:
    lower = domain.lower()
    return any(kw in lower for kw in SCAMMY_KEYWORDS)


def _expand_sync(url: str) -> dict[str, Any]:
    """Follow redirects with a HEAD request (blocking, run in a thread)."""
    chain = [url]
    final_url = url
    try:
        with httpx.Client(
            follow_redirects=True,
            timeout=8.0,
            headers={"User-Agent": "RakshakAI/1.0 link-checker"},
        ) as client:
            response = client.head(url)
            final_url = str(response.url)
            for hop in response.history:
                chain.append(str(hop.url))
            chain.append(final_url)
    except Exception:
        pass
    return {
        "original": url,
        "expanded": final_url if final_url != url else None,
        "final": final_url,
        "chain": chain,
    }


def _score(check: UrlCheck, reputation: dict[str, Any] | None = None) -> UrlCheck:
    reasons: list[str] = []
    score = 0

    domain = check.domain or ""
    tld = _tld(domain) if domain else ""
    expanded_host = _domain(check.expanded or check.original) if check.expanded else None

    if not check.isHttps:
        reasons.append("http_not_https")
        score += 35

    if check.expanded and check.expanded != check.original:
        reasons.append("shortened_url")
        score += 25

    if len(check.redirectChain) > 2:
        reasons.append("redirect_chain")
        score += 15

    if tld in SUSPICIOUS_TLDS:
        reasons.append("suspicious_tld")
        score += 30

    if _is_shortener(domain) or (expanded_host and _is_shortener(expanded_host)):
        reasons.append("url_shortener")
        score += 20

    if _has_scammy_keywords(domain):
        reasons.append("scammy_keywords")
        score += 20

    # --- Crowd-sourced blocklist check ---
    crowd_reported = False
    if domain and is_reported_link(domain):
        crowd_reported = True
        reasons.append("crowd_reported_scam")
        score = 100  # Crowd-confirmed scam -> immediate danger

    # --- Reputation (Safe Browsing) ---
    if reputation:
        threat_type = reputation.get("threatType", "UNKNOWN")
        reasons.append(f"reputation:{threat_type.lower()}")
        score = 100

    score = min(score, 100)

    if score >= 60:
        verdict: Literal["safe", "suspicious", "danger"] = "danger"
    elif score >= 30:
        verdict = "suspicious"
    else:
        verdict = "safe"

    check.reasons = reasons
    check.riskScore = score
    check.verdict = verdict
    if reputation:
        check.reputation = reputation
    if crowd_reported:
        check.reputation = check.reputation or {}
        check.reputation["crowdReported"] = True
    return check


@router.post("/v1/analyze/link", response_model=LinkAnalysisResult)
async def analyze_link(request: LinkAnalysisRequest) -> LinkAnalysisResult:
    urls = _extract_urls(request.text)

    # Stage 1: expand all URLs (follow redirects via HEAD).
    expansions: list[dict[str, Any]] = []
    for raw in urls:
        url = _normalise(raw)
        expansion = await asyncio.to_thread(_expand_sync, url)
        expansions.append(expansion)

    # Stage 2: reputation check on expanded destinations (if API key configured).
    reputation_results: dict[str, dict[str, Any]] = {}
    if sb_is_available():
        expanded_urls = [e["final"] for e in expansions]
        reputation_results = await asyncio.to_thread(check_urls, expanded_urls)

    # Stage 3: score each URL.
    checks: list[UrlCheck] = []
    for raw, expansion in zip(urls, expansions):
        final = expansion["final"]
        domain = _domain(final)
        reputation = reputation_results.get(final)
        check = UrlCheck(
            original=raw,
            expanded=expansion["expanded"],
            domain=domain,
            scheme=urlparse(final).scheme or None,
            isHttps=urlparse(final).scheme == "https",
            redirectChain=expansion["chain"],
            verdict="safe",
            riskScore=0,
            reasons=[],
        )
        checks.append(_score(check, reputation))

    if not checks:
        overall_verdict: Literal["safe", "suspicious", "danger"] = "safe"
        overall_score = 0
    else:
        overall_score = max(c.riskScore for c in checks)
        if overall_score >= 60:
            overall_verdict = "danger"
        elif overall_score >= 30:
            overall_verdict = "suspicious"
        else:
            overall_verdict = "safe"

    engine_mode = "link-verifier+safebrowsing" if sb_is_available() else "link-verifier"

    return LinkAnalysisResult(
        inputText=request.text,
        urls=checks,
        overallVerdict=overall_verdict,
        overallRiskScore=overall_score,
        engine={"mode": engine_mode, "version": "1.0.0"},
        trace=[
            {"stage": "extract", "ms": 0, "detail": f"{len(urls)} url(s) found"},
            {"stage": "expand", "ms": 0, "detail": "redirects followed via HEAD"},
            {"stage": "reputation", "ms": 0, "detail": f"safebrowsing={'on' if sb_is_available() else 'off'}"},
            {"stage": "score", "ms": 0, "detail": f"overall {overall_verdict} ({overall_score}/100)"},
        ],
    )
