"""User authentication endpoints (P4).

Endpoints:
  POST /v1/auth/register  - create a new user account
  POST /v1/auth/login     - authenticate and return a JWT access token
  GET  /v1/auth/me        - get the current authenticated user's profile
"""

from __future__ import annotations

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import create_access_token, generate_user_id, hash_password
from app.schemas import (
    AuthErrorResponse,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.storage.db import authenticate_user as db_authenticate_user, create_user, get_user_by_email, get_user_by_id

router = APIRouter()

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> dict[str, object]:
    """Dependency to extract and validate the current user from a Bearer token."""
    token = credentials.credentials
    from app.auth import decode_access_token

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_id(user_id)
    if not user or not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/v1/auth/register", response_model=TokenResponse)
def register(request: UserRegisterRequest) -> TokenResponse:
    existing = get_user_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user_id = generate_user_id()
    password_hash = hash_password(request.password)

    create_user(
        user_id=user_id,
        email=request.email,
        password_hash=password_hash,
        name=request.name,
        phone_number=request.phone_number,
        preferred_language=request.preferred_language,
    )

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )

    access_token = create_access_token(data={"sub": user["id"]})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(user["id"]),
            email=str(user["email"]),
            name=user.get("name"),
            phone_number=user.get("phone_number"),
            preferred_language=str(user.get("preferred_language", "en")),
            created_at=int(user["created_at"]),
            is_active=bool(user["is_active"]),
        ),
    )


@router.post("/v1/auth/login", response_model=TokenResponse)
def login(request: UserLoginRequest) -> TokenResponse:
    user = db_authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user["id"])})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(user["id"]),
            email=str(user["email"]),
            name=user.get("name"),
            phone_number=user.get("phone_number"),
            preferred_language=str(user.get("preferred_language", "en")),
            created_at=int(user["created_at"]),
            is_active=bool(user["is_active"]),
        ),
    )


@router.get("/v1/auth/me", response_model=UserResponse)
def get_me(current_user: Annotated[dict[str, object], Depends(get_current_user)]) -> UserResponse:
    return UserResponse(
        id=str(current_user["id"]),
        email=str(current_user["email"]),
        name=current_user.get("name"),
        phone_number=current_user.get("phone_number"),
        preferred_language=str(current_user.get("preferred_language", "en")),
        created_at=int(current_user["created_at"]),
        is_active=bool(current_user["is_active"]),
    )
