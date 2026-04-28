# FolioCore Readiness Assessment

Last reviewed: 2026-04-28

## Current Verdict

FolioCore is ready for a guarded beta with 1-3 trusted friends who understand that the app is still under active development. It is not ready for a broad public launch.

Use it with test or low-stakes portfolio data first. The core manual-entry, live quote, dashboard, export, and backup flows are now strong enough for real feedback, but several automation and import features are still incomplete.

## Ready Enough For Trusted Beta

- Google/email login with allowlisted users.
- Multiple portfolio creation and basic portfolio switching.
- Manual transaction entry for buys, sells, deposits, withdrawals, and manual values.
- Live quote lookup when a user explicitly selects an asset during transaction entry.
- Portfolio value, TWR-oriented performance display, holdings, allocation, transactions, and analysis screens.
- Authenticated CSV, report JSON, and backup JSON exports.
- Portfolio-aware matched headlines from trusted RSS, Yahoo/Nasdaq symbol feeds, crypto feeds, optional SEC filings, and optional GDELT broad-news search.
- Branded digest/report preview in HTML, printable to PDF from the browser.
- Guarded Vercel cron endpoints for daily price/snapshot refresh and weekly digest delivery.
- Focused tests for portfolio math, live provider normalization, export generation, news matching, digest generation, and risk analytics.

## Not Ready For Public Launch

- Settings are still browser-local; default currency, backup email, and export preferences are not DB-backed yet.
- Scheduled digest/export email requires production email variables and recipient configuration before it actually sends.
- Upload/import transactions is not implemented.
- Paired transfers across portfolios are still disabled.
- Dividend support is not implemented.
- Benchmark snapshot storage is not implemented, so beta remains intentionally unavailable.
- Risk metrics require regular historical snapshots; seeded demo snapshots are irregular and will correctly hide Sharpe/Sortino until enough regular periods exist.
- News matching is source-backed, not AI-analyzed. It can surface relevant headlines but does not yet explain likely portfolio impact.
- SEC filing coverage is limited to configured US-listed CIK mappings.
- Provider quote coverage is best-effort and limited by CoinGecko/Twelve Data availability and rate limits.
- Mutation-capable production smoke tests should be added before inviting more than a few users.

## Operational Requirements Before Inviting Friends

1. Configure `CRON_SECRET` in Vercel Production.
2. Configure `CRON_REFRESH_EMAILS` with the allowlisted user emails that should receive daily price/snapshot refreshes.
3. Optionally configure `RESEND_API_KEY`, `EMAIL_FROM`, and `DIGEST_EMAIL_RECIPIENTS` for digest emails.
4. Keep `APP_ALLOWED_EMAILS` strict while the app is in beta.
5. Run production smoke tests after each deployment:

```bash
SMOKE_EMAIL=leopoldjourdain@gmail.com SMOKE_EXPORT=1 SMOKE_NEWS=1 SMOKE_DIGEST=1 npm run smoke:prod
SMOKE_EMAIL=leopoldjourdain@gmail.com SMOKE_QUOTE_MATRIX=1 npm run smoke:prod
```

## Plain-English Feature Notes

- SEC EDGAR is the official US company filing system. It is useful for public-company filings such as 10-K, 10-Q, and 8-K. It is not a tax feature.
- GDELT is an optional broad-news search index. It is off by default because enabling it sends public holding terms to an external news-search service.
- AI is not required for RSS headline matching or exports. AI becomes useful for summarizing why news may matter, ranking materiality, and drafting portfolio-impact commentary.
- Beta will not become available automatically just by waiting a few days. Daily snapshots help Sharpe/Sortino over time, but beta needs a separate benchmark snapshot pipeline.
