"""Plain-dict serializers so routers can declare explicit response models."""

from __future__ import annotations

from .models import Bale, Order, ScheduleEntry, User


def user_out(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "ropewalk_name": user.ropewalk_name,
        "created_at": user.created_at,
    }


def schedule_out(entry: ScheduleEntry | None) -> dict | None:
    if entry is None:
        return None
    return {
        "id": entry.id,
        "order_id": entry.order_id,
        "sequence": entry.sequence,
        "run_date": entry.run_date,
        "status": entry.status,
        "planned_length_m": round(entry.planned_length_m, 2),
    }


def order_out(order: Order) -> dict:
    return {
        "id": order.id,
        "customer": order.customer,
        "fibre_type": order.fibre_type,
        "strand_count": order.strand_count,
        "lay_direction": order.lay_direction,
        "lay_length_mm": order.lay_length_mm,
        "diameter_mm": order.diameter_mm,
        "length_m": order.length_m,
        "quantity": order.quantity,
        "total_length_m": order.total_length_m,
        "status": order.status,
        "notes": order.notes,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "schedule": schedule_out(order.schedule_entry),
    }


def schedule_row_out(entry: ScheduleEntry) -> dict:
    order = entry.order
    return {
        "id": entry.id,
        "order_id": entry.order_id,
        "sequence": entry.sequence,
        "run_date": entry.run_date,
        "status": entry.status,
        "planned_length_m": round(entry.planned_length_m, 2),
        "customer": order.customer,
        "fibre_type": order.fibre_type,
        "length_m": order.length_m,
        "quantity": order.quantity,
        "lay_direction": order.lay_direction,
    }


def bale_out(bale: Bale) -> dict:
    return {
        "id": bale.id,
        "bale_ref": bale.bale_ref,
        "fibre_type": bale.fibre_type,
        "weight_kg": bale.weight_kg,
        "received_on": bale.received_on,
        "status": bale.status,
    }
