#!/usr/bin/env bash
# One-shot setup for a fresh Vultr Ubuntu 24.04 instance (Cloud Compute, 1 vCPU / 2 GB is plenty).
# Usage on the server:  git clone <repo> personalityverse && cd personalityverse && cp .env.example .env && nano .env && bash deploy/vultr-setup.sh
set -euo pipefail
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
sudo docker build -t personalityverse .
sudo docker rm -f personalityverse 2>/dev/null || true
sudo docker run -d --name personalityverse --restart unless-stopped --env-file .env -p 80:3000 personalityverse
sudo ufw allow 80/tcp 2>/dev/null || true
echo "Live on http://$(curl -s ifconfig.me)"
