import assert from "node:assert/strict";
import test from "node:test";

import type { DashboardData } from "../lib/db/portfolio-repository.ts";
import {
  buildPortfolioBackupExport,
  buildPortfolioCsvExport,
  buildPortfolioExport,
  csvSection
} from "../lib/export/portfolio-export.ts";

test("portfolio export includes core sections", () => {
  const exported = buildPortfolioExport(mockDashboardData);
  assert.ok(exported.portfolio);
  assert.ok(exported.positions);
  assert.ok(exported.transactions);
  assert.ok(exported.snapshots);

  assert.equal(exported.portfolio.name, "Personal");
  assert.equal(exported.positions[0].symbol, "BTC");
  assert.equal(exported.transactions[0].type, "BUY");
  assert.equal(exported.snapshots[0].twrPercent, 4.2);
});

test("CSV export escapes notes and sectioned portfolio data", () => {
  const csv = buildPortfolioCsvExport(mockDashboardData);

  assert.match(csv, /Portfolio\n/);
  assert.match(csv, /Transactions\n/);
  assert.match(csv, /'=@bad formula/);
  assert.match(csv, /"Kraken, Pro"/);
});

test("csvSection protects string cells that look like formulas", () => {
  const csv = csvSection("Rows", [{ note: "+SUM(A1:A2)", amount: -42 }]);

  assert.match(csv, /'\+SUM\(A1:A2\)/);
  assert.match(csv, /-42/);
});

test("backup export preserves full restore-oriented records", () => {
  const backup = buildPortfolioBackupExport(mockDashboardData);

  assert.equal(backup.schemaVersion, 1);
  assert.equal(backup.assets[0].id, "asset-1");
  assert.equal(backup.transactions[0].id, "tx-1");
  assert.equal(backup.positions[0].id, "position-1");
  assert.equal(backup.portfolio.id, "portfolio-1");
});

test("portfolio export filters dated sections and selected sections", () => {
  const exported = buildPortfolioExport(mockDashboardData, {
    sections: ["transactions", "snapshots"],
    startDate: "2026-04-20",
    endDate: "2026-04-30"
  });

  assert.equal("portfolio" in exported, false);
  assert.equal("positions" in exported, false);
  assert.equal(Array.isArray(exported.transactions), true);
  assert.equal(Array.isArray(exported.snapshots), true);
  assert.equal((exported.transactions as unknown[]).length, 1);
  assert.equal((exported.snapshots as unknown[]).length, 1);
});

test("CSV export respects selected sections", () => {
  const csv = buildPortfolioCsvExport(mockDashboardData, {
    sections: ["transactions"]
  });

  assert.doesNotMatch(csv, /Portfolio\n/);
  assert.match(csv, /Transactions\n/);
  assert.doesNotMatch(csv, /Positions\n/);
});

const mockDashboardData: DashboardData = {
  persistenceMode: "persistent",
  portfolio: {
    id: "portfolio-1",
    name: "Personal",
    description: "Core",
    baseCurrency: "USD",
    valueEur: 9000,
    valueUsd: 10000,
    twr: 4.2,
    pnlEur: 800,
    dayChangePercent: 0.5,
    netContributionsEur: 8200
  },
  portfolios: [{ id: "portfolio-1", name: "Personal", description: "Core" }],
  assets: [
    {
      id: "asset-1",
      symbol: "BTC",
      name: "Bitcoin",
      type: "CRYPTO",
      currency: "USD",
      provider: "coingecko",
      externalId: "bitcoin",
      priceEur: 90000,
      priceUsd: 100000,
      change24hPercent: 1.2,
      color: "#f59e0b"
    }
  ],
  positions: [
    {
      id: "position-1",
      portfolioId: "portfolio-1",
      assetId: "asset-1",
      quantity: 0.1,
      averageCostEur: 82000,
      marketValueEur: 9000,
      marketValueUsd: 10000,
      pnlEur: 800,
      pnlPercent: 9.75,
      allocationPercent: 100,
      platform: "Kraken, Pro"
    }
  ],
  transactions: [
    {
      id: "tx-1",
      portfolioId: "portfolio-1",
      type: "BUY",
      assetId: "asset-1",
      assetSymbol: "BTC",
      date: "2026-04-27",
      quantity: 0.1,
      grossAmount: 9200,
      currency: "USD",
      fees: 2,
      platform: "Kraken, Pro",
      note: "=@bad formula"
    }
  ],
  manualPositions: [],
  allocations: [{ label: "BTC", value: 9000, percent: 100, color: "#f59e0b" }],
  snapshots: [
    {
      date: "2026-04-27",
      valueEur: 9000,
      valueUsd: 10000,
      investedCapitalEur: 8200,
      cashFlowEur: 0,
      twr: 4.2
    }
  ],
  analyticsSnapshots: [
    {
      date: "2026-04-27",
      valueEur: 9000,
      valueUsd: 10000,
      investedCapitalEur: 8200,
      cashFlowEur: 0,
      twr: 4.2
    }
  ],
  benchmarkReturns: [],
  analyticsHistoryMode: "actual",
  apiStatuses: []
};
