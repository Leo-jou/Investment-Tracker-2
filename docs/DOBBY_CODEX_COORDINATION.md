# Dobby ↔ Codex Coordination

This file defines the option-one coordination process: Codex works from GitHub/docs, pushes every cycle, and Dobby reviews the branch afterward.

## Branch Rules

- Work only on `codex/openclaw-playground`.
- Never commit to `main`.
- Treat `main` and `codex/safe-backup-2026-04-30` as recovery/reference branches.
- Pull/rebase before starting a cycle and push before ending a cycle.

## Source Of Truth Files

Codex must read these at the start of every automation cycle, in this order:

1. `AGENTS.md` — durable repo instructions.
2. `context.md` — current implementation state and known issues.
3. `BACKLOG.md` — product backlog and acceptance criteria.
4. `docs/MVP_RELIABILITY_SCOPE.md` — current MVP scope and non-goals.
5. `docs/WORK_QUEUE.md` — active tasks Codex should execute.
6. `docs/DOBBY_QA.md` — Dobby's latest QA findings and feedback.
7. `docs/SHIP_READINESS.md` — release confidence checklist.

If these files conflict with code, inspect the code and update the relevant doc in the same cycle.

## Autonomous Mode

Goal: Leo should not be the messenger between Codex and Dobby. Communication happens through GitHub and the docs in this repository.

Codex should run in one of these modes, depending on what the local Codex environment supports:

1. **Preferred: persistent Codex automation/session**
   - Keep the session alive.
   - After pushing a cycle, wait/check periodically for Dobby feedback committed to `docs/DOBBY_QA.md` or `docs/WORK_QUEUE.md`.
   - Suggested interval: every 10-20 minutes, with backoff if nothing changes.
   - When Dobby feedback appears, pull/rebase, read the source-of-truth files again, and start the next unblocked task.

2. **Fallback: local scheduled loop created by Codex on Leo's machine**
   - If Codex can create local automation, create a safe local script/job that periodically runs the sync/read/act/push cycle.
   - The job must only operate on `codex/openclaw-playground`.
   - It must stop on merge conflicts, failing gates, credential blockers, migration-risk blockers, or when ship readiness says to pause.
   - It must not commit secrets or local env files.

3. **Last resort: manual Codex resume**
   - If neither persistent session nor local automation is available, Codex should clearly say so in `docs/DOBBY_QA.md` and stop.

Codex-side polling condition:

- After pushing its own commit, Codex records the commit hash in `docs/DOBBY_QA.md`.
- Codex then waits until the remote branch advances with a commit that updates Dobby feedback/task docs, or until a configured time budget expires.
- When feedback arrives, Codex pulls/rebases and continues with the highest-priority unblocked task from `docs/WORK_QUEUE.md`.

Dobby-side polling condition:

- Dobby monitors the remote branch for Codex commits.
- When Codex pushes, Dobby pulls/reviews/tests, updates feedback/task docs, commits, and pushes.

Time budget:

- Initial autonomous reliability sprint target: 24 hours.
- At or before 24 hours, Dobby should update Leo with either: ready-for-review deployment, current blocker, or remaining time needed.

## Operating Loop

Each Codex cycle should be small and shippable.

1. Sync:
   - `git checkout codex/openclaw-playground`
   - `git pull --rebase origin codex/openclaw-playground`
2. Read the source-of-truth files listed above.
3. Pick the highest-priority unblocked task from `docs/WORK_QUEUE.md`.
4. Implement only that task or a tightly related batch.
5. Add/update tests for changed behavior, especially portfolio math and data persistence.
6. Run gates:
   - `npm test`
   - `npm run lint`
   - `npm run build`
   - `npm run context:check` or `npm run context:update` if context changed
7. Update docs:
   - Mark task status in `docs/WORK_QUEUE.md`.
   - Add a short cycle note to `docs/DOBBY_QA.md` under `Pending Dobby Review`.
   - Update `context.md` for durable product/architecture/status changes.
8. Commit with a clear message.
9. Push to GitHub.
10. Stop and wait for Dobby QA unless explicitly instructed to continue multiple cycles.

## Required End-Of-Cycle Format

Every Codex cycle must end with a pushed commit and a short summary in `docs/DOBBY_QA.md` containing:

- Commit hash.
- Task completed.
- Files changed.
- Tests/gates run and result.
- Known risks or follow-up questions.
- Anything Dobby should manually verify in the browser.

## Dobby Responsibilities

Dobby will:

- Pull `codex/openclaw-playground` after Codex pushes.
- Run tests/build/lint/context checks where useful.
- Run browser/UI QA for core flows.
- Update `docs/DOBBY_QA.md` with pass/fail findings.
- Update `docs/WORK_QUEUE.md` with the next focused Codex task.
- Tell Leo when the app is ready for final review.

## Stop Conditions

Codex should stop and ask for Dobby/Leo review when:

- A task requires credentials, production env access, or a migration decision.
- A database migration is needed and the safe path is unclear.
- Tests fail for reasons Codex cannot safely resolve.
- The requested change could risk user data.
- `docs/SHIP_READINESS.md` is marked `Ready for Leo review`.

## Non-Negotiables

- Do not introduce mock/fake production data without a clear label.
- Do not silently degrade live prices into fake prices.
- Do not make schema changes without migration notes and rollback/data-safety considerations.
- Do not remove backup/export functionality.
- Do not leave the repo unpushed at the end of a cycle.
- Do not broaden scope into AI/news/taxes/scheduled email unless the work queue explicitly says so.
