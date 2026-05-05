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

### [ ] P0: Establish Codex autonomous polling loop

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

## Cycle 1 — Reliability Audit And Plan

### [ ] P0: Audit persistence, auth scoping, live-price flow, and core data model

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

### [ ] P0: Confirm all core data is Neon-backed and user-scoped

Fix any remaining local/mock-only persistence for MVP-critical data.

### [ ] P0: Harden live quote and price refresh semantics

Make stale/unavailable/manual/mock price states explicit and safe.

### [ ] P0: Verify all-portfolio aggregate view

If missing, implement a simple aggregate view or clear selector state that lets Leo understand total net worth across portfolios.

### [ ] P0: Math and tooltip consistency pass

Verify formulas and UI labels for portfolio value, net contributions, realized/unrealized P&L, TWR, risk metrics, and chart filters.

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
