import assert from "node:assert/strict";
import test from "node:test";

import type { DashboardData } from "../lib/db/portfolio-repository.ts";
import { buildPortfolioDigest } from "../lib/digest/portfolio-digest.ts";
import type { PortfolioNewsItem } from "../lib/types.ts";

test("portfolio digest includes metrics, positions, transactions, and news", () => {
  const digest = buildPortfolioDigest(mockDashboardData, mockNews, {
    baseUrl: "https://foliocore.example"
  });

  assert.match(digest.subject, /Personal/);
  assert.match(digest.text, /Portfolio value/);
  assert.match(digest.text, /open-position P&L/i);
  assert.match(digest.text, /BTC/);
  assert.match(digest.text, /Bitcoin liquidity improves/);
  assert.match(digest.html, /Bitcoin liquidity improves/);
  assert.match(digest.html, /Open-position P&amp;L/);
  assert.match(digest.html, /https:\/\/foliocore\.example\/api\/export\?format=backup-json/);
  assert.ok(digest.highlightCards.length >= 5);
  assert.ok(digest.highlightCards.some((card) => card.label === "Data quality"));
  assert.equal(digest.news.length, 1);
});

test("portfolio digest withholds estimated TWR without persisted snapshots", () => {
  const digest = buildPortfolioDigest({
    ...mockDashboardData,
    portfolio: { ...mockDashboardData.portfolio, twr: 99 },
    snapshots: [],
    analyticsSnapshots: []
  });

  assert.match(digest.text, /Need snapshots/);
  assert.match(digest.html, /Need snapshots/);
  assert.doesNotMatch(digest.text, /\+99\.00%/);
  assert.doesNotMatch(digest.html, /\+99\.00%/);
});

const mockNews: PortfolioNewsItem[] = [
  {
    id: "news-1",
    symbol: "BTC",
    title: "Bitcoin liquidity improves",
    url: "https://example.com/btc",
    source: "Example",
    publishedAt: "2026-04-27T10:00:00.000Z",
    summary: "BTC appeared in recent coverage.",
    provider: "rss",
    sourceType: "crypto-rss",
    confidence: 90,
    reason: "Matched BTC."
  }
];

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
      platform: "Kraken"
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
      fees: 2
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
