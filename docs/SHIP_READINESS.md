# Ship Readiness — Investment Tracker

Updated: 2026-05-05

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

## Recommended Leo Review

1. Review with a safe account/database first.
2. Add a small set of BUY/SELL/CASH transactions, including a backdated SELL case.
3. Confirm sparse snapshot states say `Need data` / `Need snapshots` instead of fake performance.
4. Export report/CSV and confirm terminology feels understandable.
5. Only after that, decide whether to run guarded mutation smoke against a safe DB target.
