import assert from "node:assert/strict";
import test from "node:test";

import type { DashboardData } from "../lib/db/portfolio-repository.ts";
import { getPortfolioNews } from "../lib/news/portfolio-news.ts";

test("portfolio news accepts safe provider URLs", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          articles: [
            {
              url: "https://example.com/bitcoin-liquidity",
              title: "Bitcoin liquidity improves",
              domain: "example.com",
              seendate: "20260427T120000Z"
            }
          ]
        }),
        { status: 200 }
      )) as typeof fetch;

    const news = await getPortfolioNews(mockDashboardData);

    assert.equal(news[0].provider, "gdelt");
    assert.equal(news[0].url, "https://example.com/bitcoin-liquidity");
    assert.equal(news[0].symbol, "BTC");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("portfolio news filters unsafe provider URLs and falls back", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          articles: [
            {
              url: "javascript:alert(1)",
              title: "Bitcoin liquidity improves",
              domain: "example.com",
              seendate: "20260427T120000Z"
            }
          ]
        }),
        { status: 200 }
      )) as typeof fetch;

    const news = await getPortfolioNews(mockDashboardData);

    assert.equal(news[0].provider, "local");
    assert.ok(news.every((item) => item.url.startsWith("https://")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

const mockDashboardData: DashboardData = {
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
  transactions: [],
  manualPositions: [],
  allocations: [{ label: "BTC", value: 9000, percent: 100, color: "#f59e0b" }],
  snapshots: [],
  apiStatuses: []
};
