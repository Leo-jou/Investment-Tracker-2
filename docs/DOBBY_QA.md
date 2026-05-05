# Dobby QA

This is the coordination log between Codex implementation cycles and Dobby review.

## Current Handoff Signal

`CODEX_PUSHED_FOR_REVIEW` — 2026-05-05T12:17:21Z — Codex fixed the no-database price refresh false-success blocker and is waiting for Dobby review.

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

- Commit: final pushed branch tip for this handoff.
- Task: P0 no-`DATABASE_URL` price refresh false-success blocker from Dobby's 2026-05-05T11:46/12:07 review.
- Summary: `refreshPortfolioData` now uses the shared read-only demo-mode persistence guard before any refresh counts can be produced. `POST /api/prices/refresh` catches that guard and returns a structured non-2xx response with the same persistence warning instead of reporting `mode: "mock"` or mock update counts. The guard message was moved into a small runtime module and covered by focused tests.
- Files changed:
  - `app/api/prices/refresh/route.ts`
  - `lib/db/client.ts`
  - `lib/pricing/refresh.ts`
  - `lib/runtime/persistence-mode.ts`
  - `tests/persistence-mode.test.ts`
  - `docs/WORK_QUEUE.md`
  - `docs/DOBBY_QA.md`
  - `context.md`
- Gates run:
  - `npm test` passed: 61/61.
  - `npm run lint` passed.
  - `npm run smoke:mutations` passed in safe skip mode because `SMOKE_MUTATIONS=1` was not set locally.
  - `npm run build` passed.
  - `npm run context:update` passed and refreshed `context.md`.
  - `npm run context:check` passed.
- Known risks:
  - No all-portfolio aggregate view exists yet; dashboard and standalone transaction/manual-position pages default to the first portfolio unless a specific portfolio route is used.
  - This local cycle did not connect to a real Neon target, so the blank first-run workspace behavior and mutation smoke still need safe DB verification with a new allowlisted test user.
  - The mutation smoke remains intentionally opt-in and requires `SMOKE_MUTATIONS=1`, `DATABASE_URL`, and an allowlisted `SMOKE_MUTATION_EMAIL` or `SMOKE_EMAIL`; it was not run against a real DB in this local cycle.
  - Non-empty sparse portfolios can still use simulated analytics history; Analysis labels it, but the remaining overview chart/timeframe labeling issue is still in the queue.
  - SELL validation checks current total holding quantity, not historical as-of-date availability.
  - Vercel preview URL remains unresolved: this local checkout has no `.vercel/project.json`, no `vercel` CLI binary on PATH, Vercel MCP project/deployment discovery failed or lacked access, and GitHub status exposed Vercel dashboard URLs but not a direct preview hostname.
- Browser QA requested:
  - With `DATABASE_URL` unset, verify `POST /api/prices/refresh` returns a non-2xx response with the read-only demo-mode persistence warning and no mock update counts.
  - Recheck that no-`DATABASE_URL` dashboard, transactions, manual positions, and assets pages still show the read-only banner and disabled controls.
  - Against a safe DB/API target, verify a brand-new allowlisted user gets an empty `Personal` portfolio with no seeded transactions/manual positions/assets/simulated snapshots.
  - Run `SMOKE_MUTATIONS=1 SMOKE_MUTATION_EMAIL=<allowlisted test email> DATABASE_URL=<same target DB> npm run smoke:mutations` against a safe target environment when credentials are available, and verify cleanup.

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

## Leo Review Notes

- Leo's immediate need is a reliable product he can use personally now.
- UI can be imperfect if the product is safe and the numbers are trustworthy.
- Do not prioritize AI, news polish, scheduled emails, taxes, or fees before reliability.
