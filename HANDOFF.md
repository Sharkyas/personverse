# Handoff: 15 November 2026

A short note for whoever picks this up next (Arian, or Arian's Codex or Claude). Read `CLAUDE.md`, `CONTRIBUTING.md` and `CHANGELOG.md` first, as usual.

## What changed today

**Multiverse (results page, "One baby, 8 versions of you")**
- The type each universe lands on at the forecast age now keeps the person's direct type answers (the OEJTS follow-ups). Before this, it used the Big Five alone, so someone who was clearly an introvert could turn into an E by 35. See `src/lib/universes.ts` and `directResidualShift` in `src/lib/mbti.ts`.
- Your own universe shows your likeliest type. Every other universe shows the type that its world pushes you towards compared with your own life: a lift of at least 1.15x, and at least 30% as likely as that universe's likeliest type. The card and chart say "pushed towards" and give the likeliest type beside it. `pickType`, `MIN_LIFT` and `MIN_SHARE_OF_TOP` live in `universes.ts`.
- Result: test profiles get 3 or 4 different types across the 8 cards instead of 1.
- Tests: `tests/directCarry.test.ts` and `tests/multiverse.test.ts`.

**Other fixes**
- MongoDB Atlas: the connection attempt is capped at 4 s and retried every 5 minutes (`src/lib/db.ts`). The Durham wifi can't resolve Atlas, and saving a result used to hang for up to 98 s.
- Shared result links show your own name only on results your browser made (`src/app/r/[id]/page.tsx`).
- Earlier today: a smaller Enter button between the fingertips on the hero, a pixel bar under selected answer tiles, more Neuroticism and E/I/S/N questions, and the Enneagram with wing and instincts.

**AI coach**
- The coach runs a fine-tuned Gemma 4 12B (4-bit) with a LoRA adapter, round 2 (iteration 900). It's served by `mlx_lm.server` on `127.0.0.1:8090`.
- Two lines in `.env` point the app at it: `LOCAL_AI_URL=http://127.0.0.1:8090` and `OLLAMA_MODEL=default_model`. Delete them to fall back to plain Ollama Gemma.
- The training data is synthetic and labelled as such. It is never used as accuracy evidence.
- Scorer results, base vs round 2: every rule passed 5% vs 18% of the time, rule breaks per plan fell from 1.83 to 0.97, and there were 0 unsafe answers out of 17 in both.

## How to run it

```
npm ci
cp .env.example .env      # fill in your own keys; never commit .env
npm run build && npm run start -- -p 3000
npm test                  # 234 tests should pass
```

- For the tuned coach, start `mlx_lm.server` with the round 2 adapter on port 8090. Without it the app uses plain Gemma through Ollama, or the curated plan library if no model runs.
- Set `DATA_DIR` to a folder outside `.next`. Otherwise a rebuild wipes the local profile store that's used while Atlas is unreachable.

## Open caveats

- **Atlas from uni wifi.** It times out there. Profiles then live in the local store (in memory, mirrored to `DATA_DIR/profiles.json`). Use a phone hotspot to reach Atlas.
- **Type distribution is healthy.** In a 20,000-person simulation, all 16 types appear, ISTJ is the most common at 12 to 15% (as in the UK), and clear INTP, ENFP, ESFJ, ISTP, INFJ and ENTJ answer patterns get their own type 84 to 97% of the time.
- **Lukewarm Openness answers read as low.** The IPIP norms come from a very open online sample (mean 3.94 out of 5), so answering 3s on Openness scores around the 6th percentile, which leans towards S. The E/I and S/N follow-up questions are always asked to correct for this. Don't change the norms without data.
- **Forecasts include average maturation** between 19 and 35 (more organised, calmer, a little more outgoing). On the quick test, an I near the middle can become an E by 35.
- **Never rig scoring towards a particular type.** If someone's answers point elsewhere, say so.
- The `.env`, keys and credentials stay off GitHub. Revoke any token that was pasted into a chat.
