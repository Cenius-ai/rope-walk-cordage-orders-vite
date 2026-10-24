"""Authentication and ropemaker profile endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import User
from ..schemas import LoginRequest, LoginResponse, ProfileUpdate, UserOut
from ..security import create_access_token, get_current_user, hash_password, verify_password
from ..serializers import user_out

router = APIRouter(prefix="/auth", tags=["auth"])

# Verified against when the email is unknown so a failed lookup costs the same
# time as a failed password check (no account enumeration by timing).
_DUMMY_HASH = hash_password("cenius-dummy-password-not-a-real-account")

_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Email or password is incorrect",
)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    email = payload.email.strip().lower()
    user = db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None:
        verify_password(payload.password, _DUMMY_HASH)
        raise _INVALID_CREDENTIALS
    if not verify_password(payload.password, user.password_hash):
        raise _INVALID_CREDENTIALS
    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.jwt_expires_minutes * 60,
        "user": user_out(user),
    }


@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)) -> dict:
    return user_out(current_user)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="No fields to update")
    for field, value in changes.items():
        setattr(current_user, field, value)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return user_out(current_user)
