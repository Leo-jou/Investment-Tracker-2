# Dobby QA

This is the coordination log between Codex implementation cycles and Dobby review.

## Current Handoff Signal

`CODEX_PUSHED_FOR_REVIEW` — 2026-05-05T10:14:42Z — Codex pushed the first small P0 implementation batch for quick-add date safety and live/mock price semantics.

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

- Commit: final pushed branch tip for this handoff.
- Task: First small P0 implementation batch from Dobby's 2026-05-05T10:05 review.
- Summary: Fixed quick-add's hardcoded transaction date, stopped BUY flows from creating or extending mock/manual-priced trade assets without provider-backed selection, added CSV import safety messaging for unknown trade symbols, labeled existing saved-price holdings, and hid fake/estimated 24h movers/holding moves behind `Not connected` states.
- Files changed:
  - `app/api/transactions/import/route.ts`
  - `app/assets/page.tsx`
  - `components/portfolio/asset-pill.tsx`
  - `components/portfolio/daily-movers.tsx`
  - `components/portfolio/positions-table.tsx`
  - `components/portfolio/quick-add-transaction-form.tsx`
  - `docs/WORK_QUEUE.md`
  - `docs/DOBBY_QA.md`
  - `lib/db/portfolio-repository.ts`
  - `lib/import/transaction-import.ts`
  - `tests/transaction-import.test.ts`
  - `context.md`
- Gates run:
  - `npm test` passed: 56/56.
  - `npm run lint` passed.
  - `npm run build` passed after rerunning outside the sandbox for Turbopack local port access.
  - `npm run context:update` passed and refreshed `context.md`.
  - `npm run context:check` passed after the final context wording cleanup.
- Known risks:
  - No all-portfolio aggregate view exists yet; dashboard and standalone transaction/manual-position pages default to the first portfolio unless a specific portfolio route is used.
  - `getDashboardDataForEmail` loads all active assets, so asset lists and backup JSON can include global asset metadata unrelated to the signed-in user's selected portfolio/account.
  - First-run Neon workspace bootstrap still inserts demo transactions, snapshots, and one manual position, which is risky for real personal-data onboarding unless clearly resettable or disabled.
  - CSV import now blocks unknown trade symbols instead of creating mock-priced assets; Leo may need to create/select provider-backed assets in quick-add before importing rows for new tickers.
  - Existing historical `mock` provider assets are labeled/blocked for new BUYs but are not migrated or deleted in this cycle.
  - Overview chart/timeframe metrics use `analyticsSnapshots`, which may be simulated history, without the same visible labeling shown in Analysis.
  - SELL validation checks current total holding quantity, not historical as-of-date availability.
  - Mutation/user-scope API coverage is missing; current production smoke is mostly read-only.
- Browser QA requested:
  - Verify quick-add date defaults to today's local date and still submits BUY/SELL/cash/manual entries.
  - Verify typed unknown BUY symbols show a clear error instead of creating a mock-priced asset.
  - Verify CSV preview marks unknown trade symbols invalid and does not import them.
  - Verify daily movers, asset 24h values, and holdings 24h movement columns no longer display fake percentages.
  - Check whether the remaining portfolio switcher still needs an `All portfolios` option before Leo enters real data.

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
