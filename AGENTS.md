# AGENTS.md

Instructions for coding agents (Codex and others) working on this repo. Read `CONTRIBUTING.md` first: it has the full rules, the off-limits files and the task list.

## Essentials

- Before each task, read `CHANGELOG.md` (what changed on main) and rebase on the latest `main`.
- Setup with `npm ci`, run with `npm run dev`. Every key in `.env` is optional, so the app works without any.
- Before you finish, run `npx tsc --noEmit`, `npm test` and `npm run build`. All three must pass. Never skip or delete a test to make them pass.
- Work on a branch named `<your-prefix>/<task>` (Sharkrian: `sharkrian/<task>`). Use one task per PR into `main`. Never push to `main`.
- **Don't edit the off-limits files** listed in CONTRIBUTING.md: the scoring and type model, questions, the AI coach, the hero animation, scripts, data and training files. If you think one needs a change, say so in the PR instead.
- Keep diffs small and focused. Don't reformat files you aren't changing, and don't add dependencies.
- For UI: check 1280 px and 390 px widths, make sure the page doesn't scroll sideways, and respect reduced motion. Use the existing CSS variables and classes in `src/app/globals.css`.
- Copy: plain British English and sentence case. No em dashes, emoji, citations on main pages, or hackathon branding.
- Content about real people must be sourced and limited to public figures (see CONTRIBUTING.md).
- Never commit secrets, `.env`, `data/` or `adapters/`.

## Map

- `src/app/`: routes (`/`, `/quiz`, `/r/[id]` results, `/types`, `/science`, `/compare`, `/track`, `/api/*`)
- `src/components/`: UI
- `src/lib/`: model, data and helpers (many files are off-limits)
- `tests/`: vitest
- `writeup/`: Devpost, DEV post and demo script
