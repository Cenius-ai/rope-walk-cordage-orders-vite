"""ORM models for orders, the ropewalk schedule and fibre bale stock."""

from __future__ import annotations

import enum
from datetime import date, datetime, timezone

from sqlalchemy import (
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    """Naive UTC timestamp — SQLite has no timezone type."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


class FibreType(str, enum.Enum):
    hemp = "hemp"
    sisal = "sisal"


class LayDirection(str, enum.Enum):
    Z = "Z"
    S = "S"


class OrderStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    complete = "complete"


class RunStatus(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    done = "done"


class BaleStatus(str, enum.Enum):
    in_stock = "in_stock"
    opened = "opened"
    used = "used"


def _enum(enum_cls):
    """Store enum *values* in a VARCHAR column guarded by a CHECK constraint."""
    return SAEnum(
        enum_cls,
        native_enum=False,
        validate_strings=True,
        values_callable=lambda members: [member.value for member in members],
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    ropewalk_name: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    orders: Mapped[list["Order"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    bales: Mapped[list["Bale"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    customer: Mapped[str] = mapped_column(String(120), nullable=False)
    fibre_type: Mapped[FibreType] = mapped_column(_enum(FibreType), nullable=False)
    strand_count: Mapped[int] = mapped_column(Integer, nullable=False)
    lay_direction: Mapped[LayDirection] = mapped_column(_enum(LayDirection), nullable=False)
    lay_length_mm: Mapped[float] = mapped_column(Float, nullable=False)
    diameter_mm: Mapped[float] = mapped_column(Float, nullable=False)
    length_m: Mapped[float] = mapped_column(Float, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[OrderStatus] = mapped_column(
        _enum(OrderStatus), nullable=False, default=OrderStatus.draft
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, onupdate=utcnow, nullable=False
    )

    user: Mapped[User] = relationship(back_populates="orders")
    schedule_entry: Mapped["ScheduleEntry | None"] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )

    @property
    def total_length_m(self) -> float:
        return round(self.length_m * self.quantity, 2)


class ScheduleEntry(Base):
    __tablename__ = "schedule_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    run_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[RunStatus] = mapped_column(
        _enum(RunStatus), nullable=False, default=RunStatus.planned
    )
    planned_length_m: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    order: Mapped[Order] = relationship(back_populates="schedule_entry")


class Bale(Base):
    __tablename__ = "bales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    bale_ref: Mapped[str] = mapped_column(String(40), nullable=False)
    fibre_type: Mapped[FibreType] = mapped_column(_enum(FibreType), nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    received_on: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[BaleStatus] = mapped_column(
        _enum(BaleStatus), nullable=False, default=BaleStatus.in_stock
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="bales")
