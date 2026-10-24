"""Seed entrypoint: `python3 -m seed` (run from backend/).

Idempotent — safe to run before every boot. Never starts the HTTP server.
"""

from __future__ import annotations

from app.db import SessionLocal, init_db
from app.seed import seed_all


def main() -> None:
    init_db()
    with SessionLocal() as db:
        summary = seed_all(db)
    print(
        "Seeded ropewalk demo data: "
        f"user {summary['user']}, {summary['orders']} orders, "
        f"{summary['bales']} bales, {summary['schedule_entries']} scheduled runs."
    )


if __name__ == "__main__":
    main()
