#!/usr/bin/env bash
# Boot both halves of the product and stay in the foreground:
#   FastAPI (uvicorn) on 0.0.0.0:$PORT (default 8000)
#   Vite dev server on 0.0.0.0:$FRONTEND_PORT (default 5173), proxying /api to the API
set -eu
cd "$(dirname "$0")"

BACKEND_PORT="${PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
PYTHON="${PYTHON:-python3}"

echo "==> Starting the FastAPI service on 0.0.0.0:${BACKEND_PORT}"
(
  cd backend
  exec "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port "${BACKEND_PORT}"
) &
BACKEND_PID=$!

cleanup() {
  if kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
    wait "${BACKEND_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "==> Waiting for http://127.0.0.1:${BACKEND_PORT}/health"
READY=0
for _ in $(seq 1 60); do
  if "$PYTHON" -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:${BACKEND_PORT}/health', timeout=1)" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 0.5
done
if [ "${READY}" -ne 1 ]; then
  echo "!! the API did not answer on port ${BACKEND_PORT}" >&2
  exit 1
fi
echo "    API is up"

echo "==> Starting the Vite dev server on 0.0.0.0:${FRONTEND_PORT} (proxying /api -> 127.0.0.1:${BACKEND_PORT})"
cd frontend
VITE_API_TARGET="http://127.0.0.1:${BACKEND_PORT}" \
  npx vite --host 0.0.0.0 --port "${FRONTEND_PORT}" --strictPort
