# MVP Reliability Scope

Leo's current priority is a reliable personal investment tracker he can safely use now. UI can be improved later; data safety and correct numbers come first.

## MVP Goal

A full product Leo can use with confidence to:

- Create an account.
- Store data in Neon safely.
- Create and manage multiple portfolios.
- Add, edit, delete, and review transactions.
- Track aggregate holdings and performance across all portfolios.
- See current investment prices when loading the app and when adding/searching tickers.
- Export data to CSV/backup so manual data entry is never trapped.
- Trust the math behind values, gains, returns, ratios, charts, filters, and tooltips.

## P0 Reliability Requirements

### 1. Data Safety

- User-entered data must persist in Neon, not only local/browser/mock state.
- Core create/edit/delete flows must be tested or smoke-tested.
- Backup/export must work before Leo enters large transaction history.
- Schema changes must include safe migrations and migration notes.
- Avoid destructive migrations unless explicitly approved.
- No code path should silently overwrite or drop transactions, portfolios, positions, snapshots, or manual positions.

### 2. Authentication And Account Confidence

- Account creation/login must work in the intended deployment.
- User data must be scoped to the authenticated user.
- Protected pages/API routes must not expose another user's data.

### 3. Core Portfolio Model

- Multiple portfolios must be supported.
- Aggregated all-portfolio view should be available or clearly planned if missing.
- Holdings must derive from transactions/manual positions consistently.
- Cash flows must be separated from investment performance.
- BUY/SELL/DEPOSIT/WITHDRAW/MANUAL behavior must be clear and tested.

### 4. Live Market Data

- Dashboard/load-time prices should be fresh or clearly marked stale/unavailable.
- Ticker/asset search should fetch provider-backed metadata and quote information where available.
- Saved/manual/mock prices must be visibly labeled and must not masquerade as live prices.
- Refresh failures should be visible and safe, not silent.

### 5. Math Correctness

- Portfolio value, cost basis, realized P&L, unrealized P&L, net contributions, TWR, allocation, and risk metrics must match documented formulas.
- Tooltips must describe the actual implementation.
- Charts and date filters must use the same timeframe semantics as summary cards.
- Sparse/insufficient data should show a data-quality state instead of fake precision.

### 6. Export And Recovery

- CSV export must remain available and authenticated.
- Backup JSON must remain full-fidelity/recovery-oriented.
- Export should include enough data for Leo to recover from product failure or future migration issues.

### 7. Browser/UI QA

- Core pages should render without console errors.
- Dashboard, transactions, portfolios, holdings, analysis, settings, and report/export flows should be usable on desktop.
- Mobile should not have catastrophic overflow for the main dashboard and transaction flows.

## Explicit Non-Goals For This MVP Pass

Do not prioritize these unless needed to unblock P0 reliability:

- Scheduled email exports.
- AI assistant or AI digest commentary.
- News correlation/AI materiality ranking.
- Taxes and standalone fee workflows.
- Broker/wallet API sync.
- Beautiful final UI polish.
- Public launch readiness.

## Dobby/Codex Bias

Prefer boring, reliable product work over impressive features. The test is whether Leo can safely spend two hours entering real transaction history without worrying that data will disappear or calculations are nonsense.
