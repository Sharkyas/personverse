# Personalityverse

**Who were you before the world got to you?**

Personalityverse estimates the temperament you were born with, shows how far upbringing pulled you from it, and gives the odds that each of your Big Five traits shifts meaningfully by any age you choose. Then you pick who you want to become and get a research-backed weekly plan to get there, narrated in your ears.

Built at DurHack 2026.

## Your type, first

Results open with your closest of the 16 four-letter types, a full portrait (at your best, under stress, at work, with people, your growth edge), your Big Five in plain words, and how sure we are, letter by letter. You measure yourself with a **50-question Big Five test** (the public-domain IPIP markers, one question at a time) or a 10-question quick version.

## What it does

1. **Baby you, worked backwards.** Nobody remembers being a baby, so by default the app starts from who you are now, your upbringing and your parents' personalities (five ratings each, with how sure you are), and works out your baby temperament by Gaussian conditioning. You get the % chance you were an easy, spirited, slow-to-warm-up or mixed baby and an 80% range per trait, calibrated in simulation. If you do know stories about yourself as a baby, twelve optional questions modelled on Rothbart and on Thomas & Chess add them as one more clue.
2. **Nature meets nurture.** Temperament plus upbringing (warmth, harshness, adversity, family resources, moves) predict your adult profile. That prediction is set against where you actually are now (the 50-item IPIP test, or the Ten-Item Personality Inventory in quick mode), with the genes / shared family / unique experience split for each trait.
3. **Your future selves.** For each trait you get a % chance of a big shift (≥ 0.5 SD) by your chosen age. It combines rank-order stability (Bleidorn et al., 2022), normative maturation (Roberts et al., 2006) and life events (university, first job, relationship, living abroad, therapy, unemployment, parenthood).
4. **Personality time machine.** A lifespan chart running from baby you, through today, to a fan of possible futures at 80.
5. **A voice note from future you.** Gemma writes a short message from your most likely self at your chosen age, and ElevenLabs speaks it in a second voice.
6. **The multiverse.** Same baby, different worlds: the sheltered, hard-knocks, nomad, growth and drift universes, compared live with yours.
7. **Choose your universe.** Pick an archetype (The Quant, The Founder, The Diplomat…) or set custom targets. You see your odds under life as usual, under weekly challenges (Stieger et al., 2021) and under coaching or therapy (Roberts et al., 2017). The AI coach (Gemma) writes an 8-week plan of behavioural challenges and if–then plans.
8. **Your people.** Public figures whose typings sit closest to you now, to baby you and to your target, each labelled by how trustworthy the typing is.
9. **The MBTI version of you.** Your closest of the 16 types with a confidence level per letter, the types you were most likely born as and will most likely be at your chosen age, the chance your letters change, and the odds of reaching any other type. Derived from the Big Five (McCrae & Costa, 1989; UK population cut-offs), never measured directly. Each type has its own page at `/types/XXXX`.
10. **Narration.** ElevenLabs reads your results and your coach's message aloud.
11. **Share and compare.** Every result gets a link with a preview card and a story-sized image to post. Send a friend a compare link and see your two personalityverses side by side: how alike you were as babies, how alike you are now, and who's likelier to change.
12. **Track yourself.** Retake the ten questions every few weeks at `/track/<id>` and see each check-in against your own forecast, with an 80% band that includes the TIPI's retest noise (r = .72) and a trend once you have three points. Check-ins go to Tiger Data (TimescaleDB hypertable, three-year retention, `time_bucket()` weekly pulse), plain Postgres, or a local file.

Every number is sourced on the `/science` page. Estimates are flagged as estimates.

## Data and metrics

- **The 50-question test** is scored on norms we fitted to the open openpsychometrics.org Big Five dataset (19,631 people after cleaning; adults for the norms), `scripts/fit_ipip.py`. 70/30 split, seed 20261114. On the 5,890 held-out people: alpha .79 to .89; a split-half check (score half the items, predict whether the other half lands above average) gives AUC .80 to .89, expected calibration error .03 to .05, and 87 to 92% accuracy when the model is confident. Full numbers: `research/ipip_metrics.json`, shown on `/science`.
- **MBTI letters** use the McCrae & Costa (1989) correlations scaled by the reliability of the test you took, so the 50-question test gives sharper letters than the 10-question one.
- **The Gemma coach** is scored by `scripts/eval_gemma.mjs` on 20 profiles from its own generator: valid output, whether every weekly challenge targets the right traits, format and latency (`src/lib/gemmaEval.json`).

### Synthetic data (fine-tuning only)

The coach can be LoRA fine-tuned with Apple MLX (`scripts/finetune_gemma.sh`). Its training data is **synthetic**: `scripts/make_coach_data.ts` makes random users with the app's own model, builds the exact coach prompt, asks a larger local Gemma (gemma4:26b) for a plan, and keeps only plans that pass every quality check. That data only teaches format and focus. It is never used as evidence, and never used for any accuracy metric above. The eval profiles come from a different generator and seed.

## Honesty

Personality can't be measured at birth. Newborns have temperament, not Big Five traits, and early temperament predicts adult personality only weakly (r ≈ .1–.3). We model it that way, shrink its weight further when you tell us you're guessing, and say so in the app.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- **Gemma 4, local** for the coach and the future-self note, through Ollama, LM Studio or `mlx_lm.server` (nothing leaves the machine), grounded with the tested challenges for your two biggest gaps; a curated challenge library if no model is running. Gemma via the Gemini API is still supported with `GEMINI_API_KEY`, but not needed
- **ElevenLabs** text-to-speech, falling back to the browser's own voice
- **MongoDB Atlas** for anonymous profiles, shareable result links (`/r/:id`) and the live "multiverse census" aggregation, plus friend comparisons (`/compare/:a/:b`) and "baby twins" (a nearest-neighbour aggregation over baby temperament), falling back to a local file-backed store
- **Tiger Data** (TimescaleDB) for tracker check-ins
- **Entire** records the AI-assisted coding sessions into git next to the commits
- Hosted from a laptop through a Cloudflare tunnel (keeps the local Gemma), or Docker Compose with Caddy on any server (`deploy/deploy.sh`)
- The scoring model is pure TypeScript (`src/lib/model.ts`), so every slider recomputes instantly in the browser

## Run locally (with your own Gemma)

```bash
ollama pull gemma4:12b         # or any Gemma (LM Studio and mlx_lm.server work too)
./scripts/start-local.sh       # installs, builds, opens http://localhost:3000
```

The app auto-detects Ollama on `:11434` (or an OpenAI-compatible server such as LM Studio on `:1234`) and picks the best Gemma you have installed. Override with `OLLAMA_MODEL=gemma4:12b`, or point at an OpenAI-compatible server with `LOCAL_AI_URL`. With no local model and no key it still works, using the built-in challenge library.

## Public link

```bash
cloudflared tunnel --url http://127.0.0.1:3000   # free, no account; prints a https://*.trycloudflare.com link
```

## Deploy on a server

```bash
cp .env.example .env              # add whichever keys you have
./deploy/deploy.sh <server-ip>    # uploads, builds with Docker, serves HTTPS on <ip>.sslip.io via Caddy
```

Step-by-step guide (written for Vultr, works on any Ubuntu box): [deploy/VULTR.md](deploy/VULTR.md). Add `GEMMA_ON_SERVER=1` to also run Gemma on the server with Ollama. Live integration status: `/api/health`.

## Tests

```bash
npm test            # 87 tests (+1 live Postgres/Tiger test with PG_TEST_URL, +1 live MongoDB test with MONGO_TEST_URI): model maths, literature checks, API fallbacks, backcast calibration, MBTI mapping and journeys, tracker maths and store, input cleaning, rate limits, baby twins, mocked Ollama / LM Studio / Gemini, Atlas outage
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

The research brief is in `research/research.md`; the MBTI research is in `research/mbti_science.md` and `research/mbti_types.md`.
