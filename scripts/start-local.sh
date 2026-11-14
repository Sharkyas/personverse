#!/usr/bin/env bash
# Run Personalityverse on your laptop with your local Gemma (Ollama or LM Studio).
#   ./scripts/start-local.sh          → production build on http://localhost:3000
#   DEV=1 ./scripts/start-local.sh    → hot-reloading dev server
set -euo pipefail
cd "$(dirname "$0")/.."

command -v node >/dev/null || { echo "Install Node 20+ first: brew install node   (or https://nodejs.org)"; exit 1; }
[ -f .env ] || [ -f .env.local ] || cp .env.example .env   # one file, used locally and by deploy.sh

echo "→ Looking for local Gemma"
if curl -fsS -m 1 http://127.0.0.1:11434/api/tags >/tmp/pv-ollama.json 2>/dev/null; then
  GEMMAS=$(grep -o '"name":"[^"]*gemma[^"]*"' /tmp/pv-ollama.json | cut -d'"' -f4 | tr '\n' ' ' || true)
  if [ -n "$GEMMAS" ]; then
    echo "  ✓ Ollama is running with: $GEMMAS"
  else
    echo "  ! Ollama is running but has no Gemma model. Pull one (≈3 GB):  ollama pull gemma3:4b"
  fi
elif curl -fsS -m 1 http://127.0.0.1:1234/v1/models >/dev/null 2>&1; then
  echo "  ✓ LM Studio server found on :1234 (make sure a Gemma model is loaded)"
elif command -v ollama >/dev/null; then
  echo "  ! Ollama is installed but not running. Start it with:  ollama serve   (or open the Ollama app)"
else
  echo "  ! No local model server found. The app still works (built-in coach library)."
  echo "    For local Gemma: brew install ollama && ollama serve && ollama pull gemma3:4b"
fi

echo "→ Installing dependencies"
npm ci --no-audit --no-fund --loglevel=error

if [ "${DEV:-0}" = "1" ]; then
  exec npm run dev
fi
echo "→ Building"
npm run build >/dev/null
echo "→ Starting on http://localhost:3000  (status: http://localhost:3000/api/health)"
( sleep 3; command -v open >/dev/null && open http://localhost:3000 ) &
# The build is a standalone server; copy its static files next to it and run it directly.
cp -R .next/static .next/standalone/.next/ && { [ -d public ] && cp -R public .next/standalone/ || true; }
set -a; [ -f .env ] && . ./.env; set +a
PORT=3000 HOSTNAME=127.0.0.1 exec node .next/standalone/server.js
