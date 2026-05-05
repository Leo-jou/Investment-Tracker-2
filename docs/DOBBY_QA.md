# Dobby QA

This is the coordination log between Codex implementation cycles and Dobby review.

## Current Handoff Signal

`DOBBY_HANDOFF_READY` — 2026-05-05T09:47:00Z — Coordination protocol is ready. Codex may establish autonomous polling and begin Cycle 0.

## Review Protocol

Dobby reviews after Codex pushes to `codex/openclaw-playground`.

Dobby should check, as relevant:

- `git status --short --branch`
- latest commit/diff
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run context:check`
- local app browser QA for changed flows
- console errors and obvious responsive issues

## Current QA Focus

MVP reliability:

- Neon-backed persistence and user scoping.
- No data-loss risk in core flows.
- Live/stale/unavailable price semantics.
- Correct math and matching tooltips/charts.
- CSV/backup export confidence.
- Good-enough dashboard/transaction/portfolio UX.

## Pending Dobby Review

- Commit: pending until this cycle is committed and pushed; review pushed HEAD on `codex/openclaw-playground`.
- Task: Cycle 1 reliability audit and plan.
- Summary: Audited persistence, auth scoping, multi-portfolio handling, transaction/manual-position CRUD, CSV import, live quote/refresh, exports/backups, portfolio math, chart sources, tests, and data-loss risks. No runtime behavior was changed in this cycle.
- Files changed:
  - `docs/WORK_QUEUE.md`
  - `docs/DOBBY_QA.md`
  - `context.md`
- Gates run:
  - `npm test` passed: 55/55.
  - `npm run lint` passed.
  - `npm run build` passed after rerunning outside the sandbox; the first sandboxed run hit Turbopack's local port permission error while processing `app/globals.css`.
  - `npm run context:update` passed and refreshed `context.md`.
- Known risks:
  - No all-portfolio aggregate view exists yet; dashboard and standalone transaction/manual-position pages default to the first portfolio unless a specific portfolio route is used.
  - `getDashboardDataForEmail` loads all active assets, so asset lists and backup JSON can include global asset metadata unrelated to the signed-in user's selected portfolio/account.
  - First-run Neon workspace bootstrap still inserts demo transactions, snapshots, and one manual position, which is risky for real personal-data onboarding unless clearly resettable or disabled.
  - Typed/imported BUY flows can create `mock` provider assets with a saved price of 1 when no provider metadata is selected; those assets are excluded from provider refresh.
  - Overview chart/timeframe metrics use `analyticsSnapshots`, which may be simulated history, without the same visible labeling shown in Analysis.
  - Daily movers and 24h holding moves are mock/estimated rather than provider-backed.
  - Quick-add defaults transaction dates to `2026-04-27`, which is unsafe for real data entry.
  - SELL validation checks current total holding quantity, not historical as-of-date availability.
  - Mutation/user-scope API coverage is missing; current production smoke is mostly read-only.
- Browser QA requested:
  - Confirm the current app makes demo/mock/simulated states visible enough for a real user.
  - Check whether the portfolio switcher needs an `All portfolios` option before Leo enters real data.
  - Verify quick-add date behavior and whether fake 24h/daily movers should be hidden immediately.

## Dobby Findings

_No findings yet._

## Leo Review Notes

- Leo's immediate need is a reliable product he can use personally now.
- UI can be imperfect if the product is safe and the numbers are trustworthy.
- Do not prioritize AI, news polish, scheduled emails, taxes, or fees before reliability.
