#!/usr/bin/env bash
# Runs ON the Vultr server (Ubuntu 22.04/24.04), from the project folder.
# Installs Docker, builds the app and serves it with HTTPS on <ip>.sslip.io.
#   HTTPS=0 bash deploy/vultr-setup.sh   → plain HTTP on port 80 instead
#   DOMAIN=your.domain bash deploy/vultr-setup.sh   → use your own domain (point an A record at the server first)
#   GEMMA_ON_SERVER=1 bash deploy/vultr-setup.sh    → also run Gemma on the server with Ollama (8 GB RAM plan)
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "Missing .env (copy .env.example and fill in your keys)"; exit 1; }

if ! command -v docker >/dev/null; then
  echo "→ Installing Docker"
  curl -fsSL https://get.docker.com | sh
fi

IP=$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')
if [ "${HTTPS:-1}" = "0" ]; then
  export SITE_DOMAIN=":80"; URL="http://$IP"
else
  export SITE_DOMAIN="${DOMAIN:-${IP//./-}.sslip.io}"; URL="https://$SITE_DOMAIN"
fi
grep -q '^SITE_URL=' .env && sed -i "s|^SITE_URL=.*|SITE_URL=$URL|" .env || echo "SITE_URL=$URL" >> .env

# Open the firewall if ufw is active (Vultr images ship with it on)
if command -v ufw >/dev/null && ufw status | grep -q active; then ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; fi

echo "→ Building and starting (first build takes 2–4 minutes)"
PROFILE=""
if [ "${GEMMA_ON_SERVER:-0}" = "1" ]; then PROFILE="--profile gemma"; fi
SITE_DOMAIN="$SITE_DOMAIN" SITE_URL="$URL" docker compose $PROFILE up -d --build
if [ -n "$PROFILE" ]; then
  MODEL="${OLLAMA_PULL:-gemma3:4b}"
  echo "→ Pulling $MODEL into the server's Ollama (a few minutes the first time)"
  docker compose exec -T ollama ollama pull "$MODEL"
fi

echo "→ Waiting for the app"
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null http://localhost:80/api/health -H "Host: ${SITE_DOMAIN#:}" 2>/dev/null || curl -fsSk -o /dev/null "$URL/api/health" 2>/dev/null; then break; fi
  sleep 3
done
echo
echo "✓ Personalityverse is live at $URL"
echo "  Integration status: $URL/api/health"
