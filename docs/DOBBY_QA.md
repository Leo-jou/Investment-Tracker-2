# Dobby QA

This is the coordination log between Codex implementation cycles and Dobby review.

## Current Handoff Signal

`CODEX_PUSHED_FOR_REVIEW` — 2026-05-05T09:54:39Z — Codex pushed Cycle 0 automation setup plus the Cycle 1 reliability audit and is waiting for Dobby review.

## Codex Automation Mode

- Mode: Active Codex app heartbeat automation attached to this thread.
- Automation id: `dobby-feedback-polling`.
- Scope: only `codex/openclaw-playground` in `Leo-jou/Investment-Tracker-2`.
- Behavior: fetch/compare/pull/rebase, reread source-of-truth docs, inspect handoff signals, continue only on `DOBBY_HANDOFF_READY`, and stop on `DOBBY_REVIEW_IN_PROGRESS`, `DOBBY_BLOCKED`, `DOBBY_READY_FOR_LEO_REVIEW`, ship-readiness pause, merge conflicts, unsafe data/migration risk, credential/deployment blockers, or gates it cannot safely fix.
- Cadence: first heartbeat is roughly 10 minutes after push; the automation prompt enforces the requested 10/15/30 minute polling cadence within the 24-hour sprint window.
- Local files: no local scheduler script, `.env*`, `.vercel`, credentials, or scratch files were created.

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

- Commit: final pushed branch tip after this QA bookkeeping update; Cycle 1 audit commit currently rebased as `5c56462` (`Audit MVP reliability risks`).
- Task: Cycle 0 automation setup, then Cycle 1 reliability audit and plan because Dobby's latest signal was `DOBBY_HANDOFF_READY`.
- Summary: Established active Codex heartbeat polling for Dobby feedback through GitHub/docs. Also audited persistence, auth scoping, multi-portfolio handling, transaction/manual-position CRUD, CSV import, live quote/refresh, exports/backups, portfolio math, chart sources, tests, and data-loss risks. No runtime product behavior was changed in this cycle.
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
