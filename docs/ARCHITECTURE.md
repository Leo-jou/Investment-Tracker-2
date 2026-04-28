# Investment Tracker Architecture

## Overview

This MVP is a provider-ready Next.js app that uses the real production shape while keeping expensive or fragile integrations optional:

- Next.js App Router handles pages and API routes.
- React components are split by portfolio surface area so UI sections can be iterated independently.
- Drizzle models and reads/writes the Neon Postgres schema for production portfolio data.
- Pricing and asset search services use CoinGecko and Twelve Data when configured, with mock/fallback behavior when provider data is missing.
- Performance logic keeps external cash flows separate from investment return.
- News, digest, export, and cron surfaces are authenticated and fail closed where automation could affect user data.

## Assumptions

- The MVP starts with Google/email login, with the database schema ready for future multi-user auth.
- Manual entry is the source of truth. Broker and wallet sync are out of scope.
- USD is the default display currency. EUR is available through an FX-backed toggle.
- Daily snapshots are enough for refresh and performance calculations.
- TWR is the primary performance metric because deposits and withdrawals must not distort returns.
- Provider failures should degrade to mock/fallback data instead of blocking the app.
- News matching should prefer trusted RSS/symbol feeds and official filings. Broad third-party news search remains opt-in.
- Risk metrics should be withheld when cadence or benchmark data is too weak to support a defensible number.

## Schema

Core tables:

- `users`: current single-user account, future-proofed for real auth.
- `portfolios`: independent portfolios owned by a user.
- `assets`: local asset catalog created from dynamic provider search.
- `transactions`: buys, sells, deposits, withdrawals, transfers, manual values, and cash adjustments.
- `manual_positions`: arbitrary values for non-priced holdings.
- `price_snapshots`: historical asset prices by provider.
- `fx_snapshots`: EUR/USD exchange rates.
- `portfolio_snapshots`: daily value, invested capital, external cash flow, and TWR.

Important rules:

- `assets.provider + assets.external_id` is unique to prevent duplicated provider mappings.
- Transfers can share `transactions.transfer_group_id` so paired entries can be reconciled.
- `portfolio_snapshots.external_cash_flow_eur` is the cash-flow input used to avoid fake gains/losses.

## Implementation Phases

1. Foundation: Next.js, TypeScript, Tailwind, app shell, Drizzle schema, mock data.
2. Portfolio model: portfolios, positions, transactions, manual positions, local calculations.
3. Pricing seams: CoinGecko, Twelve Data, FMP search/refresh endpoints with mock fallback.
4. Performance engine: portfolio value, invested capital, TWR periods, daily snapshots.
5. UI: dashboard, portfolio tabs, holdings, transactions, assets, manual positions, settings.
6. Polish: density, responsive behavior, component-level iteration from user feedback.
7. Automation: guarded daily price/snapshot refresh, weekly digest/report delivery, backup exports.
8. Readiness hardening: DB-backed settings, imports, paired transfers, dividends, benchmark history, and mutation-capable end-to-end tests.

## What Is Needed From You

Now:

- Review the live UI and comment by area/component.
- Configure cron/email variables when scheduled refreshes and digest emails should run.

Later:

- A few real transaction examples to validate input speed and TWR behavior.
- Decision on whether portfolio-impact news summaries should use an AI layer.
- Migration access or a safe migration plan for DB-backed user preferences.
