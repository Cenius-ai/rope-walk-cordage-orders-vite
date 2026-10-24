"""The length-first run list rule, shared by the API and the seed."""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .models import Order, OrderStatus, RunStatus, ScheduleEntry, User


def generate_run_list(db: Session, user: User) -> None:
    """Rebuild the run list from confirmed orders, longest finished length first.

    Entries already marked done keep their sequence, run date and status so a
    regeneration never unschedules work that has already been walked.
    """
    orders = db.scalars(
        select(Order)
        .where(Order.user_id == user.id)
        .options(selectinload(Order.schedule_entry))
    ).all()

    existing = [order.schedule_entry for order in orders if order.schedule_entry is not None]
    done_entries = [entry for entry in existing if entry.status == RunStatus.done]
    done_order_ids = {entry.order_id for entry in done_entries}

    for entry in existing:
        if entry.status != RunStatus.done:
            db.delete(entry)
    db.commit()
    db.expire_all()

    taken = {entry.sequence for entry in done_entries}
    next_sequence = max(taken) + 1 if taken else 1

    pending = sorted(
        (
            order
            for order in orders
            if order.status == OrderStatus.confirmed and order.id not in done_order_ids
        ),
        key=lambda order: (-order.length_m, order.created_at or 0),
    )

    start = date.today()
    for index, order in enumerate(pending):
        db.add(
            ScheduleEntry(
                order_id=order.id,
                sequence=next_sequence + index,
                run_date=start + timedelta(days=index),
                status=RunStatus.planned,
                planned_length_m=order.total_length_m,
            )
        )
    db.commit()
