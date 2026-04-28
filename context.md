# Project Context

## Current Goal

Build a self-hostable personal investment tracker MVP focused on fast manual input, correct performance metrics, modular UI, and low-cost deployment on Vercel + Neon.

## Product Decisions

- Manual transaction entry is the primary workflow for the MVP.
- Broker and wallet sync are out of scope for the initial version.
- USD is the default display currency, with an EUR toggle backed by FX snapshots.
- Time-weighted return is the primary performance metric; deposits and withdrawals are capital flows, not gains or losses.
- External asset search should be dynamic and provider-backed when API keys exist, with mock-backed fallback behavior.
- Transfers should stay disabled in quick-add until paired multi-portfolio transfer support exists.
- Quick-add should fetch a single live quote only after explicit asset selection, not while the user is typing search queries.
- Every selectable provider-backed quick-add result should attempt a fresh quote, but coverage is limited to CoinGecko and Twelve Data. FMP/manual/mock/unsupported or plan-gated instruments must show an unavailable/saved-price fallback instead of silently pretending to be live.
- Exports and digest emails should be authenticated. On-demand digest is live; weekly cron digest is wired behind fail-closed env vars and allowlisted recipients.
- Portfolio news must use trusted source feeds first. Google/search fallbacks are removed. Broad GDELT search is opt-in only because it sends holding terms to a third party.
- News matching is source-backed, not AI-analyzed. AI is useful later for materiality ranking and portfolio-impact commentary, but not required for headline matching or exports.
- Risk analytics should prefer withholding a metric over showing a mathematically weak number. Sharpe/Sortino require regular snapshot cadence; beta requires aligned benchmark history.
- Dashboard summaries and charts should use a shared timeframe model. Sparse ranges must show a data-quality state such as "Need data" instead of fabricated zeros or hardcoded period returns.
- `BACKLOG.md` is the product backlog source of truth for roadmap planning, priorities, acceptance criteria, dependencies, and where user input is required. Backlog progress should be visible in-place with `[ ]`, `[~]`, `[x]`, and `[blocked]` labels, not only summarized at the bottom.

## Technical Decisions

- Next.js App Router with TypeScript for the app and API routes.
- Tailwind CSS with compact shadcn-style components for the UI.
- Recharts for portfolio value, TWR, allocation, and performance charts.
- Drizzle ORM with Neon Postgres for the database layer.
- Mock-first services for asset search, prices, FX, snapshots, and portfolio metrics until DB-backed CRUD and providers are stable.
- Google OAuth uses Auth.js/NextAuth when `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are configured; email allowlist login remains the fallback path.
- `AGENTS.md` is the durable instruction file; this file is the concise project state summary.

## Current Implementation Status

The app includes a Next.js shell, portfolio dashboard pages, reusable portfolio components, API routes for assets, transactions, manual positions, item editing/deletion, price refresh, auth login, Drizzle schema/migration files, mock/demo data, metrics utilities, and provider-ready pricing seams.

Production is deployed on Vercel at `https://foliocore.vercel.app`. Current production deployment `dpl_HDmhELnmJMopycFfefJbGDZtn4qx` includes the first trust/polish implementation batch.

CoinGecko, Twelve Data, and Google OAuth credentials are configured as sensitive Vercel Production environment variables. `AUTH_URL` is configured for production Google OAuth. Do not record or commit secret values.

The local Vercel CLI is authenticated as `leopoldjourdain-6225`, so future production deploys can use `npx vercel build --prod` followed by `npx vercel deploy --prebuilt --prod --yes`. The Vercel MCP connector still did not list teams during the 2026-04-28 session, so CLI deploy is the reliable path for now.

Quick-add transaction UX now uses type-specific fields for BUY, SELL, DEPOSIT, WITHDRAW, and MANUAL entries. Manual entries create manual positions instead of dead transactions. BUY/SELL can derive total or quantity from a live quote fetched on explicit asset selection. Quote lookup is transient and does not create assets until the transaction is saved; selected provider metadata and the submitted quote are then persisted with the transaction.

The first trust/polish implementation batch added the FolioCore app icon, replaced placeholder portfolio tips with actionable portfolio checks, clarified overview metrics, added a shared timeframe selector for dashboard summaries/charts, and simplified holdings to Position, Performance, Risk, and Details views with stable column widths and real platform display. Portfolio distribution supports assets, asset types, and currency modes without donut labels, avoiding the previous 100x percentage display issue.

The dashboard now exposes authenticated CSV/JSON portfolio exports plus a restore-oriented backup JSON export through `/api/export`. `/api/news` builds portfolio-aware headlines from trusted RSS sources, Yahoo/Nasdaq symbol feeds, limited crypto tag feeds, and optional SEC EDGAR filing enrichment. GDELT broad-news search is disabled unless `NEWS_GDELT_ENABLED=true`, HTTPS-only, and restricted to trusted domains. Local Google/search fallback rows have been removed. The News UI is labeled as matched headlines and shows coverage chips per holding so missing source coverage is visible.

`/api/digest` returns a branded portfolio report preview in JSON/text/html with metrics, allocation bars, top positions, recent transactions, and matched headlines. It can send to the signed-in email when `RESEND_API_KEY` and `EMAIL_FROM` are configured. Report links use an absolute base URL when available so emailed reports can link back to authenticated CSV/backup downloads. `/api/cron/digest` is configured through Vercel Cron for weekly delivery on Monday at 08:00 UTC, but fails closed unless `CRON_SECRET`, `DIGEST_EMAIL_RECIPIENTS`, and email delivery variables are configured. Cron recipients are masked in responses and must also be in `APP_ALLOWED_EMAILS`.

`/api/cron/refresh` is configured through Vercel Cron for daily price/FX refresh and portfolio snapshot writes at 07:00 UTC. It fails closed unless `CRON_SECRET` and `CRON_REFRESH_EMAILS` or `DIGEST_EMAIL_RECIPIENTS` are configured, and recipients must be allowlisted.

The Analysis tab now calculates risk diagnostics from selected-currency TWR returns. Sharpe and Sortino are hidden in the UI until ready, not shown as low-confidence numbers. Beta is withheld until aligned benchmark history exists. Methodology now shows snapshot gap range, selected currency, risk-free rate, and benchmark connection status. Holdings Risk no longer shows fake beta or volatility estimates, and the performance chart no longer draws a synthetic SPX benchmark line.

Settings preferences are browser-persisted for now: default currency, manual-refresh snapshot toggle, backup email, and daily export toggle. The snapshot toggle is sent to `/api/prices/refresh` so manual refresh can skip portfolio snapshot writes. DB-backed user settings are deferred until a safe migration path or valid local Neon migration credentials are available.

Portfolio math has focused tests for TWR cash-flow neutrality, cash/contribution separation, same-day trade ordering, edit-time sell quantity recalculation, provider price normalization, oversell-safe position state, external cash-flow scoping, realized P&L average-cost handling, unique platform tracking, timeframe stats, portfolio checks, portfolio export generation, and digest generation. `npm run smoke:prod` runs a read-only production smoke test for login, protected-route redirects, API login, authenticated transactions JSON, and dashboard rendering. `SMOKE_REFRESH=1 npm run smoke:prod` also verifies the snapshot-writing price refresh endpoint. `SMOKE_QUOTE=1 npm run smoke:prod` verifies live quote lookup. `SMOKE_EXPORT=1 SMOKE_NEWS=1 SMOKE_DIGEST=1 npm run smoke:prod` verifies the new read-only export/news/digest endpoints. On 2026-04-28, production smoke passed for deployment `dpl_HDmhELnmJMopycFfefJbGDZtn4qx`: export/news/digest worked, quote matrix returned BTC, ETH, NVDA, SPY, and XAU/USD live quotes, `/icon.svg` returned 200, `/login` included the FolioCore title/icon metadata, and `/api/news` returned 9 matched headlines across BTC, ETH, SPY, NVDA, and the manual SpaceX holding.

Readiness is documented in `docs/READINESS.md`. Current verdict: ready for a guarded beta with 1-3 trusted friends, not for broad public launch.

`BACKLOG.md` now captures the next roadmap after the first trust/polish batch with inline status labels: export modal, branded report improvements, imports, dividends, fees/taxes, DB-backed preferences, scheduled email exports, news source registry, digest improvements, risk readiness explanations, benchmark history, holdings/distribution cleanup, and future AI assistant work. The branded HTML report exists, but the preview and Highlights section still need a stronger design/content pass.

Still missing or likely incomplete: DB-backed settings persistence, production cron/email variables for scheduled refresh/digest delivery, broader SEC CIK coverage, official company IR feed registry, AI-backed news materiality summaries, benchmark snapshot storage for mixed-asset beta, provider coverage beyond CoinGecko/Twelve Data/RSS/optional GDELT, paired transfer support, dividend support, import flows, complete DB-backed CRUD coverage, and mutation-capable end-to-end test coverage.

<!-- context:auto:start:implementation-status -->
Generated refresh summary:
- UI components: 22 files
- Other: 20 files
- API routes: 9 files
- App pages: 7 files
- Documentation: 4 files
- Pricing providers: 4 files
- Database: 1 file
- Metrics: 1 file
- Tooling: 1 file

Recent commits:
- fea08d6 2026-04-28 Ship first portfolio trust polish batch
- 1545f6f 2026-04-28 Add product backlog
- 6092036 2026-04-28 Improve portfolio news reports and readiness
- 142b1dc 2026-04-27 Add trusted news and risk analytics
- c23ce80 2026-04-27 Add portfolio exports and digest news
- 7592e04 2026-04-27 Refine portfolio UI controls and settings
- 0262bd2 2026-04-27 Make quote matrix smoke provider-aware
- 7d1785d 2026-04-27 Wire portfolio controls and improve live quote search
<!-- context:auto:end:implementation-status -->

## Known Bugs / Issues

- Transfers are intentionally disabled in quick-add until paired portfolio semantics exist.
- Existing chart warning about Recharts initial `-1` dimensions was addressed by giving `ResponsiveContainer` numeric heights.
- ESLint must ignore generated build/deployment folders such as `.next` and `.vercel`; this is configured in `eslint.config.mjs`.
- Production provider probe on 2026-04-27 returned live Twelve Data quotes for SPY, VOO, XAU/USD, EUR/USD, NVDA, and MSFT, but AAPL returned unavailable. Treat provider quote coverage as best-effort and surface unavailable states clearly.
- The local `.env.local` Neon URL currently fails authentication; production env values are sensitive in Vercel and cannot be pulled back locally. Avoid schema migrations until migration credentials or an approved migration path are available.
- GDELT is disabled by default for privacy and source-quality reasons. If enabled, it is still best-effort and restricted to trusted HTTPS domains.
- Current risk diagnostics depend on snapshot cadence. Irregular historical snapshots will intentionally show unavailable metrics until enough regular daily/weekly/monthly history exists.
- Seeded/demo snapshots can legitimately show 28-57 day gaps because they were created as monthly-ish historical anchors. Future daily refreshes will only become regular after the daily refresh cron is configured and runs over time.
- Beta will not become available merely by waiting for more portfolio snapshots. It requires a benchmark snapshot pipeline that aligns portfolio returns to a weighted benchmark series.

<!-- context:auto:start:known-issues -->
Generated TODO/FIXME scan:
- No TODO/FIXME comments found in scanned source files.
<!-- context:auto:end:known-issues -->

## User Feedback / UX Notes

- Keep the interface compact, information-dense, and investment-dashboard oriented rather than marketing-style.
- Context memory should stay low-noise and action-oriented.
- Avoid noisy automated updates that make project memory less useful.
- Preferred project-memory workflow: update before ending each meaningful work session and after major code exchanges; avoid hourly automation.
- When the user asks methodology questions, answer the methodology directly in addition to making product/UI changes.

## Open Questions

- Whether to add an AI layer for portfolio-impact news summaries and weekly digest commentary.
- Whether to prioritize DB-backed user preferences or transaction import next.
- Whether the next implementation batch should start with export modal/reporting, import/dividends/fees, or settings automation.

## Next Recommended Steps

1. Run `npm run context:update` after meaningful Codex work sessions.
2. Add mutation-capable end-to-end smoke tests for create/edit/delete transaction and create/edit/delete manual position, preferably against a dedicated smoke-test account.
3. Run a manual browser Google login smoke test with an allowlisted Google account.
4. Move settings preferences from browser storage into Neon once migration access is resolved.
5. Configure `CRON_SECRET`, `CRON_REFRESH_EMAILS`, `DIGEST_EMAIL_RECIPIENTS`, `RESEND_API_KEY`, and `EMAIL_FROM` in Vercel when scheduled refresh and digest email should actually run.
6. Add paired transfer support once multiple portfolios are available.
7. Add benchmark snapshot storage and a composite benchmark provider so beta can move from documented methodology to real calculated output.
8. Implement the next `BACKLOG.md` batch, likely export modal/reporting or import/dividend/fee workflows.

<!-- context:auto:start:next-steps -->
Generated suggestions:
- Review recent changed areas above and manually fold durable decisions into the appropriate sections.
- Keep updating context after meaningful implementation work; no TODO/FIXME-driven action is currently visible.
- Keep product and technical decisions manually curated; this script only updates bounded generated blocks.
<!-- context:auto:end:next-steps -->

## Last Updated

2026-04-28T14:04:39.347Z - Refreshed generated context from 8 recent commits, 69 changed files, and 0 TODO/FIXME items.
