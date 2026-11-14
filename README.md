# Personalityverse ✦

**Who were you before the world got to you?**

Personalityverse estimates the temperament you were born with, shows how far upbringing pulled you from it, and gives the odds that each of your Big Five traits shifts meaningfully by any age you choose. Then you pick who you want to become and get a research-backed weekly plan to get there, narrated in your ears.

Built at DurHack 2026.

## What it does

1. **Baby you.** Twelve questions about infancy and toddlerhood, modelled on Rothbart's temperament factors and Thomas & Chess's nine dimensions, estimate your early temperament and classify you as easy, spirited, slow-to-warm-up or mixed.
2. **Nature meets nurture.** Temperament plus upbringing (warmth, harshness, adversity, family resources, moves) predict your adult profile. That prediction is set against where you actually are now (Ten-Item Personality Inventory), with the genes / shared family / unique experience split for each trait.
3. **Your future selves.** For each trait you get a % chance of a big shift (≥ 0.5 SD) by your chosen age. It combines rank-order stability (Bleidorn et al., 2022), normative maturation (Roberts et al., 2006) and life events (university, first job, relationship, living abroad, therapy, unemployment, parenthood).
4. **Personality time machine.** A lifespan chart running from baby you, through today, to a fan of possible futures at 80.
5. **A voice note from future you.** Gemma writes a short message from your most likely self at your chosen age, and ElevenLabs speaks it in a second voice.
6. **The multiverse.** Same baby, different worlds: the sheltered, hard-knocks, nomad, growth and drift universes, compared live with yours.
7. **Choose your universe.** Pick an archetype (The Quant, The Founder, The Diplomat…) or set custom targets. You see your odds under life as usual, under weekly challenges (Stieger et al., 2021) and under coaching or therapy (Roberts et al., 2017). The AI coach (Gemma) writes an 8-week plan of behavioural challenges and if–then plans.
8. **Your people.** Public figures whose *popular* typings sit closest to you now, to baby you and to your target.
9. **Narration.** ElevenLabs reads your results and your coach's message aloud.

Every number is sourced on the `/science` page. Estimates are flagged as estimates.

## Honesty

Personality can't be measured at birth. Newborns have temperament, not Big Five traits, and early temperament predicts adult personality only weakly (r ≈ .1–.3). We model it that way, shrink its weight further when you tell us you're guessing, and say so in the app.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- **Gemma 4** (`gemma-4-31b-it`, then `gemma-4-26b-a4b-it`, then `gemma-3-27b-it`) via the Gemini API (`@google/genai`) for the coach and the future-self note, falling back to a curated challenge library
- **ElevenLabs** text-to-speech, falling back to the browser's own voice
- **MongoDB Atlas** for anonymous profiles, shareable result links (`/r/:id`) and the live "multiverse census" aggregation, falling back to an in-memory store
- **Vultr** Cloud Compute running Docker Compose with Caddy for automatic HTTPS (`deploy/deploy.sh`)
- The scoring model is pure TypeScript (`src/lib/model.ts`), so every slider recomputes instantly in the browser

## Run locally

```bash
cp .env.example .env.local   # keys are all optional
npm install
npm run dev
```

## Deploy on Vultr

```bash
cp .env.example .env              # add whichever keys you have
./deploy/deploy.sh <server-ip>    # uploads, builds with Docker, serves HTTPS on <ip>.sslip.io via Caddy
```

Step-by-step guide: [deploy/VULTR.md](deploy/VULTR.md). Live integration status: `/api/health`.

## Tests

```bash
npm test            # 41 tests: model maths, literature reproduction checks, API fallbacks, mocked Gemma, Atlas outage
npm run check:ai    # with GEMINI_API_KEY set: lists your Gemma models and makes one real call
```

## Model in one screen

```
temperament z  = weighted mean of 12 infancy items (loadings from Rothbart / Thomas & Chess)
adult z | baby = r·T + Σ upbringing effects,  r = .25 × recall confidence     (Caspi 2003; Bleidorn 2022)
r(age, lag)    = Bleidorn 2022 age curve ÷ .88 reliability, adjusted for lag
E[Δ]           = (r − 1)·z_now + maturation(age → target) + Σ life events     (Roberts 2006; Bühler 2024)
P(big shift)   = P(|Δ| ≥ 0.5 SD), Δ ~ N(E[Δ], 1 − r²)
```

The research brief with all 31 sources is in `research/research.md`.
