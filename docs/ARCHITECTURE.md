# Investment Tracker Architecture

## Overview

This MVP is a mock-first Next.js app that uses the real production shape from day one:

- Next.js App Router handles pages and API routes.
- React components are split by portfolio surface area so UI sections can be iterated independently.
- Drizzle models the Neon Postgres schema without requiring a live database during UI design.
- Pricing and asset search services are provider-ready, with mock fallback when keys are missing.
- Performance logic keeps external cash flows separate from investment return.

## Assumptions

- The MVP starts with Google/email login, with the database schema ready for future multi-user auth.
- Manual entry is the source of truth. Broker and wallet sync are out of scope.
- USD is the default display currency. EUR is available through an FX-backed toggle.
- Daily snapshots are enough for refresh and performance calculations.
- TWR is the primary performance metric because deposits and withdrawals must not distort returns.
- Provider failures should degrade to mock/fallback data instead of blocking the app.

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

## What Is Needed From You

Now:

- Review the live UI and comment by area/component.
- Confirm Vercel access once the plugin is configured.

Later:

- Neon connection string.
- Google OAuth credentials for login.
- CoinGecko, Twelve Data, and optional FMP keys after DB-backed CRUD is stable.
- A few real transaction examples to validate input speed and TWR behavior.
