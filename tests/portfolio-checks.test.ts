import assert from "node:assert/strict";
import test from "node:test";

import { buildPortfolioChecks } from "../lib/portfolio/checks.ts";
import type { Asset, ManualPosition, PortfolioSnapshot, Position } from "../lib/types.ts";

test("portfolio checks detect concentration and missing platforms", () => {
  const checks = buildPortfolioChecks({
    positions,
    assets,
    manualPositions: [],
    snapshots,
    now: new Date("2026-04-28T12:00:00.000Z")
  });

  assert.ok(checks.some((check) => check.id === "concentration"));
  assert.ok(checks.some((check) => check.id === "missing-platforms"));
});

test("portfolio checks detect stale snapshots and stale manual values", () => {
  const checks = buildPortfolioChecks({
    positions: [],
    assets,
    manualPositions,
    snapshots: [snapshots[0]],
    now: new Date("2026-04-28T12:00:00.000Z")
  });

  assert.ok(checks.some((check) => check.id === "insufficient-snapshots"));
  assert.ok(checks.some((check) => check.id === "stale-snapshot"));
  assert.ok(checks.some((check) => check.id === "manual-stale"));
});

const assets: Asset[] = [
  {
    id: "asset-btc",
    symbol: "BTC",
    name: "Bitcoin",
    type: "CRYPTO",
    currency: "USD",
    provider: "coingecko",
    externalId: "bitcoin",
    priceEur: 90_000,
    priceUsd: 100_000,
    change24hPercent: 1,
    color: "#f59e0b"
  },
  {
    id: "asset-spy",
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    type: "ETF",
    currency: "USD",
    provider: "twelve-data",
    externalId: "SPY",
    priceEur: 420,
    priceUsd: 450,
    change24hPercent: 0.2,
    color: "#2563eb"
  }
];

const positions: Position[] = [
  {
    id: "position-btc",
    portfolioId: "portfolio",
    assetId: "asset-btc",
    quantity: 1,
    averageCostEur: 60_000,
    marketValueEur: 90_000,
    marketValueUsd: 100_000,
    pnlEur: 30_000,
    pnlPercent: 50,
    allocationPercent: 72,
    platforms: ["Kraken"]
  },
  {
    id: "position-spy",
    portfolioId: "portfolio",
    assetId: "asset-spy",
    quantity: 10,
    averageCostEur: 400,
    marketValueEur: 4_200,
    marketValueUsd: 4_500,
    pnlEur: 200,
    pnlPercent: 5,
    allocationPercent: 28
  }
];

const manualPositions: ManualPosition[] = [
  {
    id: "manual-1",
    portfolioId: "portfolio",
    label: "Private investment",
    valueEur: 5_000,
    valueUsd: 5_500,
    currency: "USD",
    updatedAt: "2026-02-01"
  }
];

const snapshots: PortfolioSnapshot[] = [
  {
    date: "2026-04-01",
    valueEur: 90_000,
    valueUsd: 100_000,
    investedCapitalEur: 70_000,
    cashFlowEur: 0,
    twr: 4
  },
  {
    date: "2026-04-27",
    valueEur: 94_000,
    valueUsd: 104_000,
    investedCapitalEur: 70_000,
    cashFlowEur: 0,
    twr: 6
  }
];
