# Contributing to Personalityverse

Personalityverse is a Next.js app. You take a 50-question Big Five test (IPIP), and it estimates:

- what you were like as a baby,
- the odds each trait changes by an age you choose,
- alternate "multiverse" versions of you under different upbringings,
- an MBTI-style type with a confidence for each letter.

A local Gemma model writes the coaching plan. Every feature has a fallback, so the app runs with no keys at all.

## Setup

```bash
npm ci
cp .env.example .env   # optional: every key is optional
npm run dev            # http://localhost:3000
```

## Before every PR

```bash
npx tsc --noEmit       # must be clean
npm test               # vitest: must pass
npm run lint
npm run build          # must compile
```

Check any UI change at **1280 px and 390 px wide**. The page must not scroll sideways, and it must still work with reduced motion turned on.

## How we work

- **Branches:** each contributor has a prefix (Sharkrian uses `sharkrian/<short-task-name>`, e.g. `sharkrian/type-pages-intj`). Branch from the latest `main`.
- **One task per PR**, with a PR into `main`. Keep PRs small. Link the issue with `Closes #N`.
- **PR description:** what changed, how you checked it, and screenshots for any UI change.
- **Merging:** the maintainer reviews and merges. Don't merge your own PR, and don't push to `main`.
- **Updating your branch:** rebase on `main` if it moved (`git fetch origin && git rebase origin/main`).

## Off-limits files

These hold the scoring science, the trained model work and the hero design. Changing them needs the maintainer's say-so. If a task seems to need one, open an issue or ask in your PR.

- `src/lib/mbti.ts`, `src/lib/mbti.json`, `src/lib/oejts.ts`
- `src/lib/questions.ts`
- `src/lib/model.ts`, `src/lib/params.ts`, `src/lib/quality.ts`, `src/lib/simulate.ts`
- `src/lib/ipip*.json`, `src/lib/simulationMetrics.json`, `src/lib/gemmaEval.json`
- `src/lib/coachPrompt.ts`, `src/lib/coachLibrary.ts`, `src/lib/ai.ts`
- `src/components/PortalImageHero.tsx`, `src/components/PortalScene.tsx`, `public/hero/`
- `scripts/` (fitting, simulation, evaluation and fine-tuning), `data/`, `adapters/`, `research/`
- `.env`, and anything holding keys

## Style

- TypeScript strict, React 19 server components by default. Add `"use client"` only where needed.
- Tailwind 4, using the existing CSS variables in `src/app/globals.css` (`--color-*`, `--font-display`, the `card`, `chip`, `kicker` and `opt` classes). Don't add new colour hex codes when a variable exists.
- Fonts: Unbounded for display, Manrope for body text, JetBrains Mono for numbers.
- Copy: short, plain British English, sentence case. Use "you" and avoid jargon.
- Don't put em dashes, emoji, "AI-sounding" filler or hackathon branding on the site.
- No citations on the main pages. Sources belong on `/science`.
- Accessibility: real buttons and links, visible focus, alt text, and aria labels on interactive charts.
- Don't commit secrets. Don't add dependencies without asking in the PR.

## Content rules (types and people)

- The type pages describe tendencies, not destiny. Say "people of this type often…", never "you are…".
- Famous people (`src/lib/celebs.json`): keep the existing fields (`name`, `field`, `typing_label`, `O C E A N` as 0-100 estimates, `note`). The `typing_label` must say how the type is known, for example "self-reported", "popular typing" or "popular typing, disputed". Put the source URL in your PR description. Only include well-known public figures, never private individuals. Keep the notes neutral and about public work.
- The app is educational, not a psychological assessment. Keep that framing.

## Current task list

The open tasks are GitHub issues labelled `good first task` and `sharkrian`:

1. **Type pages content** (`/types`, `src/lib/typeDetails.ts` copy only): review and enrich all 16 portraits.
2. **Celebrity data** (`src/lib/celebs.json`): add sourced, well-known examples per type.
3. **Mobile QA**: test every page at 390 px and fix layout bugs outside the off-limits files.
4. **Demo video and write-ups** (`writeup/`): a 2-minute demo recording and Devpost copy edits.
5. **ElevenLabs narration script** (`src/lib/narration.ts` text only): tighten the narrator lines.
