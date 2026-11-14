#!/usr/bin/env bash
# One command from your laptop:   ./deploy/deploy.sh <server-ip>
# Copies the project and your .env to the Vultr server, then runs vultr-setup.sh there.
# Needs SSH access as root (Vultr shows the root password on the server page, or add your SSH key when creating it).
set -euo pipefail
cd "$(dirname "$0")/.."
HOST="${1:?Usage: ./deploy/deploy.sh <server-ip> [ssh-user]}"
USER_="${2:-root}"
ENV_FILE=".env"
[ -f "$ENV_FILE" ] || ENV_FILE=".env.local"
[ -f "$ENV_FILE" ] || { echo "Create .env (copy .env.example) with your keys first."; exit 1; }

echo "→ Uploading to $USER_@$HOST:/opt/personalityverse"
ssh -o StrictHostKeyChecking=accept-new "$USER_@$HOST" "mkdir -p /opt/personalityverse"
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude='.env*' -czf - . \
  | ssh "$USER_@$HOST" "tar -xzf - -C /opt/personalityverse"
scp -q "$ENV_FILE" "$USER_@$HOST:/opt/personalityverse/.env"

echo "→ Building on the server"
ssh "$USER_@$HOST" "cd /opt/personalityverse && HTTPS=${HTTPS:-1} DOMAIN=${DOMAIN:-} bash deploy/vultr-setup.sh"
