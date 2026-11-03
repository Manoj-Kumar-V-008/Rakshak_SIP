"""SQLite storage for user feedback. Text is stored only when the user explicitly reports."""

from __future__ import annotations

import re
import sqlite3
import time
from pathlib import Path


def _db_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "rakshak.db"


def init_db() -> Path:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id TEXT NOT NULL,
                verdict TEXT NOT NULL,
                text TEXT,
                created_at INTEGER NOT NULL
            )
            """
        )
    return path


def save_feedback(analysis_id: str, verdict: str, text: str | None) -> int:
    init_db()
    with sqlite3.connect(_db_path()) as conn:
        cursor = conn.execute(
            "INSERT INTO feedback (analysis_id, verdict, text, created_at) VALUES (?, ?, ?, ?)",
            (analysis_id, verdict, text, int(time.time())),
        )
        return cursor.lastrowid or 0


# --- Crowd-sourced scam links ---

def init_reported_links() -> None:
    init_db()
    with sqlite3.connect(_db_path()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reported_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_url TEXT NOT NULL,
                expanded_url TEXT,
                domain TEXT NOT NULL,
                reporter_text TEXT,
                created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_reported_links_domain ON reported_links(domain)"
        )


def save_reported_link(original_url: str, expanded_url: str | None, domain: str, reporter_text: str | None) -> int:
    init_reported_links()
    with sqlite3.connect(_db_path()) as conn:
        cursor = conn.execute(
            "INSERT INTO reported_links (original_url, expanded_url, domain, reporter_text, created_at) VALUES (?, ?, ?, ?, ?)",
            (original_url, expanded_url, domain, reporter_text, int(time.time())),
        )
        return cursor.lastrowid or 0


def get_reported_links() -> list[dict[str, object]]:
    init_reported_links()
    with sqlite3.connect(_db_path()) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT original_url, expanded_url, domain, reporter_text, created_at FROM reported_links ORDER BY created_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]


def is_reported_link(url: str) -> bool:
    """Check if a URL or its domain has been crowd-reported as a scam."""
    init_reported_links()
    domain = _domain(url)
    if not domain:
        return False
    with sqlite3.connect(_db_path()) as conn:
        conn.row_factory = sqlite3.Row
        # Match by exact URL or by domain.
        row = conn.execute(
            "SELECT 1 FROM reported_links WHERE original_url = ? OR expanded_url = ? OR domain = ? LIMIT 1",
            (url, url, domain),
        ).fetchone()
        return row is not None


def _domain(url: str) -> str | None:
    from urllib.parse import urlparse
    try:
        # urlparse needs a scheme to extract the hostname; add one if missing.
        if not re.match(r"^https?://", url, re.IGNORECASE):
            url = "http://" + url
        return (urlparse(url).hostname or "").lower()
    except Exception:
        return None


# --- User accounts ---

def init_users() -> None:
    init_db()
    with sqlite3.connect(_db_path()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                phone_number TEXT,
                preferred_language TEXT DEFAULT 'en',
                created_at INTEGER NOT NULL,
                is_active INTEGER DEFAULT 1
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
        )


def create_user(
    user_id: str,
    email: str,
    password_hash: str,
    name: str | None = None,
    phone_number: str | None = None,
    preferred_language: str = "en",
) -> int:
    init_users()
    with sqlite3.connect(_db_path()) as conn:
        cursor = conn.execute(
            """
            INSERT INTO users (id, email, password_hash, name, phone_number, preferred_language, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, email, password_hash, name, phone_number, preferred_language, int(time.time())),
        )
        return cursor.lastrowid or 0


def get_user_by_email(email: str) -> dict[str, object] | None:
    init_users()
    with sqlite3.connect(_db_path()) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT id, email, password_hash, name, phone_number, preferred_language, created_at, is_active FROM users WHERE email = ?",
            (email,),
        ).fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: str) -> dict[str, object] | None:
    init_users()
    with sqlite3.connect(_db_path()) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT id, email, password_hash, name, phone_number, preferred_language, created_at, is_active FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None


def authenticate_user(email: str, password: str) -> dict[str, object] | None:
    from app.auth import verify_password

    user = get_user_by_email(email)
    if not user or not user.get("is_active"):
        return None
    if not verify_password(password, str(user["password_hash"])):
        return None
    return user
