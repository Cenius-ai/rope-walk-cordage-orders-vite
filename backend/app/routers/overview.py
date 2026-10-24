"""Dashboard summary of the whole ropewalk."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..aggregates import fibre_totals
from ..db import get_db
from ..models import Bale, FibreType, Order, OrderStatus, RunStatus, ScheduleEntry, User
from ..schemas import OverviewOut
from ..security import get_current_user
from ..serializers import order_out, schedule_row_out

router = APIRouter(prefix="/overview", tags=["overview"])


@router.get("", response_model=OverviewOut)
def read_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    orders = db.scalars(
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(selectinload(Order.schedule_entry))
    ).all()

    entries = db.scalars(
        select(ScheduleEntry)
        .join(Order, ScheduleEntry.order_id == Order.id)
        .where(Order.user_id == current_user.id)
        .options(selectinload(ScheduleEntry.order))
        .order_by(ScheduleEntry.sequence.asc())
    ).all()

    bales = db.scalars(select(Bale).where(Bale.user_id == current_user.id)).all()

    upcoming = [entry for entry in entries if entry.status != RunStatus.done][:3]
    recent = sorted(orders, key=lambda order: order.created_at, reverse=True)[:5]

    def count(status: OrderStatus) -> int:
        return sum(1 for order in orders if order.status == status)

    return {
        "active_orders": sum(1 for order in orders if order.status != OrderStatus.complete),
        "draft_orders": count(OrderStatus.draft),
        "confirmed_orders": count(OrderStatus.confirmed),
        "complete_orders": count(OrderStatus.complete),
        "total_scheduled_m": round(sum(entry.planned_length_m for entry in entries), 1),
        "next_runs": [schedule_row_out(entry) for entry in upcoming],
        "recent_orders": [order_out(order) for order in recent],
        "bale_totals": fibre_totals(bales),
        "hemp_bales": sum(1 for bale in bales if bale.fibre_type == FibreType.hemp),
        "sisal_bales": sum(1 for bale in bales if bale.fibre_type == FibreType.sisal),
    }
