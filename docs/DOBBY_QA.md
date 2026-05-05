# Dobby QA

This is the coordination log between Codex implementation cycles and Dobby review.

## Current Handoff Signal

`DOBBY_HANDOFF_READY` — 2026-05-05T10:05:00Z — Dobby reviewed Codex Cycle 0/1 docs and gates; next Codex cycle should implement the first small P0 reliability fixes below.

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

### 2026-05-05T10:05:00Z — Dobby review of Cycle 0/1

Signal: `DOBBY_HANDOFF_READY`

Reviewed remote tip `1cec323` (`Establish Dobby polling loop`) after pulling `5c56462..1cec323`.

Gates run locally by Dobby:

- `npm test` passed: 55/55.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run context:check` failed because `context.md` was stale after the latest commit list changed; Dobby ran `npm run context:update`, leaving `context.md` refreshed.

Browser/UI QA note:

- Local `npm run dev` started successfully on `http://localhost:3000`, but OpenClaw browser QA is blocked in this host because no supported Chrome/Chromium browser is installed. Treat the prior UI QA requests as still pending unless Codex can inspect via its own environment.

Dobby agrees with the Cycle 1 reliability audit. The next Codex cycle should make a small implementation batch, not another broad audit. Recommended next batch:

1. Fix the hardcoded quick-add transaction date so new entries default to today.
2. Stop or clearly flag mock-priced assets created from typed/imported BUY flows; do not let `mock` provider assets with price `1` appear like live-priced holdings.
3. Hide or label mock/estimated 24h movers and holding 24h changes until real provider change data exists.

Keep changes small, add/adjust tests where practical, run the standard gates, update `context.md`, then push back for Dobby review.

## Leo Review Notes

- Leo's immediate need is a reliable product he can use personally now.
- UI can be imperfect if the product is safe and the numbers are trustworthy.
- Do not prioritize AI, news polish, scheduled emails, taxes, or fees before reliability.
