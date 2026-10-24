# Installing Rope Walk Cordage Orders

This is a two-service project (a monorepo). Install **both** halves:

| Path | What it is | Manifest |
| --- | --- | --- |
| `backend/` | FastAPI + SQLAlchemy + SQLite service | `backend/requirements.txt` |
| `frontend/` | Vite + React 18 SPA | `frontend/package.json` (npm, pinned by `frontend/package-lock.json`) |

## Prerequisites (installed by you, not by the scripts)

- Python **3.11** with `pip` (`python3 --version`)
- Node.js **18 or newer** with npm (`node --version`)
- No database server, no message broker, no external services.

## Step 1 — Install dependencies

```bash
sh install.sh
```

`install.sh` runs, in order: upgrade pip/setuptools/wheel → `pip install -r
backend/requirements.txt` → write a random `JWT_SECRET` to `backend/.env` (only if that file
is absent) → create the SQLite schema and seed demo data → `npm ci` in `frontend/` → `npm
run build`. It installs nothing system-wide and **exits without starting a server**.

Equivalent manual steps:

```bash
python3 -m pip install -r backend/requirements.txt     # backend deps
cd backend && python3 -m seed && cd ..                 # schema + demo data (exits)
cd frontend && npm ci && npm run build && cd ..        # frontend deps + build
```

## Step 2 — Seed the demo data

```bash
cd backend && python3 -m seed
```

Idempotent: it creates the demo ropemaker (`cenius@cenius.ai` / `cenius`), eight orders
across hemp and sisal, twelve bales and a generated run list, and skips anything that
already exists. The API also seeds itself on the normal boot path, so a fresh clone that
skips this step still comes up populated. The seed never starts the HTTP server.

## Step 3 — Run in development

```bash
sh start.sh
```

That boots both services and stays in the foreground:

- FastAPI on <http://0.0.0.0:8000> (health check: `/health`, OpenAPI: `/docs`)
- Vite on <http://0.0.0.0:5173>, proxying `/api` to `http://127.0.0.1:8000`

Open <http://localhost:5173> and sign in with `cenius@cenius.ai` / `cenius`.

Run one half on its own:

```bash
cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
cd frontend && npm run dev
```

## Step 4 — Tests

```bash
python3 -m pytest          # from the repository root (pytest.ini points at backend/tests)
cd frontend && npm test    # vitest
```

Both suites are offline and use inline fixtures; the backend suite creates its own
temporary SQLite file and seeds it on the first fixture use.

## Configuration

Copy `.env.example` to `backend/.env` only if you want to override the defaults. Every
variable has a working development default, so the app boots with no `.env` at all.

| Variable | Default | Notes |
| --- | --- | --- |
| `JWT_SECRET` | `cenius-dev-8f42c1d9b6a35e07` | HS256 signing key; `install.sh` writes a random one |
| `JWT_EXPIRES_MINUTES` | `720` | Token lifetime |
| `DATABASE_URL` | `sqlite:///backend/ropewalk.db` | Relative SQLite file, created on boot |
| `CORS_ORIGINS` | `*` | Only matters for direct `:8000` calls |
| `PORT` / `FRONTEND_PORT` | `8000` / `5173` | Ports used by `start.sh` |

## Troubleshooting

- **`pip` refuses with "externally-managed-environment" (PEP 668)** — `install.sh` detects
  this and retries with `--break-system-packages`. Prefer a virtualenv if you have one.
- **Port already in use** — stop the other process or run `PORT=8010 FRONTEND_PORT=5174 sh
  start.sh` (the Vite proxy follows `PORT` automatically).
- **Blank page at :5173** — confirm the API is up on :8000 (`curl localhost:8000/health`);
  the SPA shows an error card with Retry when a request fails.
