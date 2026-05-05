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

## Next Likely Tasks After Audit

These are placeholders until Cycle 1 confirms the real state.

### [ ] P0: Add mutation-capable smoke tests for real user data flows

Target flows:

- create portfolio;
- add BUY transaction;
- edit transaction;
- delete transaction;
- add manual position if still part of MVP;
- export CSV/backup after mutation.

Audit notes:
- Current `scripts/smoke-production.ts` is mostly read-only, except optional price refresh.
- Unit tests cover portfolio math, export generation, provider normalization, and CSV import parsing, but not the API create/edit/delete scoping paths against a real DB.

### [ ] P0: Confirm all core data is Neon-backed and user-scoped

Fix any remaining local/mock-only persistence for MVP-critical data.

Concrete next work:
- Scope `data.assets` and backup exports to assets referenced by the authenticated user's selected portfolio or account; do not include unrelated global assets in user-visible lists/backups.
- Decide whether first-run Neon workspaces should be empty for real users or explicitly flagged/resettable demo workspaces; current bootstrap inserts demo transactions and a manual position.
- Make no-`DATABASE_URL` preview/demo mode impossible to confuse with persistent real-data mode before allowing edits.
- Consider fail-closed email allowlist behavior in production for the private email fallback.

### [ ] P0: Harden live quote and price refresh semantics

Make stale/unavailable/manual/mock price states explicit and safe.

Concrete next work:
- Stop silently creating mock-priced assets for typed/imported BUY rows, or make the unpriced/manual state impossible to mistake for live pricing.
- Surface `priceCapturedAt`, provider, and stale/unavailable/manual/mock states in holdings/assets/quick-add.
- Replace or hide mock/estimated 24h movers and 24h holding moves until real provider change data exists.
- Keep refresh failures visible and ensure skipped assets are clear to the user.

### [ ] P0: Verify all-portfolio aggregate view

If missing, implement a simple aggregate view or clear selector state that lets Leo understand total net worth across portfolios.

Audit notes:
- `/dashboard` and standalone transactions/manual-position pages default to the first portfolio.
- `/portfolios/[id]` supports individual portfolio views.
- No account-level aggregate portfolio option is present in the switcher, exports, charts, or backup.

### [ ] P0: Math and tooltip consistency pass

Verify formulas and UI labels for portfolio value, net contributions, realized/unrealized P&L, TWR, risk metrics, and chart filters.

Concrete next work:
- Use raw persisted snapshots for overview value/timeframe cards, or label simulated analytics history wherever it is used outside the Analysis tab.
- Revisit historical data entry behavior: mutations upsert today's snapshot only, so backdated transaction entry does not recompute historical snapshots.
- Tighten SELL validation so it cannot pass based only on current total holdings when the sell date would oversell historically.
- Fix quick-add's hardcoded default date before real data entry.
- Remove fake allocation-table unrealized gains that are derived from row index rather than portfolio math.

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
