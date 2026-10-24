"""FastAPI application entry point.

Run with:  uvicorn app.main:app --host 0.0.0.0 --port 8000

The service is the API for the Vite SPA in frontend/. When a production build of
that SPA exists (frontend/dist, produced by `npm run build`), it is also served
here so the whole product works on one port; otherwise the service landing page
is shown at / and the app runs on the Vite dev server (:5173).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select

from .config import settings
from .db import SessionLocal, init_db
from .models import User
from .routers import auth, bales, orders, overview, schedule
from .seed import seed_all

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("ropewalk")

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
SPA_DIST = BASE_DIR.parent / "frontend" / "dist"

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    # The SPA ships no inline script; everything it loads is same-origin.
    "Content-Security-Policy": (
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
        "script-src 'self'; frame-ancestors 'none'; base-uri 'self'"
    ),
}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    with SessionLocal() as db:
        summary = seed_all(db)
    logger.info(
        "ropewalk ready — demo user %s, %s orders, %s bales, %s scheduled runs",
        summary["user"],
        summary["orders"],
        summary["bales"],
        summary["schedule_entries"],
    )
    yield


app = FastAPI(
    title="Rope Walk Cordage Orders API",
    description=(
        "Orders with their full rope lay and fibre specification, a ropewalk run list "
        "sequenced longest-first, and a hemp/sisal bale stock ledger."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response


app.include_router(auth.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")
app.include_router(bales.router, prefix="/api")
app.include_router(overview.router, prefix="/api")

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/health", include_in_schema=False)
def health() -> JSONResponse:
    with SessionLocal() as db:
        users = db.scalar(select(func.count()).select_from(User))
    return JSONResponse({"status": "ok", "users": users})


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def root() -> HTMLResponse:
    """Serve the built SPA when there is one, else the service landing page."""
    index = SPA_DIST / "index.html"
    if index.is_file():
        return HTMLResponse(index.read_text(encoding="utf-8"))
    return HTMLResponse((STATIC_DIR / "landing.html").read_text(encoding="utf-8"))


@app.get("/service", response_class=HTMLResponse, include_in_schema=False)
def service_landing() -> HTMLResponse:
    """Human description of the API service."""
    return HTMLResponse((STATIC_DIR / "landing.html").read_text(encoding="utf-8"))


if (SPA_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(SPA_DIST / "assets")), name="spa-assets")


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    """Client-side routes (and built static files) for the SPA."""
    if full_path.startswith(("api/", "docs", "redoc", "openapi.json")):
        raise HTTPException(status_code=404, detail="Not found")

    dist_root = SPA_DIST.resolve()
    candidate = (dist_root / full_path).resolve()
    if full_path and candidate.is_file() and dist_root in candidate.parents:
        return FileResponse(candidate)

    index = dist_root / "index.html"
    if index.is_file():
        return FileResponse(index)
    raise HTTPException(status_code=404, detail="Not found")
