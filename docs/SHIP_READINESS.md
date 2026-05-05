# Ship Readiness — Investment Tracker

Updated: 2026-05-05

## Status

Status: Blocked for Leo setup

Leo explicitly asked Codex to continue overnight toward a genuinely live usable MVP. Codex verified the current Vercel state and found setup/access blockers rather than a narrow app-code blocker.

## Dobby Verdict

Ready for Leo review as a personal-use MVP reliability slice.

This does **not** mean production/public launch ready. It means the core personal-use paths are now much safer for Leo to review with real-ish data, with known limitations clearly documented.

## Gates

Latest Dobby run:

- `npm test` — pass, 78/78.
- `npm run lint` — pass.
- `npm run build` — pass.
- `npm run context:check` — pass.
- `npm run smoke:mutations` — safe skip mode; real DB/API mutation smoke still requires `SMOKE_MUTATIONS=1`, a safe database target, and an allowlisted smoke user.

Latest Codex live-readiness check:

- `npm test` — pass, 78/78.
- `npm run lint` — pass.
- `npm run build` — pass.
- `npm run smoke:mutations` — safe skip mode; no safe `DATABASE_URL` + allowlisted smoke email was available locally.
- Vercel preview deployment `dpl_ArTeAo3ter5cc6zGf3KSVaydNBrb` is `READY` at `https://foliocore-8djhy7v8f-leopoldjourdain-6225s-projects.vercel.app`.
- Vercel Preview env currently has only `AUTH_SECRET`; it is missing `DATABASE_URL`, `APP_ALLOWED_EMAILS`, Google auth env, and provider API keys, so it is not a real persisted/authenticated test target.
- Production `https://foliocore.vercel.app` is `READY` but still points at `main` commit `f8040007381bbe35a2d7b4bcb7dfe66f485e546c`, not the latest reliability branch.
- Browser access to both preview and production is protected by Vercel authentication from Codex's browser. Preview redirects to Vercel login; production returns Vercel `403 Forbidden` without Vercel auth.
- Authenticated Vercel CLI curl can fetch `/login`: preview shows Google login not configured, production shows Google login configured.

## Accepted Reliability Slices

- SELL validation rejects historical oversells, including downstream oversells caused by backdated or edited SELLs.
- Overview/timeframe UI uses persisted portfolio snapshots only; simulated analytics history stays isolated to Analysis/demo-labeled surfaces.
- Allocation table P&L uses transaction-backed open-position P&L and withholds manual-only/mixed incomplete values.
- Formula/terminology pass clarifies portfolio value, net contributions, open-position P&L, realized P&L, TWR, chart range semantics, digest/report terminology, and export field names.
- Digest/report/export no longer fall back to estimated portfolio return when persisted snapshots are missing; they show `Need snapshots` / `needs_snapshots`.

## Known Limitations

- Real Neon/Vercel mutation smoke has not been run from this environment.
- Full browser click-through still needs an allowed deployed/authenticated preview target.
- Backdated entries validate historical holdings but do not rebuild historical snapshots automatically; current behavior upserts today/current-day snapshot.
- UI can still be polished, but Leo explicitly prioritized trustworthy numbers and safe data handling over visual perfection.

## Exact Setup Blockers

1. Usable preview blocker: copy/configure the production-like safe env set into Preview, at minimum `DATABASE_URL`, `APP_ALLOWED_EMAILS`, `AUTH_SECRET`, and auth/provider vars needed for Leo's chosen login/quote path; or explicitly choose production as the live test target.
2. Access blocker: Codex cannot open the protected Vercel URLs in browser QA without Leo signing into Vercel in the browser, disabling/changing Deployment Protection, or explicitly approving a temporary Vercel auth-bypass share URL.
3. Mutation smoke blocker: Codex needs a safe allowlisted smoke email and safe database target before running `SMOKE_MUTATIONS=1`; it should not guess Leo's real account or mutate production without explicit approval.
4. Deployment decision blocker: production has the real env but is still on `main`; deploying `codex/openclaw-playground` to production would make the latest reliability slice live, but it is an intentional production promotion and should be explicitly approved or done by Leo.

## Recommended Leo Review

1. Review with a safe account/database first.
2. Add a small set of BUY/SELL/CASH transactions, including a backdated SELL case.
3. Confirm sparse snapshot states say `Need data` / `Need snapshots` instead of fake performance.
4. Export report/CSV and confirm terminology feels understandable.
5. Only after that, decide whether to run guarded mutation smoke against a safe DB target.
