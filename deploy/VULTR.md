# Deploying Personalityverse on Vultr

About 10 minutes, most of it waiting for the first build. You get an HTTPS link like `https://203-0-113-7.sslip.io` that you can put on Devpost.

## 1. Claim the credit and create a server

1. Redeem the MLH Vultr credit code at vultr.com (Billing → Credits / Promo code).
2. **Deploy +** → **Cloud Compute – Shared CPU**.
3. Location: **London** (closest to Durham).
4. Image: **Ubuntu 24.04 LTS x64**.
5. Plan: **1 vCPU / 2 GB RAM** (about $10–12/month, billed hourly, so the weekend costs pennies). The 1 GB plan can run out of memory during the Next.js build.
6. Optional but easier: under **SSH Keys** add your Mac's public key (`cat ~/.ssh/id_ed25519.pub`). Without one, copy the root password from the server page.
7. **Deploy Now** and wait until the status says *Running*. Copy the **IP address**.

## 2. Put your keys in `.env`

In the project folder on your Mac:

```bash
cp .env.example .env
```

Fill in what you have. Everything is optional, and anything blank falls back gracefully:

| Variable | Where to get it | Without it |
|---|---|---|
| `GEMINI_API_KEY` | aistudio.google.com/apikey | Coach uses the built-in challenge library |
| `ELEVENLABS_API_KEY` | elevenlabs.io → Profile → API keys | Browser's own voice reads results |
| `MONGODB_URI` | Atlas → Connect → Drivers (allow `0.0.0.0/0` under Network Access) | Profiles kept in memory until restart |

Check the Gemma key works before deploying:

```bash
npm install
GEMINI_API_KEY=... npm run check:ai
```

## 3. Deploy (one command)

```bash
./deploy/deploy.sh <server-ip>
```

It uploads the code and `.env`, installs Docker, builds the app, and starts it behind Caddy with an automatic Let's Encrypt certificate on `<ip-with-dashes>.sslip.io`. At the end it prints the live URL.

- Own domain? Point an A record at the IP, then run `DOMAIN=yourdomain.com ./deploy/deploy.sh <ip>`.
- Certificate trouble (rare)? Run `HTTPS=0 ./deploy/deploy.sh <ip>` to serve plain HTTP on port 80.

To update after changes, run the same command again.

## 4. Check it

- `https://<your-url>/api/health` shows which integrations are live (no keys are ever shown).
- The results page footer shows the same as green or amber chips: Coach, Voice, Data.

## Handy server commands

```bash
ssh root@<ip>
cd /opt/personalityverse
docker compose logs -f app      # app logs (AI / ElevenLabs / Mongo errors show here)
docker compose restart app      # after editing .env on the server
docker compose ps
```

## Alternative without the script

On the server, from a copy of the repo:

```bash
cp .env.example .env && nano .env
bash deploy/vultr-setup.sh
```
