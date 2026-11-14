# CLAUDE.md

Guidance for Claude Code in this repo. The rules are the same as for any contributor, so read `CONTRIBUTING.md` (full rules, off-limits files, task list) and `AGENTS.md` (short version).

- Before each task, read `CHANGELOG.md` (what changed on main) and rebase on the latest `main`.
- Commands: `npm ci`, `npm run dev`, `npx tsc --noEmit`, `npm test`, `npm run build`.
- Branch `sharkrian/<task>` (or your own prefix), one task per PR into `main`. Never push to `main` or merge your own PR.
- Off-limits without the maintainer's OK: `src/lib/{mbti,mbti.json,oejts,questions,model,params,quality,simulate,coachPrompt,coachLibrary,ai}.ts`, `src/lib/*Metrics*.json`, `src/lib/ipip*.json`, `src/lib/gemmaEval.json`, `src/components/Portal*.tsx`, `public/hero/`, `scripts/`, `data/`, `adapters/`, `research/`, `.env`.
- Before finishing: tsc clean, tests pass, build compiles, and UI is checked at 1280 and 390 px. Include screenshots in the PR.
- Style: the existing CSS variables and classes, British English, sentence case, no em dashes or emoji, no citations on main pages.
