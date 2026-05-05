# Dobby QA

This is the coordination log between Codex implementation cycles and Dobby review.

## Current Handoff Signal

`DOBBY_HANDOFF_READY` — 2026-05-05T15:20:00Z — Cycle 9 historical SELL validation is not accepted yet. Codex should fix downstream historical oversell validation as the next narrow implementation cycle, then push back for Dobby QA.

## Codex Automation Mode

- Mode: Active Codex app heartbeat automation attached to this thread.
- Automation id: `dobby-feedback-polling`.
- Scope: only `codex/openclaw-playground` in `Leo-jou/Investment-Tracker-2`.
- Behavior: fetch/compare/pull/rebase, reread source-of-truth docs, inspect handoff signals, continue only on `DOBBY_HANDOFF_READY`, and stop on `DOBBY_REVIEW_IN_PROGRESS`, `DOBBY_READY_FOR_LEO_REVIEW`, ship-readiness pause, merge conflicts, unsafe data/migration risk, credential/deployment blockers, or gates it cannot safely fix. If Dobby identifies a Codex-actionable blocker, Dobby should keep the current handoff as `DOBBY_HANDOFF_READY` and describe the blocker as the next task instead of using `DOBBY_BLOCKED`.
- Anti-stall rule: if Codex cannot continue for any reason, it must raise its hand in the Discord thread instead of silently stopping. The message should explicitly say `Codex blocked`, name the blocker, state whether it needs Leo or Dobby, and include the exact next action needed. Do this for ambiguous handoff signals, missing credentials/preview URLs, unsafe migration/data-deletion risk, merge conflicts, failing gates it cannot fix safely, or any automation uncertainty. Do not leave the loop stalled overnight without a visible blocker note.
- Generated-file rebase recovery: `context.md` is generated project context, not hand-authored product code. If Codex is mid-rebase and the only conflict is `context.md`, do not remain paused. Resolve it by keeping the latest branch version or regenerating it with `npm run context:update`, then run `npm run context:check` and continue from `DOBBY_HANDOFF_READY`. If any non-generated source file conflicts too, raise `Codex blocked` in Discord with the exact conflicted paths.
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

- None. Dobby accepted Cycle 9 and handed the next reliability batch back to Codex.
- Next preferred task: simulated-history labeling outside Analysis. Anywhere Overview/timeframe cards/charts use generated/simulated analytics history instead of persisted snapshots must be clearly labeled or fall back to raw persisted data.
- After that, continue remaining tooltip/formula clarity for portfolio value, net contributions, realized/unrealized P&L, TWR, and chart ranges.

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


### 2026-05-05T10:32:00Z — Dobby review of Cycle 2 price-safety batch

Signal: `DOBBY_HANDOFF_READY`

Reviewed remote tip `643602f` (`Harden real-data price semantics`).

Gates run locally by Dobby:

- `npm test` passed: 56/56.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run context:check` initially reported stale `context.md`; Dobby ran `npm run context:update`, then `npm run context:check` passed.

Code review notes:

- Good direction: quick-add now defaults to the user's local today date instead of the old hardcoded date.
- BUY creation now fails closed for unknown typed symbols and existing `mock`/`manual` assets unless a provider-backed search result is selected. This is the right trust/safety tradeoff for Leo's real data.
- CSV import preview now marks unknown trade symbols invalid before commit, with test coverage.
- Fake/estimated 24h movers and holding 24h move/gain values are hidden behind `Not connected`, which is better than showing invented percentages.
- Existing saved-price holdings get visible badges, but broader provider freshness (`priceCapturedAt`, stale/unavailable refresh failures) is still incomplete and should remain in the queue.

Browser/UI QA note:

- Still blocked on this host: OpenClaw browser cannot start because no supported Chrome/Chromium is installed. Dobby could not click through quick-add/import flows visually.

Recommended next Codex batch:

1. Fix user/account asset scoping for `data.assets`, asset lists, CSV known-symbol checks, and backup/export payloads so Leo never sees unrelated global assets in his personal account data.
2. If that is too broad for one cycle, start with backup/export + `/assets`, then leave dashboard import known-symbol scoping explicit in the queue.
3. Keep migrations/data deletion out of scope unless Leo approves.

No blocker found in this batch; continue with a small P0 implementation cycle.


### 2026-05-05T11:05:00Z — Dobby review of Cycle 3 asset-scoping batch

Signal: `DOBBY_HANDOFF_READY`

Reviewed remote tip `461aa29` (`Scope visible assets to account data`).

Verdict: accept this slice. No blocker found.

Gates run locally by Dobby:

- `npm test` passed: 58/58.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run context:check` initially reported stale `context.md`; Dobby ran `npm run context:update`, then `npm run context:check` passed.

Code review notes:

- Good direction: dashboard `data.assets` is now scoped to assets referenced by the selected portfolio's transactions.
- `/assets` is now scoped to assets referenced by portfolios owned by the signed-in account instead of every active global asset row.
- CSV import known-symbol validation now uses account-scoped known assets, which is the right behavior for Leo's own multi-portfolio account without leaking unrelated global symbols.
- Backup/report export asset leakage appears fixed indirectly because exports consume scoped `DashboardData.assets`.
- New helper tests cover referenced-only and empty/cash-only portfolio behavior.

Remaining risks / follow-up:

- Add higher-confidence DB/API-level tests proving `/api/export`, `/assets`, and `/api/transactions/import` exclude another account's assets under database-shaped fixtures.
- `buildPortfolioBackupExport` still includes `portfolios: data.portfolios`, meaning all portfolio options for the signed-in user. That is not cross-account leakage, but Codex should clarify or trim it later if selected-portfolio backups are meant to contain only the selected portfolio.
- Browser/UI QA is still pending until Dobby gets Chrome/Chromium browser access on this host or an OpenClaw browser node.

Recommended next Codex batch:

1. Add mutation-capable DB/API smoke tests for real user flows and scoping: create portfolio, add/edit/delete BUY transaction, CSV import known/unknown symbols, `/assets`, and `/api/export` with another account's asset present.
2. In the same or next small cycle, make first-run Neon workspace bootstrap safe for real use: empty by default or very clearly flagged/resettable demo data. Avoid destructive migrations/data deletion without Leo approval.
3. Keep Codex automation active during the 24-hour MVP push. If `docs/SHIP_READINESS.md` later says `Status: Ready for Leo review — pause Codex automation.`, stop polling/implementation until Leo reviews.

Quality bar from Leo: be demanding. Reliability, real-data safety, user scoping, backup/export confidence, and math consistency beat UI polish and deferred AI/news/tax/fees work.


### 2026-05-05T11:20:00Z — Dobby review of Cycle 4 mutation-smoke batch

Signal: `DOBBY_HANDOFF_READY`

Reviewed remote tip `424c607` (`Add guarded mutation smoke coverage`).

Verdict: accept this slice. No blocker found in the implementation, but the real mutation smoke still needs a safe deployed/Neon target before it can be counted as executed coverage.

Gates run locally by Dobby:

- `npm test` passed: 58/58.
- `npm run lint` passed.
- `npm run smoke:mutations` passed in safe skip mode because `SMOKE_MUTATIONS=1` was not set in Dobby's local environment.
- `npm run build` passed.
- `npm run context:check` initially reported stale `context.md`; Dobby ran `npm run context:update`, then `npm run context:check` passed.

Browser/UI QA note:

- OpenClaw browser access is now available on this host after Chrome install and durable `browser.noSandbox` config.
- Browser navigation to local/private `localhost` app URLs is still blocked by OpenClaw browser policy, so Dobby could not click the local dev app with the browser tool.
- Dobby did an HTTP-render smoke instead: restarted the local Next dev server, logged in through `/api/auth/login`, and fetched authenticated `/assets`, `/dashboard`, and `/transactions` pages successfully. The transaction page rendered the quick-add form with today's date (`2026-05-05`) and the import/table UI without a server error.

Code review notes:

- Good direction: `npm run smoke:mutations` is guarded by `SMOKE_MUTATIONS=1` and fails closed without `DATABASE_URL` or an allowlisted smoke email.
- Good coverage shape: the script logs in, creates a temporary portfolio, creates/updates/deletes a provider-backed BUY, seeds another-account fixtures directly, checks `/assets`, backup export scoping, CSV known/unknown symbol behavior, and cleanup.
- Returning the created transaction id from `POST /api/transactions` is a practical API improvement for cleanup and UI callers.
- Cleanup appears reasonably targeted: transaction ids and temporary portfolio are deleted, the other-account user cascades its portfolio/transaction data, and unique smoke assets/price snapshots are removed through asset cascade.

Remaining risks / follow-up:

- The mutation smoke has not yet been executed against a real safe DB/API target; keep it as pending validation until Leo or deployment config provides a safe `SMOKE_MUTATIONS=1 DATABASE_URL SMOKE_MUTATION_EMAIL` target.
- Browser/local policy still prevents full click-through QA on localhost despite Chrome being operational. If full browser QA on local branches is required, enable an allowed local target/browser node path or test against a deployed preview URL.
- First-run Neon workspace bootstrap still inserts demo transactions/manual positions; this is now the highest P0 real-data safety issue before Leo enters personal data.

Recommended next Codex batch:

1. Make first-run real-user workspaces safe: empty by default, or explicitly demo-labeled with a clear reset/delete path. Do not run destructive migrations or delete existing data without Leo approval.
2. Add a visible persistence-mode warning/gating when `DATABASE_URL` is absent so local/demo mode cannot be mistaken for durable real data.
3. Leave all-portfolio aggregate UX and selected-portfolio backup metadata clarification in the queue unless they are quick, low-risk additions.
4. Also provide the Vercel preview/test URL for `codex/openclaw-playground` that Dobby should use for full Browser/UI QA. If no preview exists or it is protected, document the exact blocker and whether Codex can create/trigger one from Vercel access.


### 2026-05-05T11:46:00Z — Dobby review of Cycle 5 first-run demo-safety batch

Signal at review time: `DOBBY_BLOCKED` (corrected at 2026-05-05T12:07Z to `DOBBY_HANDOFF_READY` because the blocker is Codex-actionable)

Reviewed remote tip `9032523` (`Harden first-run demo safety`).

Verdict: good direction, but not accepted yet. Codex should continue with the narrow price-refresh guard fix. The UI and most mutation APIs now clearly treat missing `DATABASE_URL` as read-only demo mode, but `/api/prices/refresh` still returns a successful mock refresh response in no-DB mode. That contradicts the new read-only promise and could make a user think refresh/persistence happened.

Gates run locally by Dobby:

- `npm test` passed: 59/59.
- `npm run lint` passed.
- `npm run smoke:mutations` passed in safe skip mode because `SMOKE_MUTATIONS=1` was not set locally.
- `npm run build` passed.
- `npm run context:check` initially reported stale `context.md`; Dobby ran `npm run context:update`, then `npm run context:check` passed.

HTTP-render / demo-mode QA run by Dobby with `DATABASE_URL` unset:

- `/dashboard` returned 200 and included `Read-only demo mode` plus the missing-`DATABASE_URL` warning.
- `/transactions` returned 200 and included the read-only warning; quick-add/import controls rendered disabled.
- `/manual-positions` returned 200 and included the read-only warning; manual-position controls rendered disabled.
- `/assets` returned 200 and included the read-only warning.
- `POST /api/portfolios` returned 400 with the persistence warning.
- `POST /api/transactions/import` with `commit: true` returned 400 with the persistence warning.
- `POST /api/prices/refresh` returned 200 with `mode: "mock"` and `"Mock prices and snapshots remain active."` — blocker.

Blocker to fix next:

1. Make `POST /api/prices/refresh` fail closed in no-`DATABASE_URL` mode with the same persistence warning and a 400/409-style response. It should not report `pricesUpdated`, `portfolioSnapshotsUpdated`, or a successful mock refresh when the UI says the app is read-only demo mode.
2. Add a small test or smoke assertion for the no-DB refresh guard if practical.
3. Keep the no-DB UI banner/disabled-control work; that part looks good from HTTP-render QA.

Still needed after this blocker:

- Provide the Vercel preview/test URL for `codex/openclaw-playground`, or document the exact Vercel/protection blocker. Dobby still cannot do full browser click-through QA without an allowed deployed URL or local browser policy change.
- Verify first-run blank workspace and mutation smoke against a safe Neon/Vercel target when credentials/test account are available.


### 2026-05-05T13:38:00Z — Dobby review of Cycle 6 refresh-guard batch

Signal: `DOBBY_HANDOFF_READY`

Reviewed remote tip `2ca810f` (`Record refresh guard handoff`) including implementation commit `bd33a29` (`Fail closed demo price refresh`).

Verdict: accept this slice. The no-database price refresh false-success blocker is fixed.

Gates run locally by Dobby:

- `npm test` passed: 61/61.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` passed in safe skip mode because `SMOKE_MUTATIONS=1` was not set locally.
- `npm run context:check` initially reported stale `context.md`; Dobby ran `npm run context:update`, then `npm run context:check` passed.

HTTP-render / demo-mode QA run by Dobby with `DATABASE_URL` unset:

- `POST /api/prices/refresh` now returns HTTP 409 with the read-only demo-mode persistence warning.
- Refresh response has `{ ok: false }` and no mock refresh success counts.
- `/dashboard`, `/transactions`, `/manual-positions`, and `/assets` still include the `Read-only demo mode` banner.

Code review notes:

- Good direction: refresh now calls the shared mutation persistence guard before fetching assets or producing refresh counts.
- The API handler maps the shared demo-mode guard to a structured non-2xx response, which matches the UI promise that no-DB mode is read-only.
- Focused guard tests cover missing and configured `DATABASE_URL` behavior.

Remaining risks / follow-up:

- Real Neon/Vercel mutation smoke is still not executed; it needs a safe DB target and allowlisted smoke user.
- Full browser click-through QA still needs a usable deployed preview URL or allowed local browser target.
- All-portfolio aggregate clarity remains a P0 UX/reliability issue before Leo relies on the tracker for total net worth.
- Price freshness/stale/unavailable provider states still need a final visibility pass after aggregate clarity.

Recommended next Codex batch:

1. Implement or verify a simple account-level all-portfolio aggregate view/selector state for dashboard totals, allocations, charts, exports, and transaction/manual-position navigation clarity. Do not mix unrelated global assets or other users' data.
2. Keep the change narrow and run the standard gates.
3. If aggregate support is already intentionally deferred or too broad, document the exact product behavior and take the next small price freshness/staleness visibility slice instead.


### 2026-05-05T14:13:00Z — Dobby review of aggregate dashboard slice

Signal: `DOBBY_HANDOFF_READY`

Reviewed remote tip `24f06ce` (`Record aggregate dashboard handoff`), including implementation commit `86377c1` (`Add all-portfolio aggregate dashboard`).

Gates run locally by Dobby:

- `npm test` passed: 63/63.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` skipped safely because `SMOKE_MUTATIONS=1` was not set.
- `npm run context:check` initially reported stale `context.md`; Dobby ran `npm run context:update`, then `npm run context:check` passed.

Code review notes:

- Good direction: `/dashboard` now uses the virtual `portfolio_all` account view, and the switcher links `All portfolios` back to `/dashboard` while individual portfolios still route to `/portfolios/[id]`.
- Aggregate data is built from the signed-in user's portfolio IDs, then assets are scoped through referenced transactions before visible asset/position views are produced. This addresses the main total-net-worth clarity issue without broad migration risk.
- Aggregate transaction/import/manual-position controls are disabled by omitting a concrete portfolio id and showing a choose-specific-portfolio message, which is the right safety behavior for writes.
- New aggregate unit tests cover switcher option ordering and summed snapshot/TWR behavior.

QA limits:

- Full browser click-through remains incomplete. The host now has Chrome available, but OpenClaw browser navigation to `localhost` is blocked by policy. A direct `curl` check reached the app and showed the login page, so the dev server is responding, but Dobby could not visually verify authenticated dashboard flows.
- Real Neon/Vercel mutation smoke remains unexecuted without Leo-approved safe DB/preview credentials.

Recommended next Codex batch:

1. Finish price freshness/stale/unavailable visibility: surface `priceCapturedAt`, provider, stale/unavailable/manual/saved-price states, and refresh failures consistently across holdings/assets/quick-add.
2. Keep provider-backed 24h change re-enablement out of scope until real change data is stored.
3. If Codex has access to an authenticated preview, do a narrow UI click-through for aggregate switcher/export/write-disabled behavior and record any findings.

No blocker found in this batch; continue with a small P0 reliability cycle.


### 2026-05-05T14:50:00Z — Dobby review of Cycle 8 price freshness visibility batch

Signal: `DOBBY_HANDOFF_READY`

Reviewed remote tip `aed8a3e` (`Record price freshness handoff`) including implementation commit `d38ccf4` (`Surface price freshness states`).

Verdict: accept this slice. Price freshness/stale/saved/unavailable states are now substantially more visible in the core asset and holding surfaces, and quick-add fallback messaging is clearer.

Gates run locally by Dobby:

- `npm test` passed: 67/67.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` passed in safe skip mode because `SMOKE_MUTATIONS=1` was not set locally.
- `npm run context:check` initially reported stale `context.md`; Dobby ran `npm run context:update`, then `npm run context:check` passed.

HTTP-render / demo-mode QA run by Dobby with `DATABASE_URL` unset:

- `/assets` returned 200 with `Read-only demo mode`, provider column, `Price status`, and visible `Saved price` labeling.
- `/dashboard` and `/portfolios/portfolio_core` returned 200 with `Read-only demo mode`, `All portfolios` switcher option, and provider/details text present.
- `/api/assets/search?q=btc` still returned search results including saved local BTC data; UI search remains disabled in read-only demo mode.

Code review notes:

- Good direction: `getAssetPriceStatus` centralizes fresh/stale/saved/unavailable status semantics, with focused tests.
- `/assets` now shows provider, external id/exchange, last saved quote timestamp, and status label/detail instead of just a price.
- Holdings Details now shows last price, last quote, native currency, provider, exchange/provider id, and status.
- Quick-add quote messaging distinguishes live quotes, saved quotes, and unavailable quote fallbacks; local asset search now carries `priceCapturedAt` into quick-add.
- 24h movement remains hidden as `Not connected`, which is correct until real provider-backed change data exists.

Remaining risks / follow-up:

- Real Neon/Vercel mutation smoke is still not executed; it needs a safe DB target and allowlisted smoke user.
- Full browser click-through QA still needs a usable deployed preview URL or allowed local browser target.
- Manual refresh failure messaging still needs a real provider/API failure QA pass.
- Math/tooltip consistency remains P0, especially historical SELL validation and simulated-history labeling outside Analysis.

Recommended next Codex batch:

1. Tighten SELL validation so a backdated sell cannot pass merely because current total holdings are sufficient; validate quantity as of the sell date with same-day ordering.
2. Add focused tests for historical oversell cases.
3. If that slice is too risky, first label/avoid simulated analytics history wherever overview/timeframe UI could be mistaken for persisted history.


### 2026-05-05T14:52:00Z — Dobby review of price freshness visibility slice

Signal: `DOBBY_HANDOFF_READY`

Reviewed remote tip `aed8a3e` (`Record price freshness handoff`), including implementation commit `d38ccf4` (`Surface price freshness states`).

Gates run locally by Dobby:

- `npm test` passed: 67/67.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` skipped safely because `SMOKE_MUTATIONS=1` was not set.
- `npm run context:check` passed.

Code review notes:

- Good direction: the shared `price-status` helper gives explicit Fresh/Stale/Saved price/Unavailable/No timestamp states and has focused unit coverage.
- `/assets` now shows provider labels, exchange/external id, price timestamps, and status badges instead of fake 24h data.
- Holdings > Details now includes last quote and price status while keeping 24h movement disabled.
- Quick-add now distinguishes live quotes, saved quote fallback, and unavailable quotes using propagated `priceCapturedAt` from asset search.
- Remaining caveat: manual refresh failure messaging still needs real HTTP/browser QA in a provider/API failure state; this batch mostly improves persisted quote visibility and quick-add fallback wording.

QA limits:

- Full browser click-through remains blocked in Dobby's environment. Chrome exists, but OpenClaw browser navigation to localhost is policy-blocked; authenticated preview/real provider failure states are still unverified.
- Real Neon/Vercel mutation smoke remains unexecuted without Leo-approved safe DB/preview credentials.

Recommended next Codex batch:

1. Take the math/tooltip consistency slice: overview value/timeframe cards should either use raw persisted snapshots or clearly label simulated analytics history wherever it appears outside Analysis.
2. Tighten SELL validation to prevent historically impossible oversells by as-of date, not just current total holdings.
3. Keep the batch small; if both are too broad, start with the simulated-history labeling because it is visible trust risk.

No blocker found in this batch; continue with a small P0 reliability cycle.


### 2026-05-05T15:18:00Z — Dobby review of Cycle 9 historical SELL validation batch

Signal: `DOBBY_HANDOFF_READY`

Reviewed Codex tip `80a6656` (`Record sell validation handoff`) including implementation commit `0668237` (`Validate sells by transaction date`). Dobby's later Vercel-ignore commit `7434c96` is unrelated deployment-noise config.

Verdict: accept this slice. Backdated SELL validation now checks availability as of the sell's transaction date instead of current holdings only.

Gates run locally by Dobby:

- `npm test` passed: 69/69.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` passed in safe skip mode because `SMOKE_MUTATIONS=1` was not set locally.
- `npm run context:check` passed.

Code review notes:

- Good direction: portfolio math now has a shared `sortTransactionsForPositioning` helper using occurred date, created-at, then id ordering.
- `calculateAssetQuantityBeforeTransaction` computes availability before the candidate sell in that same order, which addresses the original backdated oversell risk.
- Create and edit SELL flows call `assertSellQuantityAvailable`; edit excludes the existing transaction and preserves its original `createdAt` ordering.
- CSV import commits inherit the same guard through `createTransactionForEmail`.
- Focused tests cover later-BUY backdated oversell prevention and same-day created-at ordering.

Remaining risks / follow-up:

- Real Neon/Vercel mutation smoke is still not executed; it needs a safe DB target and allowlisted smoke user.
- Full browser click-through QA still needs a usable deployed preview URL or allowed local browser target.
- Historical snapshot recomputation remains today's-snapshot-only; backdated entries still do not rebuild historical snapshots. Keep this visible/understood.
- Simulated-history labeling outside Analysis remains P0 before Leo trusts overview/timeframe chart values.

Recommended next Codex batch:

1. Label or avoid simulated analytics history anywhere outside Analysis where Overview/timeframe UI could be mistaken for persisted historical performance. Prefer raw persisted snapshots for overview cards/charts when possible; otherwise show an explicit simulated/generated-history notice.
2. Add/adjust tests for sparse/no persisted snapshot behavior and labels.
3. Then continue tooltip/formula clarity for portfolio value, net contributions, realized/unrealized P&L, TWR, and chart range semantics.


### 2026-05-05T15:20:00Z — Dobby review of Cycle 9 historical SELL validation

Signal: `DOBBY_HANDOFF_READY`

Reviewed remote tip `7434c96` (`Skip Vercel for Dobby feedback commits [skip ci]`) including implementation commit `0668237` (`Validate sells by transaction date`).

Verdict: not accepted yet. Good direction, but a historical correctness gap remains and must be fixed before Leo enters real transaction history.

Gates run locally by Dobby:

- `npm test` passed: 69/69.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:mutations` passed in safe skip mode because `SMOKE_MUTATIONS=1` was not set locally.
- `npm run context:check` initially reported stale `context.md`; Dobby ran `npm run context:update`, then `npm run context:check` passed before this feedback commit.

What looks good:

- Candidate backdated SELLs no longer borrow from later BUYs when validating that candidate row.
- Same-day ordering by `occurredOn`, then `createdAt`, then `id` is shared with position math.
- Edit validation excludes the existing transaction id while preserving replacement semantics.
- CSV import commit rows go through `createTransactionForEmail()`, so they inherit the same per-row validation.
- Vercel ignore config is conservative: Dobby docs/context-only feedback commits can skip deployments, while app/config path changes still deploy unless explicitly `[skip ci]`.

Blocking correctness gap:

- `assertSellQuantityAvailable()` checks only quantity available immediately before the candidate SELL.
- It does not verify that inserting or editing a backdated SELL does not make later existing SELLs impossible.
- Example: Jan 1 BUY 10, Mar 1 SELL 10 exists, then add Feb 1 SELL 10. Current validation allows the Feb SELL because 10 are available on Feb 1, but the later Mar SELL is now historically oversold.
- `buildPositionStates()` clamps oversells to zero, so final position state can hide the impossible timeline instead of surfacing it.

Required next Codex task:

1. Add a validation helper that simulates the full sorted transaction timeline after applying the create/edit candidate and rejects any SELL whose requested quantity exceeds running quantity at that point.
2. Use the same transaction ordering as position math.
3. Preserve edit exclusion/current-transaction replacement semantics.
4. Add focused tests for:
   - backdated SELL that passes candidate as-of availability but invalidates a later SELL;
   - editing an existing SELL earlier or larger so it invalidates later SELLs;
   - CSV import batch behavior where sequential rows would create a downstream historical oversell;
   - ideally a pure helper test proving no asset holding goes negative at any point in sorted history.
5. Refresh `context.md`, rerun gates, and push back for Dobby QA.

Do not treat this as a stop signal. This is Codex-actionable and should be the next narrow implementation cycle.

## Leo Review Notes

- Leo's immediate need is a reliable product he can use personally now.
- UI can be imperfect if the product is safe and the numbers are trustworthy.
- Do not prioritize AI, news polish, scheduled emails, taxes, or fees before reliability.

### 2026-05-05T15:32:00Z — Dobby review of corrected SELL validation handoff

Signal: `DOBBY_HANDOFF_READY`

Reviewed current tip `ef516c9` (`Correct sell validation handoff`) covering the Cycle 9 follow-up after Dobby's earlier rejection.

Verdict: still not accepted. The historical SELL validation remains incomplete and must be fixed before this slice can be considered safe for Leo's real transaction history.

Gates / checks:

- `npm test` passed: 69/69.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run context:check` failed because `context.md` is stale and missing the latest handoff state.

Blocking issue:

- `assertSellQuantityAvailable()` still checks only quantity available immediately before the candidate SELL.
- It does not validate the full sorted transaction timeline after applying the candidate create/edit.
- Still-bad scenario: Jan 1 BUY 10, Mar 1 SELL 10, then add Feb 1 SELL 10. The Feb SELL can pass because 10 are available at that point, but the later Mar SELL becomes impossible.
- Relevant code remains around `lib/db/portfolio-repository.ts` and `lib/portfolio/calculations.ts` timeline/position helpers.

Docs issue:

- `docs/DOBBY_QA.md` has contradictory status language: the top correctly says Cycle 9 is not accepted, while an earlier status block still says Cycle 9 was accepted and moves on to simulated-history labeling.
- Resolve the contradiction so Codex and Dobby do not drift.

Required next Codex task:

1. Implement full sorted-timeline validation after applying the candidate create/edit transaction.
2. Reject any SELL that would make running quantity negative at any later point, not only the candidate row.
3. Preserve edit replacement semantics.
4. Add tests for downstream oversell, edit-induced downstream oversell, CSV import/batch sequencing, and a pure helper negative-holding case.
5. Fix the Dobby QA contradiction, refresh `context.md`, and rerun all gates.

Keep this as the next narrow reliability task. Do not move to simulated-history labeling until historical SELL validation is actually safe.
