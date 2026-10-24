"""Hemp and sisal bale stock ledger."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..aggregates import fibre_totals
from ..db import get_db
from ..models import Bale, BaleStatus, User
from ..schemas import BaleCreate, BaleListOut, BaleOut, BaleUpdate
from ..security import get_current_user
from ..serializers import bale_out

router = APIRouter(prefix="/bales", tags=["bales"])

def _user_bale(db: Session, bale_id: int, user: User) -> Bale:
    bale = db.scalar(select(Bale).where(Bale.id == bale_id, Bale.user_id == user.id))
    if bale is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bale not found")
    return bale


@router.get("", response_model=BaleListOut)
def list_bales(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    bales = db.scalars(
        select(Bale)
        .where(Bale.user_id == current_user.id)
        .order_by(Bale.received_on.desc(), Bale.id.desc())
    ).all()
    return {
        "items": [bale_out(bale) for bale in bales],
        "totals": fibre_totals(bales),
        "used_count": sum(1 for bale in bales if bale.status == BaleStatus.used),
    }


@router.post("", response_model=BaleOut, status_code=status.HTTP_201_CREATED)
def create_bale(
    payload: BaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    bale = Bale(user_id=current_user.id, **payload.model_dump())
    db.add(bale)
    db.commit()
    db.refresh(bale)
    return bale_out(bale)


@router.patch("/{bale_id}", response_model=BaleOut)
def update_bale(
    bale_id: int,
    payload: BaleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    bale = _user_bale(db, bale_id, current_user)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="No fields to update")
    for field, value in changes.items():
        setattr(bale, field, value)
    db.add(bale)
    db.commit()
    db.refresh(bale)
    return bale_out(bale)


@router.delete("/{bale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bale(
    bale_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    bale = _user_bale(db, bale_id, current_user)
    db.delete(bale)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
