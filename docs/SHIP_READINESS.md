# Ship Readiness

Verdict: **Not ready for Leo real-data use until P0 reliability checks pass.**

This checklist is for deciding when Leo can safely start entering real transaction history.

## P0 Data Safety

- [ ] Authenticated user data is scoped correctly.
- [ ] Core data persists in Neon, not only local/browser/mock state.
- [ ] Portfolio create/edit/delete behavior is safe or deliberately limited.
- [ ] Transaction create/edit/delete behavior is safe and tested/smoke-tested.
- [ ] Backup JSON export works and contains full recovery data.
- [ ] CSV export works for human-readable review.
- [ ] No known destructive migration risk remains unresolved.

## P0 Core Product

- [ ] Account/login flow works in target environment.
- [ ] Multiple portfolios can be created and reviewed.
- [ ] Aggregate all-portfolio view exists or the current portfolio selector behavior is clear and acceptable.
- [ ] BUY/SELL/DEPOSIT/WITHDRAW/manual flows are understandable.
- [ ] Holdings derive correctly from transactions/manual positions.

## P0 Live Prices

- [ ] Dashboard prices refresh or clearly show stale/unavailable state.
- [ ] Asset/ticker search provides provider-backed metadata/quotes where available.
- [ ] Mock/manual/saved prices are clearly labeled.
- [ ] Refresh failure states are visible and safe.

## P0 Math Confidence

- [ ] Portfolio value formula is tested/documented.
- [ ] Cost basis and realized/unrealized P&L are tested/documented.
- [ ] Net contributions/cash flows are separated from gains.
- [ ] TWR behavior is tested/documented.
- [ ] Risk metrics show only when statistically meaningful or are clearly labeled demo/insufficient-data.
- [ ] Tooltips match implemented formulas.
- [ ] Charts and cards share timeframe semantics.

## P1 Usability

- [ ] Dashboard usable on desktop.
- [ ] Transactions flow usable on desktop.
- [ ] Portfolio/holdings views usable on desktop.
- [ ] Analysis view does not imply fake precision.
- [ ] Settings do not imply inactive features are active.
- [ ] Main flows avoid catastrophic mobile overflow.

## Ready For Leo Review Criteria

Mark ready only when:

- all P0 boxes are checked or explicitly accepted by Leo;
- tests/build/lint pass;
- Dobby has completed browser QA on core flows;
- backup/export recovery path is confirmed;
- remaining limitations are listed plainly.

## Final Automation Stop Signal

When ready, Dobby should update this file with:

`Status: Ready for Leo review — pause Codex automation.`
