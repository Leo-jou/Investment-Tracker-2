import assert from "node:assert/strict";
import test from "node:test";

import type { DashboardData } from "../lib/db/portfolio-repository.ts";
import { getPortfolioNews } from "../lib/news/portfolio-news.ts";

test("portfolio news does not call GDELT unless explicitly enabled", async () => {
  const originalFetch = globalThis.fetch;
  const originalGdelt = process.env.NEWS_GDELT_ENABLED;
  const requestedUrls: string[] = [];

  try {
    delete process.env.NEWS_GDELT_ENABLED;
    globalThis.fetch = (async (input: string | URL | Request) => {
      requestedUrls.push(String(input));
      return emptyRssResponse();
    }) as typeof fetch;

    await getPortfolioNews(mockDashboardData);

    assert.ok(requestedUrls.length > 0);
    assert.ok(requestedUrls.every((url) => !url.includes("gdeltproject.org")));
  } finally {
    restoreEnv("NEWS_GDELT_ENABLED", originalGdelt);
    globalThis.fetch = originalFetch;
  }
});

test("portfolio news accepts enabled GDELT articles only from trusted HTTPS domains", async () => {
  const originalFetch = globalThis.fetch;
  const originalGdelt = process.env.NEWS_GDELT_ENABLED;

  try {
    process.env.NEWS_GDELT_ENABLED = "true";
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input);
      if (!url.includes("gdeltproject.org")) return emptyRssResponse();

      return new Response(
        JSON.stringify({
          articles: [
            {
              url: "https://www.reuters.com/markets/bitcoin-liquidity",
              title: "Bitcoin liquidity improves",
              domain: "reuters.com",
              seendate: "20260427T120000Z"
            },
            {
              url: "https://example.com/bitcoin-liquidity",
              title: "Bitcoin liquidity improves on unsupported blog",
              domain: "example.com",
              seendate: "20260427T120000Z"
            },
            {
              url: "http://www.reuters.com/markets/bitcoin-plain-http",
              title: "Bitcoin plain HTTP link",
              domain: "reuters.com",
              seendate: "20260427T120000Z"
            }
          ]
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const news = await getPortfolioNews(mockDashboardData);

    assert.equal(news.length, 1);
    assert.equal(news[0].provider, "gdelt");
    assert.equal(news[0].source, "reuters.com");
    assert.equal(news[0].url, "https://www.reuters.com/markets/bitcoin-liquidity");
  } finally {
    restoreEnv("NEWS_GDELT_ENABLED", originalGdelt);
    globalThis.fetch = originalFetch;
  }
});

test("portfolio news reads trusted RSS feeds and scores relevant holdings", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      new Response(
        `<?xml version="1.0"?>
        <rss><channel>
          <item>
            <title>Bitcoin liquidity improves as ETF flows recover</title>
            <link>https://example.com/rss-bitcoin</link>
            <pubDate>Mon, 27 Apr 2026 12:00:00 GMT</pubDate>
            <description>Bitcoin market structure improved during the session.</description>
          </item>
          <item>
            <title>Unrelated retail story</title>
            <link>https://example.com/rss-retail</link>
            <pubDate>Mon, 27 Apr 2026 11:00:00 GMT</pubDate>
            <description>No portfolio asset mentioned.</description>
          </item>
        </channel></rss>`,
        { status: 200, headers: { "content-type": "application/xml" } }
      )) as typeof fetch;

    const news = await getPortfolioNews(mockDashboardData);

    assert.ok(news.length >= 1);
    assert.equal(news[0].provider, "rss");
    assert.equal(news[0].symbol, "BTC");
    assert.match(news[0].reason, /Matched BTC/);
    assert.ok(news.every((item) => !item.title.includes("Unrelated retail")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("portfolio news rejects plain HTTP RSS links", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      new Response(
        `<?xml version="1.0"?>
        <rss><channel>
          <item>
            <title>Bitcoin liquidity improves</title>
            <link>http://example.com/rss-bitcoin</link>
            <pubDate>Mon, 27 Apr 2026 12:00:00 GMT</pubDate>
          </item>
        </channel></rss>`,
        { status: 200, headers: { "content-type": "application/xml" } }
      )) as typeof fetch;

    const news = await getPortfolioNews(mockDashboardData);

    assert.equal(news.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("portfolio news does not leak manual-position labels into third-party queries", async () => {
  const originalFetch = globalThis.fetch;
  const originalGdelt = process.env.NEWS_GDELT_ENABLED;
  const requestedUrls: string[] = [];

  try {
    delete process.env.NEWS_GDELT_ENABLED;
    globalThis.fetch = (async (input: string | URL | Request) => {
      requestedUrls.push(String(input));
      return emptyRssResponse();
    }) as typeof fetch;

    await getPortfolioNews({
      ...mockDashboardData,
      positions: [],
      assets: [],
      manualPositions: [
        {
          id: "manual-1",
          portfolioId: "portfolio-1",
          label: "SpaceX fundraising participation",
          valueEur: 4500,
          valueUsd: 5000,
          currency: "USD",
          updatedAt: "2026-04-01"
        }
      ]
    });

    assert.ok(requestedUrls.every((url) => !/spacex|fundraising/i.test(url)));
  } finally {
    restoreEnv("NEWS_GDELT_ENABLED", originalGdelt);
    globalThis.fetch = originalFetch;
  }
});

test("portfolio news matches ticker terms on word boundaries", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      new Response(
        `<?xml version="1.0"?>
        <rss><channel>
          <item>
            <title>Bitcoin liquidity improves</title>
            <link>https://example.com/rss-bitcoin</link>
            <pubDate>Mon, 27 Apr 2026 12:00:00 GMT</pubDate>
          </item>
        </channel></rss>`,
        { status: 200, headers: { "content-type": "application/xml" } }
      )) as typeof fetch;

    const news = await getPortfolioNews(coinDashboardData);

    assert.equal(news.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("portfolio news diversifies repeated headlines across covered holdings", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("NVDA") || url.includes("nvda")) {
        return rssResponse([
          ["NVIDIA shares rise after data center update", "https://example.com/nvda-news"]
        ]);
      }

      return rssResponse([
        ["Bitcoin liquidity improves", "https://example.com/rss-bitcoin-a"],
        ["Bitcoin liquidity improves", "https://example.com/rss-bitcoin-b"],
        ["Bitcoin whale holdings climb", "https://example.com/rss-bitcoin-c"]
      ]);
    }) as typeof fetch;

    const news = await getPortfolioNews(multiAssetDashboardData);

    assert.ok(news.some((item) => item.symbol === "BTC"));
    assert.ok(news.some((item) => item.symbol === "NVDA"));
    assert.ok(news.filter((item) => item.title === "Bitcoin liquidity improves").length <= 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function rssResponse(items: Array<[title: string, url: string]>) {
  return new Response(
    `<?xml version="1.0"?><rss><channel>${items
      .map(
        ([title, url]) => `<item>
          <title>${title}</title>
          <link>${url}</link>
          <pubDate>Mon, 27 Apr 2026 12:00:00 GMT</pubDate>
        </item>`
      )
      .join("")}</channel></rss>`,
    { status: 200, headers: { "content-type": "application/xml" } }
  );
}

function emptyRssResponse() {
  return new Response("<rss><channel /></rss>", {
    status: 200,
    headers: { "content-type": "application/xml" }
  });
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

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
  analyticsSnapshots: [],
  benchmarkReturns: [],
  analyticsHistoryMode: "actual",
  apiStatuses: []
};

const coinDashboardData: DashboardData = {
  ...mockDashboardData,
  assets: [
    {
      ...mockDashboardData.assets[0],
      id: "asset-coin",
      symbol: "COIN",
      name: "Coinbase Global",
      type: "STOCK",
      provider: "twelve-data",
      externalId: "COIN",
      color: "#2563eb"
    }
  ],
  positions: [
    {
      ...mockDashboardData.positions[0],
      assetId: "asset-coin"
    }
  ],
  allocations: [{ label: "COIN", value: 9000, percent: 100, color: "#2563eb" }]
};

const multiAssetDashboardData: DashboardData = {
  ...mockDashboardData,
  assets: [
    ...mockDashboardData.assets,
    {
      id: "asset-nvda",
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      type: "STOCK",
      currency: "USD",
      provider: "twelve-data",
      externalId: "NVDA",
      priceEur: 800,
      priceUsd: 900,
      change24hPercent: 0.4,
      color: "#22c55e"
    }
  ],
  positions: [
    ...mockDashboardData.positions,
    {
      id: "position-nvda",
      portfolioId: "portfolio-1",
      assetId: "asset-nvda",
      quantity: 3,
      averageCostEur: 700,
      marketValueEur: 2400,
      marketValueUsd: 2700,
      pnlEur: 300,
      pnlPercent: 14.2,
      allocationPercent: 23
    }
  ],
  allocations: [
    { label: "BTC", value: 9000, percent: 77, color: "#f59e0b" },
    { label: "NVDA", value: 2400, percent: 23, color: "#22c55e" }
  ]
};
