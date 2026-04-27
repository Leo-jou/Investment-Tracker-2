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

Production is deployed on Vercel at `https://foliocore.vercel.app`. The current production deployment includes inline edit/delete flows for transactions and manual positions.

CoinGecko, Twelve Data, and Google OAuth credentials are configured as sensitive Vercel Production environment variables. `AUTH_URL` is configured for production Google OAuth. Do not record or commit secret values.

Quick-add transaction UX now uses type-specific fields for BUY, SELL, DEPOSIT, WITHDRAW, and MANUAL entries. Manual entries create manual positions instead of dead transactions. BUY/SELL can derive total or quantity from a live quote fetched on explicit asset selection. Quote lookup is transient and does not create assets until the transaction is saved; selected provider metadata and the submitted quote are then persisted with the transaction.

Holdings sub-tabs now switch between position, price, financials, performance, risk, and technical table views. Portfolio distribution supports assets, asset types, and currency modes without donut labels, avoiding the previous 100x percentage display issue.

Settings preferences are browser-persisted for now: default currency, manual-refresh snapshot toggle, backup email, and daily export toggle. The snapshot toggle is sent to `/api/prices/refresh` so manual refresh can skip portfolio snapshot writes. DB-backed user settings are deferred until a safe migration path or valid local Neon migration credentials are available.

Portfolio math has focused tests for TWR cash-flow neutrality, cash/contribution separation, same-day trade ordering, edit-time sell quantity recalculation, provider price normalization, oversell-safe position state, and external cash-flow scoping. `npm run smoke:prod` runs a read-only production smoke test for login, protected-route redirects, API login, authenticated transactions JSON, and dashboard rendering. `SMOKE_REFRESH=1 npm run smoke:prod` also verifies the snapshot-writing price refresh endpoint. `SMOKE_QUOTE=1 npm run smoke:prod` verifies live quote lookup.

Still missing or likely incomplete: DB-backed settings persistence, provider coverage beyond CoinGecko/Twelve Data, paired transfer support, dividend support, import/export, complete DB-backed CRUD coverage, and mutation-capable end-to-end test coverage.

<!-- context:auto:start:implementation-status -->
Generated refresh summary:
- Other: 12 files
- UI components: 12 files
- App pages: 7 files
- API routes: 6 files
- Pricing providers: 5 files
- Documentation: 2 files
- Database: 1 file
- Tooling: 1 file

Recent commits:
- 7592e04 2026-04-27 Refine portfolio UI controls and settings
- 0262bd2 2026-04-27 Make quote matrix smoke provider-aware
- 7d1785d 2026-04-27 Wire portfolio controls and improve live quote search
- 603d04e 2026-04-27 Document Google OAuth production setup
- 037d026 2026-04-27 Make settings status runtime-aware
- d0a4c74 2026-04-27 Add live transaction quotes and Google auth scaffold
- b28ea68 2026-04-27 Add Twelve Data symbol fallback
- 7d7dc40 2026-04-27 Add provider-backed price refresh
<!-- context:auto:end:implementation-status -->

## Known Bugs / Issues

- Transfers are intentionally disabled in quick-add until paired portfolio semantics exist.
- Existing chart warning about Recharts initial `-1` dimensions was addressed by giving `ResponsiveContainer` numeric heights.
- ESLint must ignore generated build/deployment folders such as `.next` and `.vercel`; this is configured in `eslint.config.mjs`.
- Production provider probe on 2026-04-27 returned live Twelve Data quotes for SPY, VOO, XAU/USD, EUR/USD, NVDA, and MSFT, but AAPL returned unavailable. Treat provider quote coverage as best-effort and surface unavailable states clearly.
- The local `.env.local` Neon URL currently fails authentication; production env values are sensitive in Vercel and cannot be pulled back locally. Avoid schema migrations until migration credentials or an approved migration path are available.

<!-- context:auto:start:known-issues -->
Generated TODO/FIXME scan:
- No TODO/FIXME comments found in scanned source files.
<!-- context:auto:end:known-issues -->

## User Feedback / UX Notes

- Keep the interface compact, information-dense, and investment-dashboard oriented rather than marketing-style.
- Context memory should stay low-noise and action-oriented.
- Avoid noisy automated updates that make project memory less useful.
- Preferred project-memory workflow: update before ending each meaningful work session and after major code exchanges; avoid hourly automation.

## Open Questions

- Which portfolio workflows need persistence before visual polish continues?

## Next Recommended Steps

1. Run `npm run context:update` after meaningful Codex work sessions.
2. Add mutation-capable end-to-end smoke tests for create/edit/delete transaction and create/edit/delete manual position, preferably against a dedicated smoke-test account.
3. Run a manual browser Google login smoke test with an allowlisted Google account.
4. Move settings preferences from browser storage into Neon once migration access is resolved.
5. Add paired transfer support once multiple portfolios are available.
6. Continue UI iteration against the deployed app, keeping components modular and compact.

<!-- context:auto:start:next-steps -->
Generated suggestions:
- Review recent changed areas above and manually fold durable decisions into the appropriate sections.
- Keep updating context after meaningful implementation work; no TODO/FIXME-driven action is currently visible.
- Keep product and technical decisions manually curated; this script only updates bounded generated blocks.
<!-- context:auto:end:next-steps -->

## Last Updated

2026-04-27T14:50:43.454Z - Refreshed generated context from 8 recent commits, 46 changed files, and 0 TODO/FIXME items.
