"""Small aggregate helpers shared by the bale ledger and the dashboard."""

from __future__ import annotations

from .models import Bale, BaleStatus, FibreType

AVAILABLE_BALE_STATUSES = (BaleStatus.in_stock, BaleStatus.opened)


def fibre_totals(bales: list[Bale]) -> dict:
    """Kilograms and bale counts of fibre currently on the racks, per fibre."""
    totals = {}
    for fibre in (FibreType.hemp, FibreType.sisal):
        available = [
            bale
            for bale in bales
            if bale.fibre_type == fibre and bale.status in AVAILABLE_BALE_STATUSES
        ]
        totals[fibre.value] = {
            "count": len(available),
            "weight_kg": round(sum(bale.weight_kg for bale in available), 1),
        }
    return totals
