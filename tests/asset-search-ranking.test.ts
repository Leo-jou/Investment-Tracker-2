import assert from "node:assert/strict";
import test from "node:test";

import {
  getCuratedSearchResults,
  rankAssetSearchResults
} from "../lib/pricing/search-ranking.ts";
import type { AssetSearchResult } from "../lib/types.ts";

function result(overrides: Partial<AssetSearchResult>): AssetSearchResult {
  return {
    symbol: "BTC",
    name: "Bitcoin",
    type: "CRYPTO",
    currency: "USD",
    provider: "coingecko",
    externalId: "bitcoin",
    ...overrides
  };
}

test("ranking prefers exact Twelve Data ETFs over tokenized CoinGecko securities", () => {
  const ranked = rankAssetSearchResults("VOO", [
    result({
      symbol: "NVOON",
      name: "Backed NVIDIA Tokenized Stock",
      provider: "coingecko",
      externalId: "nvoon"
    }),
    result({
      symbol: "VOO",
      name: "Vanguard S&P 500 ETF",
      type: "ETF",
      provider: "twelve-data",
      externalId: "VOO:NYSE ARCA",
      exchange: "NYSE ARCA"
    })
  ]);

  assert.equal(ranked[0].provider, "twelve-data");
  assert.equal(ranked[0].symbol, "VOO");
});

test("S&P 500 semantic search returns tradable ETF aliases before provider fallbacks", async () => {
  const results = rankAssetSearchResults("S&P 500", getCuratedSearchResults("S&P 500"));
  assert.equal(results[0].symbol, "SPY");
  assert.equal(results[0].provider, "twelve-data");
  assert.equal(results[0].type, "ETF");
  assert.ok(results.slice(0, 4).some((asset) => asset.symbol === "VOO"));
});

test("gold semantic search returns spot gold before unrelated equities", async () => {
  const results = rankAssetSearchResults("XAU", [
    ...getCuratedSearchResults("XAU"),
    result({
      symbol: "XAU",
      name: "GoldMoney Inc.",
      type: "STOCK",
      provider: "twelve-data",
      externalId: "XAU:TSX",
      exchange: "TSX"
    })
  ]);
  assert.equal(results[0].symbol, "XAU/USD");
  assert.equal(results[0].provider, "twelve-data");
  assert.equal(results[0].type, "COMMODITY");
});
