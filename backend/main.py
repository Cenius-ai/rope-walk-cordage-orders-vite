"""Alternate entrypoint: `uvicorn main:app --host 0.0.0.0 --port 8000`.

The application itself lives in app/main.py; this module simply re-exports it so
both `uvicorn app.main:app` and `uvicorn main:app` work from backend/.
"""

from app.main import app  # noqa: F401  (re-exported for the ASGI server)

__all__ = ["app"]
