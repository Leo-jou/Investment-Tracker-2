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

## Technical Decisions

- Next.js App Router with TypeScript for the app and API routes.
- Tailwind CSS with compact shadcn-style components for the UI.
- Recharts for portfolio value, TWR, allocation, and performance charts.
- Drizzle ORM with Neon Postgres for the database layer.
- Mock-first services for asset search, prices, FX, snapshots, and portfolio metrics until DB-backed CRUD and providers are stable.
- `AGENTS.md` is the durable instruction file; this file is the concise project state summary.

## Current Implementation Status

The app includes a Next.js shell, portfolio dashboard pages, reusable portfolio components, API routes for assets, transactions, manual positions, item deletion, price refresh, auth login, Drizzle schema/migration files, mock/demo data, metrics utilities, and provider-ready pricing seams.

Quick-add transaction UX now uses type-specific fields for BUY, SELL, DEPOSIT, WITHDRAW, and MANUAL entries. Manual entries create manual positions instead of dead transactions. BUY/SELL can derive total or quantity from the selected asset's latest saved price.

Portfolio math has focused tests for TWR cash-flow neutrality, cash/contribution separation, same-day trade ordering, oversell-safe position state, and external cash-flow scoping.

Still missing or likely incomplete: full real-provider integration, production auth hardening beyond email allowlist, edit flows for existing rows, paired transfer support, complete DB-backed CRUD coverage, and end-to-end test coverage.

<!-- context:auto:start:implementation-status -->
Generated refresh summary:
- Git history unavailable in this workspace; initialize or connect `.git` for changed-area summaries.

Recent commits:
- Git history unavailable in this workspace.
<!-- context:auto:end:implementation-status -->

## Known Bugs / Issues

- Transfers are intentionally disabled in quick-add until paired portfolio semantics exist.
- Existing chart warning about Recharts initial `-1` dimensions was addressed by giving `ResponsiveContainer` numeric heights.
- The workspace currently has no initialized Git repository, so git-history-based context refreshes will be limited until `.git` exists.

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

- Which real market data/search/FX providers should be used first?
- What authentication path should ship for the first private deployment?
- Which portfolio workflows need persistence before visual polish continues?

## Next Recommended Steps

1. Run `npm run context:update` after meaningful Codex work sessions.
2. Initialize or connect a Git repository so the context refresh script can inspect recent history.
3. Add edit flows for transactions/manual positions.
4. Add paired transfer support once multiple portfolios are available.
5. Wire real provider price refresh and FX updates after the tested manual workflows remain stable.

<!-- context:auto:start:next-steps -->
Generated suggestions:
- Initialize or connect the Git repository so this script can summarize recent commits and changed files.
- Keep updating context after meaningful implementation work; no TODO/FIXME-driven action is currently visible.
- Keep product and technical decisions manually curated; this script only updates bounded generated blocks.
<!-- context:auto:end:next-steps -->

## Last Updated

2026-04-27T10:41:42.674Z - Refreshed generated context without git history; scanned 0 TODO/FIXME items.
