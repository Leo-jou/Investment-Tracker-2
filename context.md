# Project Context

## Current Goal

Build a self-hostable personal investment tracker MVP focused on fast manual input, correct performance metrics, modular UI, and low-cost deployment on Vercel + Neon.

## Product Decisions

- Current MVP priority from Leo: reliability before polish/features. The app should be safe for real personal use: Neon-backed persistence, account/user scoping, multiple portfolios plus aggregate view, live/stale price clarity, correct portfolio math/tooltips/charts, CSV/backup export, and no data-loss risk. Scheduled emails, AI/news commentary, taxes/fees, and final UI beauty are explicitly later.
- Dobby/Codex option-one coordination is documented in `docs/DOBBY_CODEX_COORDINATION.md`, with current scope in `docs/MVP_RELIABILITY_SCOPE.md`, task handoff in `docs/WORK_QUEUE.md`, QA feedback in `docs/DOBBY_QA.md`, and release checklist in `docs/SHIP_READINESS.md`. Codex should push every cycle so Dobby can review through GitHub.

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
- For product review, analytics may use a clearly labeled demo overlay with simulated daily snapshots and benchmark returns when real history is too sparse. This overlay is display-only; backup/export data must continue to use real persisted snapshots.
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

Production is deployed on Vercel at `https://foliocore.vercel.app`. Current production deployment `dpl_B1xagnJws6Tgh5myheKjjjCqKeVw` includes the export/reporting and demo analytics backfill batch.

Source is backed up in the private GitHub repository `Leo-jou/Investment-Tracker-2`. `main` is the stable source-of-truth branch, `codex/safe-backup-2026-04-30` is a frozen recovery branch for the current beta-ready state, and `codex/openclaw-playground` is the branch reserved for OpenClaw/OpenCL agent experiments.

The OpenClaw playground has a separate Vercel preview deployment at `https://foliocore-6hqbdnwbq-leopoldjourdain-6225s-projects.vercel.app` (`dpl_EtdQTRPamoWTYiQzqPovnyYmBqfG`). Production remains `https://foliocore.vercel.app`; use preview deployments for agent testing instead of promoting experimental work. The preview deployment is currently behind Vercel Authentication, so external agent/browser testing needs an authenticated Vercel session, an approved share link, or a deliberate preview-protection change. Vercel rejected direct deployments from OpenClaw-authored commits because no Vercel/Git user was associated with the commit author; a no-code local commit by the Vercel-associated user fixed preview deployment without changing app code. Preview has a sensitive `AUTH_SECRET`, but no `DATABASE_URL`; the app now falls back to demo data when the database is absent so playground testing cannot mutate production data.

CoinGecko, Twelve Data, and Google OAuth credentials are configured as sensitive Vercel Production environment variables. `AUTH_URL` is configured for production Google OAuth. Do not record or commit secret values.

The local Vercel CLI is authenticated as `leopoldjourdain-6225`, so future production deploys can use `npx vercel build --prod` followed by `npx vercel deploy --prebuilt --prod --yes`. The Vercel MCP connector still did not list teams during the 2026-04-28 session, so CLI deploy is the reliable path for now.

Quick-add transaction UX now uses type-specific fields for BUY, SELL, DEPOSIT, WITHDRAW, and MANUAL entries. Manual entries create manual positions instead of dead transactions. BUY/SELL can derive total or quantity from a live quote fetched on explicit asset selection. Quote lookup is transient and does not create assets until the transaction is saved; selected provider metadata and the submitted quote are then persisted with the transaction.

The first trust/polish implementation batch added the FolioCore app icon, replaced placeholder portfolio tips with actionable portfolio checks, clarified overview metrics, added a shared timeframe selector for dashboard summaries/charts, and simplified holdings to Position, Performance, Risk, and Details views with stable column widths and real platform display. Portfolio checks can now be marked reviewed locally; reviewed checks reappear if their underlying detail changes. Portfolio distribution supports assets, asset types, and currency modes without donut labels, avoiding the previous 100x percentage display issue.

The dashboard now exposes one authenticated export modal backed by `/api/export`. Users can choose CSV, report JSON, or backup JSON; non-backup exports support all-time, 1D, 1W, 1M, 6M, YTD, and custom date ranges plus section selection. Backup JSON is restore-oriented and intentionally ignores filters so it always includes the full real dataset. Transactions now include a generic CSV import flow on the Transactions page and dashboard Transactions tab, backed by `/api/transactions/import`; users can upload a CSV, map columns, dry-run validation, see duplicate/unsupported-row warnings, and import valid rows while duplicate/invalid rows are skipped. Broker-specific presets remain deferred until real sample exports are available. `/api/news` builds portfolio-aware headlines from trusted RSS sources, Yahoo/Nasdaq symbol feeds, limited crypto tag feeds, and optional SEC EDGAR filing enrichment. GDELT broad-news search is disabled unless `NEWS_GDELT_ENABLED=true`, HTTPS-only, and restricted to trusted domains. Local Google/search fallback rows have been removed. The News UI is labeled as matched headlines and shows coverage chips per holding so missing source coverage is visible. Settings now includes a code-backed News source registry that lists trusted RSS sources, SEC filing status, and optional GDELT status with coverage/trust labels; source health metrics are still future work.

`/api/digest` returns a branded portfolio report preview in JSON/text/html with metrics, structured highlight cards, allocation bars, top positions, recent transactions, and matched headlines. Highlight cards currently cover portfolio value, largest winner, largest drag, concentration, and data quality. It can send to the signed-in email when `RESEND_API_KEY` and `EMAIL_FROM` are configured. Report links use an absolute base URL when available so emailed reports can link back to authenticated CSV/backup downloads. `/api/cron/digest` is configured through Vercel Cron for weekly delivery on Monday at 08:00 UTC, but fails closed unless `CRON_SECRET`, `DIGEST_EMAIL_RECIPIENTS`, and email delivery variables are configured. Cron recipients are masked in responses and must also be in `APP_ALLOWED_EMAILS`.

`/api/cron/refresh` is configured through Vercel Cron for daily price/FX refresh and portfolio snapshot writes at 07:00 UTC. It fails closed unless `CRON_SECRET` and `CRON_REFRESH_EMAILS` or `DIGEST_EMAIL_RECIPIENTS` are configured, and recipients must be allowlisted.

The Analysis tab calculates risk diagnostics from selected-currency TWR returns. To make the UI reviewable immediately, the dashboard now builds an `analyticsSnapshots` view from real snapshots when they are regular enough, otherwise from a deterministic 120-day simulated history ending at the current date. It also builds aligned demo benchmark returns so Sharpe, Sortino, and beta can render during review. The UI labels simulated history as a demo overlay and labels the benchmark as a demo composite. The Analysis tab now includes a Risk readiness panel showing progress toward 30 regular portfolio return periods, regular cadence, and 30 aligned benchmark periods. Raw persisted snapshots remain separate and are still used for restore-oriented backup/export data.

Settings preferences are browser-persisted for now: default currency, manual-refresh snapshot toggle, backup email, and daily export toggle. The snapshot toggle is sent to `/api/prices/refresh` so manual refresh can skip portfolio snapshot writes. DB-backed user settings are deferred until a safe migration path or valid local Neon migration credentials are available.

Portfolio math has focused tests for TWR cash-flow neutrality, cash/contribution separation, same-day trade ordering, edit-time sell quantity recalculation, provider price normalization, oversell-safe position state, external cash-flow scoping, realized P&L average-cost handling, unique platform tracking, timeframe stats, portfolio checks, portfolio export generation, demo analytics history, risk metrics, and digest generation. `npm run smoke:prod` runs a read-only production smoke test for login, protected-route redirects, API login, authenticated transactions JSON, and dashboard rendering. `SMOKE_REFRESH=1 npm run smoke:prod` also verifies the snapshot-writing price refresh endpoint. `SMOKE_QUOTE=1 npm run smoke:prod` verifies live quote lookup. `SMOKE_EXPORT=1 SMOKE_NEWS=1 SMOKE_DIGEST=1 npm run smoke:prod` verifies the read-only export/news/digest endpoints. On 2026-04-28, production smoke passed for deployment `dpl_B1xagnJws6Tgh5myheKjjjCqKeVw`: export/news/digest worked, quote matrix returned BTC, ETH, NVDA, SPY, and XAU/USD live quotes, `/dashboard` returned 200, `/api/news` returned 9 matched headlines, and targeted export smoke verified filtered JSON/CSV plus unfiltered backup JSON behavior.

Readiness is documented in `docs/READINESS.md`. Current verdict: ready for a guarded beta with 1-3 trusted friends, not for broad public launch.

`BACKLOG.md` captures the roadmap with inline status labels. Export modal and branded report highlight improvements are marked shipped. Risk/readiness and benchmark history remain partial because the current ratios use a demo analytics overlay and demo composite benchmark rather than persisted real benchmark snapshots.

Still missing or likely incomplete: DB-backed settings persistence, production cron/email variables for scheduled refresh/digest delivery, broader SEC CIK coverage, official company IR feed registry, AI-backed news materiality summaries, persisted benchmark snapshot storage for mixed-asset beta, provider coverage beyond CoinGecko/Twelve Data/RSS/optional GDELT, paired transfer support, dividend support, broker-specific import presets/sample-format handling, complete DB-backed CRUD coverage, and mutation-capable end-to-end test coverage.

<!-- context:auto:start:implementation-status -->
Generated refresh summary:
- Other: 7 files
- Documentation: 6 files
- UI components: 5 files
- App pages: 2 files
- Database: 2 files
- API routes: 1 file
- Metrics: 1 file

Recent commits:
- bb71c24 2026-05-05 Clarify autonomous Codex Dobby loop
- ede12e0 2026-05-05 Add Dobby Codex coordination docs
- 15be197 2026-04-30 Allow preview dashboard without database
- 6b06160 2026-04-30 Trigger playground preview deployment
- 7a28c7f 2026-04-30 Add news source registry settings view
- 20b59a8 2026-04-30 Add generic CSV transaction import
- caa3c82 2026-04-30 Add risk readiness progress panel
- d7745ff 2026-04-30 Ignore macOS metadata files
<!-- context:auto:end:implementation-status -->

## Known Bugs / Issues

- Transfers are intentionally disabled in quick-add until paired portfolio semantics exist.
- Existing chart warning about Recharts initial `-1` dimensions was addressed by giving `ResponsiveContainer` numeric heights.
- ESLint must ignore generated build/deployment folders such as `.next` and `.vercel`; this is configured in `eslint.config.mjs`.
- Production provider probe on 2026-04-27 returned live Twelve Data quotes for SPY, VOO, XAU/USD, EUR/USD, NVDA, and MSFT, but AAPL returned unavailable. Treat provider quote coverage as best-effort and surface unavailable states clearly.
- The local `.env.local` Neon URL currently fails authentication; production env values are sensitive in Vercel and cannot be pulled back locally. Avoid schema migrations until migration credentials or an approved migration path are available.
- GDELT is disabled by default for privacy and source-quality reasons. If enabled, it is still best-effort and restricted to trusted HTTPS domains.
- Current visible risk diagnostics may use a labeled demo analytics overlay when real history is sparse or irregular. Treat these demo ratios as UI/test data, not production-grade investment diagnostics.
- Production-grade beta still requires a benchmark snapshot pipeline that aligns portfolio returns to a weighted benchmark series. The current benchmark shown for review is a deterministic demo composite.

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
- Whether to prioritize DB-backed user preferences, transaction import/dividends/fees, news source registry, or real benchmark history next.

## Next Recommended Steps

1. Run `npm run context:update` after meaningful Codex work sessions.
2. Add mutation-capable end-to-end smoke tests for create/edit/delete transaction and create/edit/delete manual position, preferably against a dedicated smoke-test account.
3. Run a manual browser Google login smoke test with an allowlisted Google account.
4. Move settings preferences from browser storage into Neon once migration access is resolved.
5. Configure `CRON_SECRET`, `CRON_REFRESH_EMAILS`, `DIGEST_EMAIL_RECIPIENTS`, `RESEND_API_KEY`, and `EMAIL_FROM` in Vercel when scheduled refresh and digest email should actually run.
6. Add paired transfer support once multiple portfolios are available.
7. Add benchmark snapshot storage and a composite benchmark provider so beta can move from demo analytics to real calculated output.
8. For OpenClaw experiments, start from `codex/openclaw-playground` and keep `main` plus `codex/safe-backup-2026-04-30` protected as recovery references.
9. Review the new Risk readiness panel in the Analysis tab and refine copy/thresholds if beta testers find the methodology too dense.
10. Implement the next `BACKLOG.md` batch, likely import/dividend/fee workflows, DB-backed settings/email automation, news source registry, or real benchmark history.

<!-- context:auto:start:next-steps -->
Generated suggestions:
- Review recent changed areas above and manually fold durable decisions into the appropriate sections.
- Keep updating context after meaningful implementation work; no TODO/FIXME-driven action is currently visible.
- Keep product and technical decisions manually curated; this script only updates bounded generated blocks.
<!-- context:auto:end:next-steps -->

## Last Updated

2026-05-05T09:47:48.357Z - Refreshed generated context from 8 recent commits, 24 changed files, and 0 TODO/FIXME items.
