"""User authentication utilities (P4).

Password hashing with bcrypt via passlib, JWT access tokens via PyJWT.
Configure via environment variables:
  RAKSHAK_JWT_SECRET   - secret key for signing JWTs (required in production)
  RAKSHAK_JWT_ALGORITHM - algorithm (default HS256)
  RAKSHAK_JWT_EXPIRE_MINUTES - token expiry (default 10080 = 7 days)
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

# Password hashing context.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings.
JWT_SECRET = os.getenv("RAKSHAK_JWT_SECRET", "rakshak-dev-secret-change-in-production")
JWT_ALGORITHM = os.getenv("RAKSHAK_JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("RAKSHAK_JWT_EXPIRE_MINUTES", "10080"))  # 7 days


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_user_id() -> str:
    import uuid

    return str(uuid.uuid4())
