"""Order CRUD, including the full rope lay and fibre specification."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..db import get_db
from ..models import FibreType, Order, OrderStatus, User
from ..schemas import OrderCreate, OrderListOut, OrderOut, OrderUpdate
from ..security import get_current_user
from ..serializers import order_out

router = APIRouter(prefix="/orders", tags=["orders"])

SORT_ORDERS = {
    "created_desc": Order.created_at.desc(),
    "created_asc": Order.created_at.asc(),
    "length_desc": Order.length_m.desc(),
    "length_asc": Order.length_m.asc(),
    "customer_asc": Order.customer.asc(),
}


def _user_order(db: Session, order_id: int, user: User) -> Order:
    """Fetch an order owned by the caller; another user's order is a 404."""
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id, Order.user_id == user.id)
        .options(selectinload(Order.schedule_entry))
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.get("", response_model=OrderListOut)
def list_orders(
    status_filter: OrderStatus | None = None,
    fibre_type: FibreType | None = None,
    q: str | None = None,
    sort: str = "created_desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    stmt = (
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(selectinload(Order.schedule_entry))
    )
    if status_filter is not None:
        stmt = stmt.where(Order.status == status_filter)
    if fibre_type is not None:
        stmt = stmt.where(Order.fibre_type == fibre_type)
    if q:
        stmt = stmt.where(Order.customer.ilike(f"%{q.strip()}%"))
    stmt = stmt.order_by(SORT_ORDERS.get(sort, SORT_ORDERS["created_desc"]))
    orders = db.scalars(stmt).all()
    return {"items": [order_out(order) for order in orders], "total": len(orders)}


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    order = Order(user_id=current_user.id, **payload.model_dump())
    db.add(order)
    db.commit()
    db.refresh(order)
    return order_out(order)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return order_out(_user_order(db, order_id, current_user))


@router.patch("/{order_id}", response_model=OrderOut)
def update_order(
    order_id: int,
    payload: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    order = _user_order(db, order_id, current_user)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="No fields to update")
    for field, value in changes.items():
        setattr(order, field, value)
    if order.schedule_entry is not None:
        order.schedule_entry.planned_length_m = order.total_length_m
    db.add(order)
    db.commit()
    db.refresh(order)
    return order_out(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    order = _user_order(db, order_id, current_user)
    db.delete(order)  # schedule entry is removed by cascade
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
