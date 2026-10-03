"""SQLite storage for user feedback. Text is stored only when the user explicitly reports."""

from __future__ import annotations

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
