"""Idempotent demo data for the ropewalk.

Runs on every boot (and from `python3 -m seed`). Every row is keyed by a
natural key so a restart never duplicates anything.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import settings
from .models import (
    Bale,
    BaleStatus,
    FibreType,
    LayDirection,
    Order,
    OrderStatus,
    ScheduleEntry,
    User,
    utcnow,
)
from .scheduling import generate_run_list
from .security import hash_password

DEMO_DISPLAY_NAME = "Marta Ellery"
DEMO_ROPEWALK = "Ellery Ropewalk, Whitby"

# customer, fibre, strands, lay, lay length mm, diameter mm, length m, qty, status, notes, days ago
ORDERS = [
    (
        "Whitby Harbour Trust",
        FibreType.hemp,
        3,
        LayDirection.Z,
        40.0,
        24.0,
        220.0,
        2,
        OrderStatus.confirmed,
        "Mooring warps for the east pier. Eyes spliced both ends, tarred.",
        26,
    ),
    (
        "Fenwick Sailmakers",
        FibreType.hemp,
        3,
        LayDirection.S,
        32.0,
        18.0,
        140.0,
        1,
        OrderStatus.confirmed,
        "Running rigging for a gaff cutter, waxed finish.",
        21,
    ),
    (
        "Saltmarsh Narrowboats",
        FibreType.sisal,
        4,
        LayDirection.Z,
        45.0,
        28.0,
        320.0,
        1,
        OrderStatus.confirmed,
        "Bow hauling line for the dry dock; tarred after laying.",
        17,
    ),
    (
        "Hartley Bell Foundry",
        FibreType.sisal,
        3,
        LayDirection.Z,
        38.0,
        20.0,
        90.0,
        4,
        OrderStatus.confirmed,
        "Lifting strops for the bell frame, spliced eyes.",
        13,
    ),
    (
        "Orkney Lighthouse Board",
        FibreType.hemp,
        4,
        LayDirection.S,
        50.0,
        32.0,
        480.0,
        1,
        OrderStatus.confirmed,
        "Shore line for the North Ronaldsay landing. Longest run of the season.",
        9,
    ),
    (
        "Denby & Sons Chandlery",
        FibreType.sisal,
        3,
        LayDirection.Z,
        28.0,
        14.0,
        60.0,
        6,
        OrderStatus.draft,
        "Counter coil for the chandlery shelf, paper tags.",
        6,
    ),
    (
        "Greenhythe Rowing Club",
        FibreType.hemp,
        3,
        LayDirection.Z,
        34.0,
        16.0,
        180.0,
        2,
        OrderStatus.draft,
        "Start lines for the autumn regatta. Waxed, no splice.",
        3,
    ),
    (
        "Calder Valley Climbing",
        FibreType.sisal,
        4,
        LayDirection.S,
        42.0,
        22.0,
        260.0,
        1,
        OrderStatus.complete,
        "Handrail rope for the mill stair, walked in June.",
        34,
    ),
]

# bale ref, fibre, weight kg, received days ago, status
BALES = [
    ("HEMP-1184", FibreType.hemp, 26.4, 24, BaleStatus.in_stock),
    ("HEMP-1187", FibreType.hemp, 24.8, 20, BaleStatus.in_stock),
    ("HEMP-1191", FibreType.hemp, 27.2, 15, BaleStatus.opened),
    ("HEMP-1195", FibreType.hemp, 25.6, 11, BaleStatus.in_stock),
    ("HEMP-1202", FibreType.hemp, 23.9, 6, BaleStatus.in_stock),
    ("HEMP-1206", FibreType.hemp, 28.1, 2, BaleStatus.in_stock),
    ("SISAL-0416", FibreType.sisal, 22.5, 27, BaleStatus.in_stock),
    ("SISAL-0421", FibreType.sisal, 24.0, 19, BaleStatus.in_stock),
    ("SISAL-0425", FibreType.sisal, 26.8, 14, BaleStatus.opened),
    ("SISAL-0430", FibreType.sisal, 23.3, 9, BaleStatus.in_stock),
    ("SISAL-0434", FibreType.sisal, 25.1, 5, BaleStatus.in_stock),
    ("SISAL-0439", FibreType.sisal, 21.7, 3, BaleStatus.used),
]


def _ensure_demo_user(db: Session) -> User:
    email = settings.demo_email.lower()
    user = db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None:
        user = User(
            email=email,
            password_hash=hash_password(settings.demo_password),
            display_name=DEMO_DISPLAY_NAME,
            ropewalk_name=DEMO_ROPEWALK,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _ensure_orders(db: Session, user: User) -> None:
    existing = set(
        db.scalars(select(Order.customer).where(Order.user_id == user.id)).all()
    )
    now = utcnow()
    created = False
    for (
        customer,
        fibre,
        strands,
        lay,
        lay_mm,
        diameter_mm,
        length_m,
        quantity,
        status,
        notes,
        days_ago,
    ) in ORDERS:
        if customer in existing:
            continue
        db.add(
            Order(
                user_id=user.id,
                customer=customer,
                fibre_type=fibre,
                strand_count=strands,
                lay_direction=lay,
                lay_length_mm=lay_mm,
                diameter_mm=diameter_mm,
                length_m=length_m,
                quantity=quantity,
                status=status,
                notes=notes,
                created_at=now - timedelta(days=days_ago, hours=days_ago % 7),
                updated_at=now - timedelta(days=days_ago, hours=days_ago % 7),
            )
        )
        created = True
    if created:
        db.commit()


def _ensure_bales(db: Session, user: User) -> None:
    existing = set(
        db.scalars(select(Bale.bale_ref).where(Bale.user_id == user.id)).all()
    )
    today = date.today()
    created = False
    for bale_ref, fibre, weight_kg, days_ago, status in BALES:
        if bale_ref in existing:
            continue
        db.add(
            Bale(
                user_id=user.id,
                bale_ref=bale_ref,
                fibre_type=fibre,
                weight_kg=weight_kg,
                received_on=today - timedelta(days=days_ago),
                status=status,
            )
        )
        created = True
    if created:
        db.commit()


def _ensure_schedule(db: Session, user: User) -> None:
    existing = db.scalar(
        select(func.count())
        .select_from(ScheduleEntry)
        .join(Order, ScheduleEntry.order_id == Order.id)
        .where(Order.user_id == user.id)
    )
    if existing:
        return
    generate_run_list(db, user)


def seed_all(db: Session) -> dict:
    user = _ensure_demo_user(db)
    _ensure_orders(db, user)
    _ensure_bales(db, user)
    _ensure_schedule(db, user)
    return {
        "user": user.email,
        "orders": db.scalar(
            select(func.count()).select_from(Order).where(Order.user_id == user.id)
        ),
        "bales": db.scalar(
            select(func.count()).select_from(Bale).where(Bale.user_id == user.id)
        ),
        "schedule_entries": db.scalar(
            select(func.count())
            .select_from(ScheduleEntry)
            .join(Order, ScheduleEntry.order_id == Order.id)
            .where(Order.user_id == user.id)
        ),
        "seeded_at": datetime.now().isoformat(timespec="seconds"),
    }
