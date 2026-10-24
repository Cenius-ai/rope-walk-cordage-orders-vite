"""Request/response schemas with server-side validation."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .models import BaleStatus, FibreType, LayDirection, OrderStatus, RunStatus


def _clean_required(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("must not be blank")
    return cleaned


# ---------------------------------------------------------------- auth


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    display_name: str
    ropewalk_name: str
    created_at: datetime


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=120)
    ropewalk_name: str | None = Field(default=None, max_length=160)

    @field_validator("display_name", "ropewalk_name")
    @classmethod
    def _strip(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _clean_required(value)


# ---------------------------------------------------------------- orders


class OrderCreate(BaseModel):
    customer: str = Field(min_length=2, max_length=120)
    fibre_type: FibreType
    strand_count: int = Field(ge=1, le=12)
    lay_direction: LayDirection
    lay_length_mm: float = Field(gt=0, le=500)
    diameter_mm: float = Field(gt=0, le=200)
    length_m: float = Field(gt=0, le=20000)
    quantity: int = Field(ge=1, le=100)
    status: OrderStatus = OrderStatus.draft
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("customer")
    @classmethod
    def _strip_customer(cls, value: str) -> str:
        return _clean_required(value)

    @field_validator("notes")
    @classmethod
    def _strip_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class OrderUpdate(BaseModel):
    customer: str | None = Field(default=None, min_length=2, max_length=120)
    fibre_type: FibreType | None = None
    strand_count: int | None = Field(default=None, ge=1, le=12)
    lay_direction: LayDirection | None = None
    lay_length_mm: float | None = Field(default=None, gt=0, le=500)
    diameter_mm: float | None = Field(default=None, gt=0, le=200)
    length_m: float | None = Field(default=None, gt=0, le=20000)
    quantity: int | None = Field(default=None, ge=1, le=100)
    status: OrderStatus | None = None
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("customer")
    @classmethod
    def _strip_customer(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _clean_required(value)


class ScheduleEntryOut(BaseModel):
    id: int
    order_id: int
    sequence: int
    run_date: date
    status: RunStatus
    planned_length_m: float


class OrderOut(BaseModel):
    id: int
    customer: str
    fibre_type: FibreType
    strand_count: int
    lay_direction: LayDirection
    lay_length_mm: float
    diameter_mm: float
    length_m: float
    quantity: int
    total_length_m: float
    status: OrderStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime
    schedule: ScheduleEntryOut | None = None


class OrderListOut(BaseModel):
    items: list[OrderOut]
    total: int


# ---------------------------------------------------------------- schedule


class ScheduleRowOut(BaseModel):
    id: int
    order_id: int
    sequence: int
    run_date: date
    status: RunStatus
    planned_length_m: float
    customer: str
    fibre_type: FibreType
    length_m: float
    quantity: int
    lay_direction: LayDirection


class ScheduleUpdate(BaseModel):
    run_date: date | None = None
    status: RunStatus | None = None


# ---------------------------------------------------------------- bales


class BaleCreate(BaseModel):
    bale_ref: str = Field(min_length=2, max_length=40)
    fibre_type: FibreType
    weight_kg: float = Field(gt=0, le=2000)
    received_on: date
    status: BaleStatus = BaleStatus.in_stock

    @field_validator("bale_ref")
    @classmethod
    def _strip_ref(cls, value: str) -> str:
        return _clean_required(value)


class BaleUpdate(BaseModel):
    weight_kg: float | None = Field(default=None, gt=0, le=2000)
    status: BaleStatus | None = None
    received_on: date | None = None


class BaleOut(BaseModel):
    id: int
    bale_ref: str
    fibre_type: FibreType
    weight_kg: float
    received_on: date
    status: BaleStatus


class FibreTotals(BaseModel):
    count: int
    weight_kg: float


class BaleListOut(BaseModel):
    items: list[BaleOut]
    totals: dict[str, FibreTotals]
    used_count: int


# ---------------------------------------------------------------- overview


class OverviewOut(BaseModel):
    active_orders: int
    draft_orders: int
    confirmed_orders: int
    complete_orders: int
    total_scheduled_m: float
    next_runs: list[ScheduleRowOut]
    recent_orders: list[OrderOut]
    bale_totals: dict[str, FibreTotals]
    hemp_bales: int
    sisal_bales: int
