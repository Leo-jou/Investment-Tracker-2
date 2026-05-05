# Work Queue

Status labels:

- `[ ]` not started
- `[~]` in progress / needs another pass
- `[x]` done pending/after Dobby QA
- `[blocked]` requires Leo, credentials, production env, or migration decision

Codex should take the highest-priority unblocked item, keep the change small, push every cycle, and wait for Dobby QA.

## Current Focus

**MVP reliability before features.** Make FolioCore safe for Leo to use as a real personal investment tracker.

## Cycle 0 — Automation Setup

### [x] P0: Establish Codex autonomous polling loop

Goal: Leo should not need to relay messages between Codex and Dobby.

Codex instructions:

- Determine whether the current Codex environment supports persistent automation/check-ins.
- If yes, configure the session to keep checking GitHub for Dobby updates after each push.
- If not, create a safe local scheduled/polling script or document exactly why this is not possible.
- The polling loop must only work on `codex/openclaw-playground`.
- The loop must pull/rebase before each cycle and push after each cycle.
- Stop on conflicts, failing gates, data-risk blockers, credential blockers, or `Status: Ready for Leo review — pause Codex automation.` in `docs/SHIP_READINESS.md`.
- Record the automation mode and limitations in `docs/DOBBY_QA.md`.

Acceptance criteria:

- `docs/DOBBY_QA.md` says whether Codex automation is active, fallback-script based, or unavailable.
- If a script/job was created, document how it works and where it lives.
- Commit and push the result.

Cycle 0 result:

- Codex app heartbeat automation is active for this thread as `dobby-feedback-polling`.
- It polls GitHub/repo docs for Dobby feedback on `codex/openclaw-playground`, starts with a roughly 10-minute heartbeat, and the prompt enforces the requested 10/15/30 minute cadence within the 24-hour sprint window.
- It re-reads the source-of-truth docs after remote changes and only continues implementation when `docs/DOBBY_QA.md` shows `DOBBY_HANDOFF_READY`.
- It stops on merge conflicts, blocked/ready-for-Leo signals, unsafe migrations/data-loss risk, credential/deployment blockers, or gates it cannot safely fix.
- No local scheduler script or secret-bearing file was created.

## Cycle 1 — Reliability Audit And Plan

### [x] P0: Audit persistence, auth scoping, live-price flow, and core data model

Goal: establish exactly what is already reliable and what must be fixed before Leo enters real data.

Codex instructions:

- Do not start broad feature implementation in this cycle.
- Inspect the code paths for:
  - auth/login and user scoping;
  - portfolio creation/listing and multiple portfolio handling;
  - transaction create/edit/delete/import;
  - manual positions;
  - price refresh and quote lookup;
  - exports/backup;
  - portfolio math and chart timeframe sources;
  - Neon/Drizzle schema and migrations.
- Identify whether each core flow is DB-backed, mock-backed, local-storage-backed, or mixed.
- Identify any data-loss risks, mock-data leakage risks, and missing tests.
- Add or update documentation only if no code fix is safe yet.
- If a small obvious test can be added without product risk, add it.

Acceptance criteria:

- `docs/DOBBY_QA.md` has a `Pending Dobby Review` note summarizing findings.
- `docs/WORK_QUEUE.md` is updated with concrete next tasks based on the audit.
- Any newly discovered P0 risks are clearly marked `[blocked]` or `[ ]`.
- Repo is committed and pushed.

Cycle 1 audit result:

- Core portfolio, transaction, manual position, price snapshot, FX snapshot, and portfolio snapshot tables are present in Drizzle/Neon.
- Authenticated CRUD routes generally call `requireSessionEmail()` and verify portfolio ownership before writes.
- Major reliability gaps remain before Leo enters real data: no all-portfolio aggregate view, global asset metadata leaks into user asset lists/backups, first-run Neon workspaces are seeded with demo transactions/manual positions, import/typed BUY flows can silently create mock-priced assets, overview charts/timeframe cards can use simulated analytics history, 24h movers are mock/estimated, quick-add defaults to a historical date, and mutation/user-scope API coverage is thin.
- No runtime implementation was attempted in this cycle; next cycles should fix the P0 items below in small batches.

Suggested gates:

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run context:check` or `npm run context:update` if context changed


## Dobby Review — 2026-05-05T10:05:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle.

Dobby gates on remote tip `1cec323`:

- `npm test` passed: 55/55.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run context:check` reported stale `context.md`; Dobby ran `npm run context:update` and will commit the refreshed context with this feedback.
- Browser QA remains pending because this host has no supported Chrome/Chromium browser for OpenClaw browser control, although local `npm run dev` starts successfully.

Next implementation recommendation: take the live/mock price semantics batch first, including quick-add date cleanup, because those are direct real-data trust risks before Leo enters personal data.


## Dobby Review — 2026-05-05T10:32:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle.

Dobby reviewed `643602f` (`Harden real-data price semantics`):

- `npm test` passed: 56/56.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run context:update` was needed, then `npm run context:check` passed.
- Browser/UI QA is still blocked on Dobby's host due no supported Chrome/Chromium browser.

Next recommendation: take the user/account asset-scoping slice next. Focus on preventing global/unrelated assets from appearing in Leo-visible asset lists, CSV known-symbol checks, and backup/export payloads. Keep it small and avoid migration/data deletion without Leo approval.



## Dobby Review — 2026-05-05T11:05:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle.

Dobby reviewed `461aa29` (`Scope visible assets to account data`):

- `npm test` passed: 58/58.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run context:update` was needed, then `npm run context:check` passed.
- Asset scoping slice accepted: dashboard assets, `/assets`, CSV known-symbol validation, and backup/report export asset payloads are now scoped away from unrelated global assets.
- Browser/UI QA is still blocked until Dobby has Chrome/Chromium access or an OpenClaw browser node.

Next recommendation: add mutation-capable DB/API smoke tests for create/edit/delete/import/export/scoping paths, including another-account asset fixtures. Then address first-run demo-data safety before Leo enters real data. Keep automation active during the 24-hour MVP push unless a ready-for-Leo pause signal appears.


## Dobby Review — 2026-05-05T11:20:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle.

Dobby reviewed `424c607` (`Add guarded mutation smoke coverage`):

- `npm test` passed: 58/58.
- `npm run lint` passed.
- `npm run smoke:mutations` passed in guarded skip mode; it still needs a safe real DB/API target to execute mutations.
- `npm run build` passed.
- `npm run context:update` was needed, then `npm run context:check` passed.
- OpenClaw Chrome/browser access is operational, but browser policy blocks localhost/private app navigation. Dobby used authenticated HTTP-render smoke for `/assets`, `/dashboard`, and `/transactions`; no server error found.

Next recommendation: address first-run demo-data safety before Leo enters real data. Make new real-user Neon workspaces empty by default or unmistakably demo-labeled/resettable, and add clear persistence-mode warning/gating when `DATABASE_URL` is absent. Avoid destructive migrations or deleting existing user data without Leo approval.

Deployment/QA request: Codex should provide the Vercel preview/test URL for `codex/openclaw-playground` so Dobby can run full Browser/UI QA. If no preview exists or it is protected, document the blocker and whether Codex can create/trigger one from Vercel access.


## Dobby Review — 2026-05-05T11:46:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle. The required next task is to fix the no-database price refresh behavior; this is Codex-actionable and should not pause automation.

Dobby reviewed `9032523` (`Harden first-run demo safety`):

- `npm test` passed: 59/59.
- `npm run lint` passed.
- `npm run smoke:mutations` passed in guarded skip mode.
- `npm run build` passed.
- `npm run context:update` was needed, then `npm run context:check` passed.
- HTTP-render demo-mode QA with `DATABASE_URL` unset passed for `/dashboard`, `/transactions`, `/manual-positions`, and `/assets` banners/disabled controls.
- `POST /api/portfolios` and committed CSV import fail closed with the persistence warning.

Next task / blocker to fix: `POST /api/prices/refresh` still returns HTTP 200 with `mode: "mock"`, mock update counts, and `"Mock prices and snapshots remain active."` when `DATABASE_URL` is absent. That contradicts read-only demo mode and should fail closed with the same persistence warning before this slice is accepted.

Codex should fix the refresh endpoint/refresh helper no-DB behavior, add a focused assertion if practical, rerun gates, and push back for Dobby review. Also still provide the Vercel preview/test URL or document the exact blocker.


## Dobby Review — 2026-05-05T13:38:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle. Cycle 6 is accepted.

Dobby reviewed `2ca810f` / `bd33a29` (`Fail closed demo price refresh`):

- `npm test` passed: 61/61.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` passed in guarded skip mode.
- `npm run context:update` was needed, then `npm run context:check` passed.
- HTTP demo-mode QA with `DATABASE_URL` unset confirmed `POST /api/prices/refresh` now returns HTTP 409 with the read-only persistence warning and no mock refresh success counts.
- `/dashboard`, `/transactions`, `/manual-positions`, and `/assets` still include the read-only demo banner.

Next recommendation: take the all-portfolio aggregate clarity slice next. Leo needs to understand total net worth across portfolios before using this as his real tracker. Keep it small, scoped to the signed-in user, and avoid unrelated feature polish.


## Dobby Review — 2026-05-05T14:13:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle.

Dobby reviewed `24f06ce` / `86377c1` for the all-portfolio aggregate slice:

- `npm test` passed: 63/63.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` skipped safely because `SMOKE_MUTATIONS=1` was not set.
- `npm run context:update` was needed, then `npm run context:check` passed.
- Browser click-through is still not complete: Chrome exists on the host now, but OpenClaw browser navigation to localhost is policy-blocked; `curl` only confirmed the app responds with the login page.

Next recommendation: finish the price freshness/stale/unavailable visibility slice. Surface `priceCapturedAt`, provider, manual/saved/stale/unavailable states, and refresh failures consistently across assets, holdings, and quick-add. Do not re-enable 24h movers until real provider change data is stored.


## Dobby Review — 2026-05-05T14:50:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle. Cycle 8 is accepted.

Dobby reviewed `aed8a3e` / `d38ccf4` (`Surface price freshness states`):

- `npm test` passed: 67/67.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` passed in guarded skip mode.
- `npm run context:update` was needed, then `npm run context:check` passed.
- HTTP demo-mode QA confirmed `/assets` renders read-only mode plus provider/status/saved-price labeling, dashboard/portfolio pages still render, and search returns saved local data while UI search is disabled in demo mode.

Next recommendation: take the math/tooltip consistency slice, starting with historical SELL validation so backdated sells cannot pass based only on current holdings. Add focused tests, then continue simulated-history labeling outside Analysis.


## Dobby Review — 2026-05-05T14:52:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle.

Dobby reviewed `aed8a3e` / `d38ccf4` for the price freshness visibility slice:

- `npm test` passed: 67/67.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` skipped safely because `SMOKE_MUTATIONS=1` was not set.
- `npm run context:check` passed.
- Browser click-through and real provider-failure QA remain blocked without a usable authenticated preview/browser target.

Next recommendation: take the math/tooltip consistency slice. Prefer either using raw persisted snapshots for overview/timeframe cards or clearly labeling simulated analytics history wherever it appears outside Analysis. Also tighten SELL validation by historical as-of-date availability if it fits the same small batch.


## Dobby Review — 2026-05-05T15:18:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle. Cycle 9 is accepted.

Dobby reviewed `80a6656` / `0668237` (`Validate sells by transaction date`):

- `npm test` passed: 69/69.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` passed in guarded skip mode.
- `npm run context:check` passed.
- SELL validation now uses occurred date, created-at, then id ordering to check quantity available at the sell date, including same-day ordering and edit exclusion.

Next recommendation: take simulated-history labeling outside Analysis. Overview/timeframe UI should not let generated analytics history look like persisted real performance history.



## Dobby Review — 2026-05-05T15:20:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle. Cycle 9 is not accepted yet.

Dobby reviewed `7434c96` / `0668237` for historical SELL validation:

- `npm test` passed: 69/69.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` skipped safely because `SMOKE_MUTATIONS=1` was not set.
- `npm run context:update` was needed, then `npm run context:check` passed.

Blocking gap to fix next: current SELL validation checks availability immediately before the candidate SELL, but does not verify that a newly inserted/edited backdated SELL does not invalidate later existing SELLs. Example: BUY 10 on Jan 1, existing SELL 10 on Mar 1, then add SELL 10 on Feb 1. The Feb candidate passes, but the Mar SELL becomes historically impossible.

Next recommendation: add full sorted transaction timeline validation after applying the create/edit candidate, reject any SELL that would make running quantity negative, preserve edit replacement semantics, and add focused tests for downstream oversell plus CSV import batch behavior.



## Dobby Review — 2026-05-05T15:36:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle. Cycle 10 is accepted.

Dobby reviewed `04d9b5c` / `d53cd1e` (`Validate full sell timeline`):

- `npm test` passed: 73/73.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` skipped safely because `SMOKE_MUTATIONS=1` was not set.
- `npm run context:update` was needed, then `npm run context:check` passed.

The full sorted transaction timeline is now validated after create/edit candidates, so a backdated SELL cannot make later SELL rows historically impossible. The focused tests cover downstream oversell, edit replacement semantics, sequential CSV-style rows, and valid covered timelines.

Next recommendation: take simulated-history labeling outside Analysis, then continue the remaining math/tooltip consistency pass.



## Dobby Review — 2026-05-05T16:10:00Z

Status: `DOBBY_HANDOFF_READY` for the next Codex implementation cycle. Cycle 12 is accepted.

Dobby reviewed `96c551d` / `24dd8ab` (`Use real allocation PnL`):

- `npm test` passed: 76/76.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` skipped safely because `SMOKE_MUTATIONS=1` was not set.
- `npm run context:check` passed.

The allocation table now uses real transaction-backed open-position P&L and shows `N/A` for manual-only values instead of invented gains. Grouped rows aggregate real P&L when fully transaction-backed and withhold P&L when manual values are mixed in.

Next recommendation: finish formula/tooltip terminology across portfolio value, net contributions, realized/unrealized/open-position P&L, TWR, chart range semantics, exports/digests, and backdated-entry snapshot behavior. If no P0 blocker remains, prepare ship-readiness and pause for Leo review.

## Next Likely Tasks After Audit

These are placeholders until Cycle 1 confirms the real state.

### [~] P0: Add mutation-capable DB/API smoke tests for real user data flows and scoping

Target flows:

- create portfolio;
- add BUY transaction;
- edit transaction;
- delete transaction;
- CSV import known/unknown symbols using account-scoped assets;
- `/assets` excludes another account's assets;
- `/api/export` / backup JSON excludes another account's assets and clarifies selected-portfolio vs all-user-portfolio metadata;
- add manual position if still part of MVP.

Audit notes:
- Current `scripts/smoke-production.ts` is mostly read-only, except optional price refresh.
- Unit tests cover portfolio math, export generation, provider normalization, and CSV import parsing, but not the API create/edit/delete scoping paths against a real DB.

Cycle 4 partial result:

- Added `npm run smoke:mutations`, an opt-in guarded DB/API mutation smoke script.
- The script skips safely unless `SMOKE_MUTATIONS=1` is set.
- When enabled with `DATABASE_URL` and an allowlisted `SMOKE_MUTATION_EMAIL` or `SMOKE_EMAIL`, it exercises:
  - `/api/auth/login`;
  - `/api/portfolios` temporary portfolio creation;
  - `/api/transactions` provider-backed BUY creation;
  - `/api/transactions/[id]` edit and delete;
  - `/api/transactions/import` known/unknown symbol validation;
  - `/assets` account-scoping with another-account fixture;
  - `/api/export?format=backup-json` selected-portfolio asset scoping.
- The smoke script uses direct DB cleanup for its temporary portfolio, transactions, unique test assets, and another-account fixture.
- Transaction POST now returns the created transaction id, enabling precise smoke cleanup without scraping UI state.

Still open:

- Run the mutation smoke against a safe Vercel/Neon target with a real allowlisted test account and verify cleanup.
- Full browser click-through QA still needs an allowed deployed preview/local browser target; OpenClaw Chrome works, but localhost navigation is currently policy-blocked.

### [~] P0: Confirm all core data is Neon-backed and user-scoped

Fix any remaining local/mock-only persistence for MVP-critical data.

Concrete next work:
- Scope `data.assets` and backup exports to assets referenced by the authenticated user's selected portfolio or account; do not include unrelated global assets in user-visible lists/backups.
- Verify the first-run Neon workspace behavior against a safe DB target: new users should get an empty default portfolio, not demo trades/manual positions/simulated snapshots.
- Verify no-`DATABASE_URL` preview/demo mode renders as read-only demo mode and cannot be confused with persistent real-data mode before allowing edits.
- Consider fail-closed email allowlist behavior in production for the private email fallback.

Cycle 3 partial result:

- Dashboard `data.assets` now includes only assets referenced by the selected portfolio's transactions, preventing unrelated global assets from leaking into selected-portfolio views, CSV known-symbol inputs derived from dashboard data, and backup/export payloads.
- `/assets` now lists only assets referenced by portfolios owned by the signed-in account, rather than every active global asset row.
- CSV import known-symbol validation now uses the signed-in account's scoped asset list, so known symbols can span Leo's own portfolios without including unrelated global assets.
- Added focused tests for the asset-scoping helper.

Cycle 5 partial result:

- Real DB first-run workspace bootstrap now creates only a blank `Personal` portfolio with no demo assets, transactions, manual positions, price snapshots, or simulated portfolio snapshots.
- Existing users/data are not deleted or migrated; this only changes bootstrap behavior for users without portfolios.
- Empty real portfolios no longer receive simulated analytics chart history; charts show an empty-history state until real entries/snapshots exist.
- No-`DATABASE_URL` mode is explicitly marked as read-only demo mode in dashboard/transactions/manual/assets views, and write controls for portfolios, transactions, imports, manual positions, provider asset search, and price refresh are disabled with the persistence warning.
- Mutation APIs now use a clear no-database guard message, and CSV import commit fails closed before attempting row writes when persistence is absent.
- Added focused analytics-history coverage so a zero-value empty portfolio does not generate fake chart values.

Cycle 6 partial result:

- `/api/prices/refresh` now fails closed when `DATABASE_URL` is absent instead of reporting a successful mock refresh.
- `refreshPortfolioData` uses the shared persistence guard, so manual and cron refresh paths cannot manufacture mock update counts without Neon persistence.
- The API returns a structured non-2xx response with the same read-only demo-mode persistence warning.
- Added focused persistence-mode guard coverage.

Still open:

- Run the guarded mutation smoke against a safe Vercel/Neon target to verify real DB create/edit/delete/import/export/scoping and cleanup.
- Browser/HTTP-render QA should verify the new read-only demo banner/disabled controls and the empty first-run portfolio behavior.
- Provide a usable Vercel preview URL or resolve preview access. Current local state has no `.vercel/project.json`, no `vercel` CLI binary on PATH, Vercel MCP list-project/deployment calls failed or lacked access, and GitHub status exposed Vercel dashboard URLs but not a direct preview hostname.

### [~] P0: Harden live quote and price refresh semantics

Make stale/unavailable/manual/mock price states explicit and safe.

Concrete next work:
- Stop silently creating mock-priced assets for typed/imported BUY rows, or make the unpriced/manual state impossible to mistake for live pricing.
- Surface `priceCapturedAt`, provider, and stale/unavailable/manual/mock states in holdings/assets/quick-add.
- Replace or hide mock/estimated 24h movers and 24h holding moves until real provider change data exists.
- Keep refresh failures visible and ensure skipped assets are clear to the user.

Cycle 2 partial result:

- Quick-add transaction dates now default to the user's current local date instead of the historical `2026-04-27` seed date.
- BUY creation no longer creates a new `mock` provider asset with a saved price of 1 when the user types an unknown symbol or imports an unknown CSV symbol.
- BUY creation against existing `mock` or `manual` priced assets is blocked unless the user selects a provider-backed search result.
- CSV import previews mark unknown trade symbols invalid with a clear mock-price safety message.
- Existing `mock` or `manual` holdings now show a `saved price` badge in holding rows.
- Daily movers, asset-list 24h values, and holdings 24h gain/move values are hidden behind a `Not connected` state until real provider-backed change data is available.

Still open:

- Confirm manual refresh failure messaging in browser QA against a real provider/API failure state.
- Add provider-backed 24h change data before re-enabling movers or holding 24h movement columns.

Cycle 8 partial result:

- Added a shared price-status helper that classifies provider-backed prices as fresh, stale, timestamp-missing, unavailable, or saved/manual.
- `/assets` now shows readable provider names, exchange/provider IDs, last quote timestamps, unavailable prices, and price-status badges/details instead of a generic 24h placeholder.
- Holdings Details now shows last quote time, provider label, and price-status badges/details alongside last price and exchange metadata.
- Quick-add now carries saved quote timestamps from local asset search results and reports whether it is using a live provider quote, a saved provider price, or an unavailable quote when deriving quantity/total.
- Added focused tests for fresh, stale, saved/manual, and unavailable price states.

### [x] P0: Verify all-portfolio aggregate view

If missing, implement a simple aggregate view or clear selector state that lets Leo understand total net worth across portfolios.

Audit notes:
- `/dashboard` and standalone transactions/manual-position pages default to the first portfolio.
- `/portfolios/[id]` supports individual portfolio views.
- No account-level aggregate portfolio option is present in the switcher, exports, charts, or backup.

Cycle 7 result:

- `/dashboard` now loads a virtual `All portfolios` account-level view scoped to the signed-in user's portfolios.
- The portfolio switcher includes `All portfolios` first and links it back to `/dashboard`; individual portfolios still live at `/portfolios/[id]`.
- Aggregate dashboard data combines the signed-in user's transactions, manual positions, holdings, allocations, assets, exports, news/digest subjects, and snapshots without touching other users or unrelated global assets.
- Aggregate snapshot history is summed by date and recomputes aggregate TWR from the combined value/cash-flow series.
- Ambiguous write controls in the aggregate view are disabled with a clear "choose a specific portfolio" message; portfolio-specific write flows remain available on individual portfolio pages.
- Added focused tests for the aggregate option and summed snapshot/TWR behavior.

### [~] P0: Math and tooltip consistency pass

Verify formulas and UI labels for portfolio value, net contributions, realized/unrealized P&L, TWR, risk metrics, and chart filters.

Concrete next work:
- Use raw persisted snapshots for overview value/timeframe cards, or label simulated analytics history wherever it is used outside the Analysis tab.
- Revisit historical data entry behavior: mutations upsert today's snapshot only, so backdated transaction entry does not recompute historical snapshots.
- Remove fake allocation-table unrealized gains that are derived from row index rather than portfolio math.

Cycle 2 partial result:

- Fixed quick-add's hardcoded default date.
- Removed the fake/estimated 24h movement values from user-visible tables and mover panels.

Cycle 9 result:

- SELL create/edit validation now checks asset quantity available at the sell date using transaction ordering by occurred date, created-at, then id.
- Backdated sells can no longer pass merely because later BUY rows make current holdings sufficient.
- Edited SELL rows exclude the existing transaction from availability calculation while preserving original created-at ordering.
- CSV import commits inherit the same guard through `createTransactionForEmail`.
- Added focused tests for backdated oversell availability and same-day created-at ordering.

Cycle 9 partial result:

- SELL create/edit validation now checks available quantity at the submitted sell date instead of current/final holdings.
- The availability check uses the same ordering as portfolio position math: occurred date, then created-at, then id.
- Backdated sells cannot borrow from later BUY rows; same-day sells can use only earlier same-day rows by created-at ordering.
- CSV import commits inherit the same guard because rows are saved through `createTransactionForEmail`.
- Added focused portfolio-calculation tests for backdated SELL availability and same-day created-at ordering.

Cycle 10 result:

- Added full sorted timeline validation after applying a create/edit SELL candidate so a backdated SELL cannot make later existing SELL rows historically impossible.
- The validation uses the same ordering as position math: occurred date, then created-at, then id.
- Edit validation preserves replacement semantics by excluding the existing transaction and reinserting the replacement with the original created-at.
- CSV import commits inherit the stricter guard through `createTransactionForEmail`; focused tests cover sequential CSV-style rows that oversell downstream.
- Added pure helper coverage for downstream oversell detection and fully covered timelines.

Cycle 11 result:

- Overview timeframe stats and the Portfolio change chart now use persisted portfolio snapshots only, not simulated analytics history.
- Simulated `analyticsSnapshots` remain available only in the Analysis tab, where the UI already labels demo overlay history and demo benchmark data.
- The TWR performance summary shows `Need data` instead of falling back to estimated all-time return when persisted snapshots are sparse.
- Added focused timeframe coverage that empty persisted history withholds all-time performance instead of producing a fake value.

Cycle 12 result:

- Portfolio distribution no longer shows generated/fake unrealized gains derived from allocation row index.
- Allocation rows now use actual transaction-backed open-position P&L from `Position.pnlEur` for asset rows and grouped asset-type/currency rows.
- Manual-only allocation rows show `N/A` for open-position P&L because manual valuation does not store cost basis.
- Added focused allocation-row tests for actual P&L, grouped P&L, and manual-only withholding.

Still open:

- Decide/document historical snapshot recomputation semantics for backdated transaction edits.
- Continue checking tooltips against implemented formulas.

### [ ] P1: Good-enough desktop/mobile UI QA pass

Fix catastrophic overflow, broken controls, confusing labels, and empty/coming-soon clutter in core flows.

## Blocked / Later

### [blocked] Neon migration execution path

Need Leo-approved migration credential/path before risky schema changes.

### [blocked] Production env / cron configuration

Scheduled refresh/email delivery needs production env decisions. Not part of current MVP pass unless price freshness depends on it.

### [blocked] Real broker CSV samples

Broker-specific import presets need sanitized real sample exports.

### [ ] Later: AI/news/taxes/fees/scheduled emails

Out of scope for the reliability MVP unless Leo reprioritizes.
