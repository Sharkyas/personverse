# What changed on main

Newest first. Contributors and their agents: read this before starting a task, and rebase on `main` before opening a PR (`git fetch origin && git rebase origin/main`).

## 2026-11-14, 23:30
- **String theory is gone.** The background strings canvas (`Strings.tsx`), the unused `PortalScene.tsx`, the hover ripple on the hero image and all string copy are removed. The multiverse idea stays. Do not reintroduce string wording.
- **Nav:** no icon. The wordmark "Personalityverse" is gradient text (`.wordmark`: amber, violet, cyan). The header is `src/components/SiteHeader.tsx`: frosted glass, pale with dark text over the home hero, dark tint elsewhere and once you scroll past the hero. The favicon is a gradient P (`src/app/icon.svg`).
- **Home hero:** the copy card is gone. The headline runs diagonally through the fingertip gap, shrinking towards it and growing past it (`src/components/HeroCopy.tsx`, `.hero-diagonal`). The real `h1` is screen-reader text; the diagonal lettering is decorative. The hero now sits under the header and fills the viewport.

## 2026-11-14, 22:25
- Merged #10 (16 portraits rewritten as tendencies), #12 (celebrity audit, 63 people, every type has 3 or more) and #13 (pattern-answer detection, results simulations in a web worker). Closed #9 and #11 as duplicates of those.
- **New rule:** assign yourself to an issue (or comment "taking this") before starting, so two agents don't do the same task.

## 2026-11-14, 22:15
- **Site v3:** hero palette across the UI and charts. The colours are `--hero-pink #ff5fae`, `--hero-amber #ffd23f`, `--hero-violet #b57bff`, `--hero-cyan #8ff7f7` and `--hero-orange #ff8a4c`, set in `globals.css`. Trait colours are O violet, C cyan, E amber, A orange, N pink. The `violet-*` utility classes are renamed `accent-*`. Use the variables and never hard-code hex values.
- **Age slider and forecast age line:** pixel-shimmer gradient, still under reduced motion.
- **Hero image:** now 4K (3840x2160 webp, served through next/image).

## 2026-11-14, 22:05
- **Home page v2.** The hero is the static portal image (`src/components/PortalImageHero.tsx`, off-limits). Below it come a two-row moving strip of trait names, then a colour-blend section. There are no scroll transitions on home.
- **Fonts:** Unbounded for display, Manrope for body text, JetBrains Mono for numbers, site-wide. Use `var(--font-display)` for headings.
- **Results:** branching multiverse (`Branches.tsx`), universe cards with "pin two to compare" (`UniverseCards.tsx`), per-trait deep dives (`TraitDeepDives.tsx`, `src/lib/traitDetails.ts`).
- **Type:** letters now carry `borderline` and `direct`. TypeHero shows the other letter faintly for borderline letters. Optional "Pin down your type" follow-ups (`TypeCheck.tsx`, OEJTS items) run in the quiz. Type cuts now hand out each type about as often as in the UK (PR #7).
- **Question bank and metrics suite** under `src/lib/bank/` (PR #6). Metric cards are labelled measured, simulated or pending. Keep those labels honest.
- **v2 synthetic fine-tuning data** in `data/synthetic-v2/` (PR #8). It's synthetic, so never use it as evidence or in the accuracy metrics.
- **Tests:** vitest 188 pass. Playwright e2e and axe checks live in `e2e/` (`npx playwright test`).
