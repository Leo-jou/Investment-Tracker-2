# FolioCore Product Backlog

Last updated: 2026-04-28

## Purpose

This backlog is the working agreement for what to improve next. It separates urgent product clarity from larger features, records tradeoffs, and marks where user input is required so Codex can work autonomously for longer sessions.

## How To Use This File

- Keep this file product-facing: user value, acceptance criteria, dependencies, and open decisions.
- Keep durable engineering rules in `AGENTS.md`.
- Keep current implementation memory in `context.md`.
- Keep status visible in-place so progress is readable without scrolling to the bottom.
- Use status labels in headings:
  - `[ ]`: not started.
  - `[~]`: partially shipped or needs another pass.
  - `[x]`: shipped.
  - `[blocked]`: waiting on user input, credentials, provider access, or a decision.
- When an item ships, keep a short shipped note under the original item instead of only moving it to a separate Done section.
- Priority labels:
  - `P0`: blocks trust, usability, or beta readiness.
  - `P1`: important product depth or obvious UX gap.
  - `P2`: useful but not required before a small beta.
  - `R&D`: requires provider research, API choice, or product decision before implementation.

## Progress Snapshot

- [x] First trust/polish batch: favicon, portfolio checks, metric clarity, shared timeframes, holdings cleanup.
- [~] Reporting: branded HTML report, preview cards, and structured highlights exist; selected-timeframe reporting and email polish still need a later pass.
- [~] News: trusted RSS-backed headlines exist; source registry/admin visibility and AI impact commentary are not done.
- [~] Risk: demo analytics backfill now makes charts/ratios visible for review; a persisted benchmark history pipeline is still not done.
- [x] Export UX: one modal with format/date/section choices.
- [x] Portfolio checks: review/acknowledge controls shipped.
- [~] Transactions: generic CSV import is now available; dividends and fees/taxes remain open.
- [ ] Settings automation: DB-backed preferences and scheduled email exports.

## Current Product Position

FolioCore is good enough for a guarded beta with a few trusted users, but not ready for a public launch. The core manual-entry loop is usable, and the first trust/polish batch has removed the most visible placeholder UI. The next work should focus on export UX, imports/dividends/fees, DB-backed preferences, recurring automation, and deeper analytics methodology.

## Recommended Work Order

1. [x] Replace simple export buttons with an export modal that supports CSV, report JSON, backup JSON, date ranges, and selected sections.
2. [x] Improve branded portfolio report preview and highlights.
3. [~] Implement dividends, fees/taxes, and import workflows.
4. [ ] Add DB-backed settings and scheduled email/export preferences.
5. [~] Improve news source registry and digest quality.
6. [ ] Add risk readiness progress and benchmark history for beta.
7. [ ] Continue holdings/distribution polish after real usage feedback.
8. [ ] Consider AI only where it adds clear leverage: import mapping, news impact summaries, and portfolio Q&A.

## P0 - Immediate Trust And Usability

No open P0 items after the first implementation batch. Treat metric correctness, transaction correctness, and backup/export reliability as P0 if regressions appear.

### [x] Favicon And App Icons

Problem: Browser tabs showed the default gray globe instead of the FolioCore logo.

Shipped:
- Added a local FolioCore SVG icon at `/icon.svg`.
- Updated app metadata so the browser title and icon use FolioCore branding.
- Verified production `/icon.svg` returns 200.

### [x] Replace Placeholder Tips With Portfolio Checks

Problem: The portfolio tips section felt like a placeholder.

Shipped:
- Replaced static tips with a compact `Portfolio checks` panel.
- Checks are only generated from real portfolio state.
- The panel is capped at four checks to avoid noise.
- Added local acknowledgement controls so users can mark checks reviewed; reviewed checks reappear if their underlying detail changes.

Current check methodology:
- Snapshot count: warn when fewer than two snapshots exist because period change/TWR needs a start and end point.
- Snapshot freshness: warn when latest snapshot is more than two days old.
- Concentration: flag the largest holding when it is at least 25% of priced holdings; severity becomes warning at 50% or more.
- Platform labeling: flag holdings that do not have a platform label from buy transactions.
- Saved/manual pricing: flag priced holdings that use `manual` or `mock` provider data.
- Manual valuation freshness: flag manual positions not updated in more than 30 days.

### [x] Clarify Overview Metrics

Problem: `Portfolio value`, `Net contributions`, `Unrealized gain`, `Realized gain`, and TWR were not clear enough.

Shipped:
- Overview cards now distinguish current value, net contributions, unrealized P&L, realized P&L, and selected-period TWR.
- Added plain-language tooltips and calculation details.
- Removed fake split metrics that previously approximated realized/unrealized values.
- Added focused tests for realized P&L and displayed metric inputs.

### [x] Unified Timeframe Model

Problem: Overview cards, portfolio charts, gain summaries, exports, and analysis used unclear or inconsistent timeframes.

Shipped:
- Added shared timeframe options: `1D`, `1W`, `1M`, `3M`, `6M`, `YTD`, `1Y`, `All`.
- The dashboard timeframe controls summary cards and portfolio chart summaries.
- Sparse ranges now show a data-quality state instead of fake zeroes.

Still open:
- Custom date range support for export/report workflows.

### [x] Holdings Table Layout Cleanup

Problem: Holdings tabs had uneven spacing, repeated metrics, and inconsistent column widths.

Shipped:
- Reduced holdings tabs to `Position`, `Performance`, `Risk`, and `Details`.
- Added stable column widths and right-aligned numeric columns.
- Removed loose platform chips under the table.
- Added row-level platform display from transaction data.

## P1 - Export, Backup, And Reporting

### [x] Export Modal

Problem: The dashboard has three direct export buttons, but users do not know the difference between CSV, JSON, and backup.

Definitions:
- CSV: human-readable spreadsheet export for review.
- Report JSON: compact structured report for debugging or external processing.
- Backup JSON: restore-oriented full data export with IDs, assets, transactions, manual positions, snapshots, and schema version.

Acceptance criteria:
- Replace direct export buttons with one `Export` button.
- Modal supports format selection: CSV, report JSON, backup JSON.
- Modal supports date range: all time, last day, last week, last month, last 6 months, YTD, custom.
- Modal supports sections: portfolio summary, holdings, transactions, manual positions, snapshots, allocations.
- Explain each format in one short line.

User input needed: none.

Shipped:
- Replaced the three direct dashboard export links with one `Export` modal.
- Added CSV, report JSON, and full backup JSON format choices.
- Added all-time, 1D, 1W, 1M, 6M, YTD, and custom date ranges.
- Added section selection for summary, holdings, transactions, manual positions, snapshots, and allocations.
- Backup JSON remains restore-oriented and always includes the full dataset, ignoring filters by design.

### [x] Branded Portfolio Report Improvements

Problem: The printable report is much better, but the Highlights section is weak and not insight-oriented.

Shipped:
- Replaced generic highlight lines with structured digest cards in both the in-app preview and HTML report.
- Added highlight cards for portfolio value, largest winner, largest drag, concentration, and data quality.
- Kept allocation and top positions sections in the full report.

Acceptance criteria:
- Replace generic highlight lines with structured cards:
  - Portfolio value and change over selected timeframe.
  - Largest positive/negative contributors.
  - Net contributions and cash-flow note.
  - Concentration and allocation note.
  - Data quality note: stale prices, missing snapshots, unsupported assets.
- Keep allocation and top positions tables.
- Use selected timeframe once the unified timeframe model exists.

User input needed later: preferred tone for the next pass: neutral factual report, advisory-style digest, or concise executive summary.

### [blocked] Scheduled Email Exports

Problem: Settings mention backup email and daily export, but preferences are browser-local and not active.

Acceptance criteria:
- Add DB-backed user preferences for export cadence.
- Cadence: off, daily, weekly, monthly.
- Format: CSV and/or backup JSON.
- Email recipient defaults to account email, optional backup email.
- Scheduled job respects allowlist and fails closed.

Dependencies:
- DB migration access.
- Email provider configured in Vercel.
- `CRON_SECRET`, `CRON_REFRESH_EMAILS`, `DIGEST_EMAIL_RECIPIENTS`, `RESEND_API_KEY`, `EMAIL_FROM`.

User input needed: sender/domain decision for email delivery.

## P1 - Transactions, Imports, Dividends, Fees

### [~] Upload Transactions

Question: Does upload require AI?

Answer: No, not for a serious first version. A robust CSV import with column mapping is enough for IBKR, Kraken, Coinbase, Binance, and most brokers/exchanges. AI becomes useful later for messy PDFs, screenshots, broker statements, or auto-detecting unknown column semantics.

Acceptance criteria:
- Upload CSV file.
- Preview rows before import.
- Column mapping screen for date, type, symbol, quantity, total, fees, currency, platform, notes.
- Preset templates for IBKR, Kraken, Coinbase, Binance, and BUX Zero if formats are available.
- Detect duplicates before import.
- Validate unsupported rows and allow partial import.
- Dry-run import summary before writing to DB.

Shipped:
- Added a generic CSV import panel on the Transactions page and dashboard Transactions tab.
- Added automatic header mapping plus manual mapping for date, type, symbol, quantity, total, fees, currency, platform, and notes.
- Added server-side dry run and import endpoint with duplicate detection, unsupported-row validation, and partial import behavior.
- Enabled the Upload actions in the Add transaction menu and Transactions table.

Still open:
- Broker-specific presets for IBKR, Kraken, Coinbase, Binance, and BUX Zero once real sample exports are available.
- XLSX support if needed.
- Better batching if very large imports become common.

User input needed:
- Example CSV exports from the platforms you actually use, with sensitive data removed.
- Decision later: CSV only, or also XLSX.

### [ ] Dividends

Problem: Dividend buttons exist conceptually but the feature is not implemented.

Acceptance criteria:
- Add `DIVIDEND` transaction type or dividend-specific table depending on schema choice.
- Fields: asset, amount, currency, date, withholding tax, platform, note.
- Dividends count as realized income but not deposits.
- Dashboard and report show dividend income separately from realized trading gains.

User input needed: confirm whether dividends should affect TWR as investment return or be tracked as separate income. Recommendation: include dividends in investment return when tied to holdings, but show them separately in income breakdown.

### [ ] Taxes And Fees

Problem: Taxes and fees need explicit handling without turning the app into a tax tool.

Acceptance criteria:
- Add standalone `FEE` / `TAX` cash-flow entries or extend `CASH_ADJUSTMENT`.
- Fees attached to trades remain part of cost basis.
- Standalone platform fees reduce cash but do not count as market loss.
- Taxes are tracked as cash outflows, not investment performance.

User input needed: confirm naming: `Fees`, `Taxes`, or combined `Fees & Taxes`.

## P1 - Settings And Automation

### [blocked] DB-Backed User Preferences

Problem: Settings currently use browser local storage.

Acceptance criteria:
- Persist default currency, snapshot refresh preference, backup email, export cadence, digest cadence, and notification preferences in Neon.
- Settings follow the user across browsers/devices.
- Migration is safe and documented.

Dependencies: working migration credentials or a migration workflow approved by the user.

User input needed: Neon migration permission/path.

### [~] Daily Snapshots And Refresh State

Problem: Daily refresh cron exists, but user-facing status is not explicit.

Acceptance criteria:
- Settings show whether scheduled refresh is configured.
- Dashboard shows last successful price refresh and last portfolio snapshot.
- Manual refresh writes or skips snapshots based on user preference.
- Cron refresh logs are safe and visible enough for debugging.

User input needed: production cron env values if not already configured.

## P1 - News And Digest

### [~] News Source Registry

Problem: User is flying blind about where headlines come from.

Acceptance criteria:
- Create a source registry in code and docs.
- Show enabled sources in Settings or a debug/admin panel.
- Classify sources: crypto, equities, ETFs, macro, official filings, optional broad search.
- Mark sources as trusted, optional, or disabled.
- Add source health: last successful fetch, result count, error state.

Current source types:
- Trusted RSS feeds.
- Yahoo/Nasdaq symbol feeds.
- CoinDesk/Cointelegraph crypto feeds.
- Optional SEC EDGAR filings.
- Optional GDELT broad-news search.

Shipped:
- Added a code-backed news source registry.
- Settings now shows deterministic RSS sources, SEC filing status, and optional GDELT status with coverage and trust labels.
- Reused the same trusted-domain list for the GDELT registry and runtime filtering.

Still open:
- Add source health: last successful fetch, result count, and error state.
- Add any official company IR feeds after source-list review.

User input needed: approval for source list and whether to enable GDELT.

### [ ] AI-Assisted Digest Commentary

Problem: Headlines are now live, but they do not explain likely impact.

Recommendation: Add AI only after source registry and deterministic matching are stable.

Acceptance criteria:
- AI receives only curated headlines and portfolio symbols, not secret credentials.
- Output is clearly labeled as generated analysis, not advice.
- Digest includes "why this might matter" bullets and confidence/source links.
- User can disable AI commentary.

User input needed:
- OpenAI/API provider decision.
- Budget/cost tolerance.
- Tone: conservative, analytical, concise.

## P1 - Analytics And Risk

### [x] Explain Risk Readiness

Problem: Analysis says metrics are not ready but users do not know exactly why or when they will be.

Acceptance criteria:
- Add a visible requirements panel:
  - Sharpe/Sortino need at least 30 regular return periods.
  - Current seeded snapshots have 28-57 day gaps because they are monthly-ish anchors.
  - Daily refresh will create future daily snapshots once configured.
  - Beta needs benchmark history and will not appear from portfolio snapshots alone.
- Show progress: `4 / 30 regular periods`, benchmark connected or not connected.

User input needed: none.

Shipped:
- Added a deterministic demo analytics overlay when real history is too sparse or irregular.
- The overlay generates 120 regular daily snapshots and aligned benchmark returns so charts, Sharpe, Sortino, and beta are visible during product review.
- The Analysis tab labels the overlay clearly and distinguishes `Demo overlay` from real `Portfolio snapshots`.
- Added a visible Risk readiness panel with progress toward 30 return periods, regular snapshot cadence, and 30 aligned benchmark periods.

### [~] Benchmark History For Beta

Problem: Beta is documented but not implemented because benchmark snapshots are missing.

Acceptance criteria:
- Add benchmark asset registry: SPY for stocks/ETFs, BTC for crypto, XAU/USD for gold/commodities, cash/manual to zero-return or chosen proxy.
- Fetch/store benchmark snapshots.
- Align benchmark and portfolio returns by date.
- Calculate beta only when enough aligned periods exist.
- Add tests for missing benchmark dates and mixed-asset weights.

User input needed: agree on benchmark methodology for mixed portfolios.

Shipped:
- Added an aligned demo benchmark-return series for analytics display and tests.

Still open:
- Persist benchmark snapshots from real market providers.
- Agree on the production mixed-asset benchmark methodology.

### [~] Performance Semantics

Problem: Value and performance charts currently feel like the same chart with different units.

Acceptance criteria:
- Define:
  - Value chart: absolute portfolio value, includes deposits/withdrawals.
  - Performance chart: TWR or period return, excludes deposits/withdrawals.
  - Capital chart: net contributions and external cash flows.
- Make chart labels and tooltips reflect those definitions.
- Add tests for period return calculations.

User input needed: none.

## P2 - Distribution And Holdings Details

### [ ] Distribution Tabs

Problem: Currency distribution is likely redundant with the global USD/EUR toggle. Sectors is coming soon but not useful yet.

Recommendation:
- Keep `Assets` and `Asset types`.
- Hide `Currency` unless assets genuinely span multiple native currencies and it answers a real question.
- Hide `Sectors` until sector classification exists.

Acceptance criteria:
- No "coming soon" tab unless there is a clear reason.
- Distribution uses real available data only.

User input needed: confirm whether native-currency distribution matters to you.

### [ ] Manual Positions Placement

Problem: Manual positions below holdings feels odd.

Options:
- Keep manual positions in holdings because they affect total value and allocation.
- Also surface manual position changes in transactions/history.
- Move manual position management to its own tab and summarize in holdings.

Recommendation: Keep them in portfolio value/allocation, but move editing controls to a dedicated Manual Positions section/page and show them as rows in holdings with type `Manual`.

User input needed: preference after first UI proposal.

## P2 - Visual Polish

### [ ] Button Shape And UI Polish

Problem: Transaction button and some controls need more polished shape/density.

Acceptance criteria:
- Refine button radii consistently across the app.
- Keep cards at 8px radius or less.
- Avoid decorative UI that hurts dashboard density.

User input needed: none.

### [ ] Table And Component Audit

Problem: Some sections look good, but layout consistency varies.

Acceptance criteria:
- Run a component-by-component UI audit.
- Create a visual QA checklist for dashboard, holdings, transactions, analysis, settings, report view, mobile.
- Fix overflow, spacing, and redundant labels.

User input needed: screenshots/comments after first pass.

## R&D - Future Product Ideas

### [ ] Portfolio AI Assistant

Potential scope:
- Ask questions about holdings, transactions, performance, and news.
- Explain why TWR differs from value change.
- Summarize portfolio changes over a timeframe.
- Help map uploaded transactions.

Risks:
- Cost.
- Privacy.
- Must avoid financial advice positioning.

User input needed: desired level of AI, provider/budget decision.

### [ ] Broker/API Sync

Current position: out of MVP scope.

Reason:
- Broker sync adds security, API maintenance, account permissions, and support complexity.
- Manual entry plus import is the right next step.

## Needs User Help

- Email sender/domain decision for digest and scheduled exports.
- Production env values for cron/email automation if not already configured.
- Example CSV exports from actual platforms for import presets.
- Benchmark methodology preference for mixed-asset beta.
- Decision on AI provider/budget for digest commentary and import assistance.
- Decision on preferred report tone.

## Codex Can Do Autonomously

- Build export modal and date-range plumbing.
- Improve branded report preview and highlights.
- Add risk readiness panel.
- Hide pointless/empty distribution tabs.
- Add deterministic CSV import framework before platform-specific templates.
- Add source registry docs and admin UI.
