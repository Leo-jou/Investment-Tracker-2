# FolioCore Investment Tracker

A self-hostable personal portfolio tracker MVP focused on fast manual input, correct performance metrics, modular UI, and low-cost deployment on Vercel + Neon.

## Architecture

- **Next.js App Router + TypeScript** for the web app and API routes.
- **Tailwind CSS + shadcn-style components** for a compact, TradingView-inspired UI surface.
- **Recharts** for portfolio value, TWR, and allocation charts.
- **Drizzle ORM + Neon Postgres** schema ready for users, portfolios, assets, transactions, manual positions, price snapshots, FX snapshots, and portfolio snapshots.
- **DB-backed MVP flows** for login bootstrap, dashboard data, transactions, manual positions, asset search enrichment, deletion, and portfolio snapshot refresh.
- **Mock-first provider seams** for asset search, prices, FX, snapshots, and portfolio metrics. API keys can be added without changing the UI surface.

## Assumptions

- MVP starts with email login and an allowlist, with schema prepared for multiple users later.
- Manual transaction entry is the primary workflow. Broker/wallet sync is intentionally out of scope.
- USD is the default display currency, with an EUR toggle backed by FX snapshots.
- Time-weighted return is the primary performance metric; deposits and withdrawals are capital flows, not gains or losses.
- External asset search is dynamic and provider-backed when API keys exist, otherwise mock-backed.

## Current MVP Status

- Production is deployed on Vercel at `https://foliocore.vercel.app`.
- Neon-backed first-run workspace bootstrap creates a Personal portfolio, demo assets, demo transactions, price/FX snapshots, and a manual SpaceX-style position.
- Quick add supports BUY, SELL, DEPOSIT, WITHDRAW, and MANUAL entries with type-specific fields.
- BUY/SELL can auto-calculate total from quantity or quantity from total using a live quote fetched on explicit asset selection.
- Transactions and manual positions can be edited inline and deleted from the UI with browser confirmation.
- Price refresh can fetch CoinGecko crypto prices, Twelve Data stock/ETF prices, and Twelve Data EUR/USD FX, then persist snapshots and recalculate the current portfolio snapshot.
- Google OAuth is wired through Auth.js and configured in production; the existing email allowlist login remains as fallback.
- Transfers are intentionally disabled in quick add until paired multi-portfolio transfer support exists.
- Focused tests cover TWR cash-flow neutrality, cash/contribution separation, same-day trade ordering, edit-time sell quantity recalculation, provider price normalization, and oversell-safe position state.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Run verification before deployment:

```bash
npm run lint
npm test
npm run build
```

Run the read-only production smoke test after deployment:

```bash
npm run smoke:prod
```

It checks `/login`, protected-route redirects, API login, authenticated transactions JSON, and dashboard rendering. It uses `SMOKE_BASE_URL` when set, otherwise `https://foliocore.vercel.app`, and uses `SMOKE_EMAIL` or the first email in `APP_ALLOWED_EMAILS`.

To include the snapshot-writing price refresh endpoint in the smoke test:

```bash
SMOKE_REFRESH=1 npm run smoke:prod
```

To also verify live quote lookup:

```bash
SMOKE_QUOTE=1 npm run smoke:prod
```

## Environment

Copy `.env.example` to `.env.local` when connecting real services. Without API keys or a database URL, the app uses mock data.

Required production variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_ALLOWED_EMAILS`

Google OAuth variables:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_URL`

Register these redirect URIs in Google Cloud OAuth:

- `https://foliocore.vercel.app/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/google`

Optional provider variables:

- `COINGECKO_DEMO_API_KEY`
- `TWELVE_DATA_API_KEY`
- `FMP_API_KEY`

Do not commit local secret files. `.env*`, `.vercel`, `env.txt`, and local Google auth scratch files are ignored.

## Project Memory

This repo uses `context.md` as a lightweight project-memory file for future Codex sessions. It keeps the latest useful product context, technical decisions, implementation status, known issues, UX notes, open questions, and next recommended steps in one concise place.

Codex should read `context.md` before implementation work and update it after meaningful changes. Keep it curated: summarize decisions, bugs, and next steps instead of pasting raw logs, diffs, or every commit. If `context.md` conflicts with the actual code, trust the code and update `context.md`.

`AGENTS.md` is the durable instruction file for engineering rules and Codex behavior. Keep long-lived instructions there, not in `context.md`.

Refresh generated context sections with:

```bash
npm run context:update
```

Check whether generated sections are current with:

```bash
npm run context:check
```

The update script is deterministic and low-maintenance. It inspects recent git history when a Git repository is available, scans TODO/FIXME comments, updates bounded generated blocks, and preserves manually curated product and technical decisions.

Recommended workflow: update `context.md` before ending each meaningful work session, and also after important Codex tasks that change project direction or implementation status. This rule is recorded in `AGENTS.md` so future Codex sessions should follow it automatically after reading the repo instructions.

Avoid hourly scheduled updates because they are likely to create noise without adding durable context. Use the manual GitHub Action only when you want an explicit repository-side refresh outside a local Codex session.
