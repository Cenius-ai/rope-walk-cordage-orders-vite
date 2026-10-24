"""Ropewalk run list, sequenced longest finished length first."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..db import get_db
from ..models import Order, ScheduleEntry, User
from ..scheduling import generate_run_list
from ..schemas import ScheduleRowOut, ScheduleUpdate
from ..security import get_current_user
from ..serializers import schedule_row_out

router = APIRouter(prefix="/schedule", tags=["schedule"])


def _rows(db: Session, user: User) -> list[dict]:
    entries = db.scalars(
        select(ScheduleEntry)
        .join(Order, ScheduleEntry.order_id == Order.id)
        .where(Order.user_id == user.id)
        .options(selectinload(ScheduleEntry.order))
        .order_by(ScheduleEntry.sequence.asc())
    ).all()
    return [schedule_row_out(entry) for entry in entries]


@router.get("", response_model=list[ScheduleRowOut])
def list_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    return _rows(db, current_user)


@router.post("/generate", response_model=list[ScheduleRowOut])
def generate_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Generate or regenerate the run list from confirmed orders."""
    generate_run_list(db, current_user)
    return _rows(db, current_user)


@router.patch("/{entry_id}", response_model=ScheduleRowOut)
def update_entry(
    entry_id: int,
    payload: ScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    entry = db.scalar(
        select(ScheduleEntry)
        .join(Order, ScheduleEntry.order_id == Order.id)
        .where(ScheduleEntry.id == entry_id, Order.user_id == current_user.id)
        .options(selectinload(ScheduleEntry.order))
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found"
        )
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="No fields to update")
    for field, value in changes.items():
        setattr(entry, field, value)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return schedule_row_out(entry)
