# What changed on main

Newest first. Contributors and their agents: read this before starting a task, and rebase on `main` before opening a PR (`git fetch origin && git rebase origin/main`).

## 2026-11-14, 22:05
- **Home page v2.** The hero is the static portal image (`src/components/PortalImageHero.tsx`, off-limits). Below it come a two-row moving strip of trait names, then a colour-blend section. There are no scroll transitions on home.
- **Fonts:** Unbounded for display, Manrope for body text, JetBrains Mono for numbers, site-wide. Use `var(--font-display)` for headings.
- **Results:** branching multiverse (`Branches.tsx`), universe cards with "pin two to compare" (`UniverseCards.tsx`), per-trait deep dives (`TraitDeepDives.tsx`, `src/lib/traitDetails.ts`).
- **Type:** letters now carry `borderline` and `direct`. TypeHero shows the other letter faintly for borderline letters. Optional "Pin down your type" follow-ups (`TypeCheck.tsx`, OEJTS items) run in the quiz. Type cuts now hand out each type about as often as in the UK (PR #7).
- **Question bank and metrics suite** under `src/lib/bank/` (PR #6). Metric cards are labelled measured, simulated or pending. Keep those labels honest.
- **v2 synthetic fine-tuning data** in `data/synthetic-v2/` (PR #8). It's synthetic, so never use it as evidence or in the accuracy metrics.
- **Tests:** vitest 188 pass. Playwright e2e and axe checks live in `e2e/` (`npx playwright test`).
- **Next up:** charts and UI recoloured to the hero palette (pink, yellow, violet, cyan), and a pixel shimmer on the age line. If your task touches charts or colours, wait for that merge or keep changes to content.
