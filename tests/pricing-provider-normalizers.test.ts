import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeCoinGeckoPrice,
  normalizeTwelveDataQuote
} from "../lib/pricing/provider-normalizers.ts";

const capturedAt = new Date("2026-04-27T12:00:00.000Z");

test("CoinGecko normalization prefers the asset native EUR price", () => {
  const snapshot = normalizeCoinGeckoPrice(
    {
      id: "asset-eur",
      provider: "coingecko",
      currency: "EUR"
    },
    {
      usd: 100,
      eur: 92
    },
    capturedAt
  );

  assert.deepEqual(snapshot, {
    assetId: "asset-eur",
    provider: "coingecko",
    price: 92,
    currency: "EUR",
    capturedAt
  });
});

test("CoinGecko normalization falls back to USD for USD assets", () => {
  const snapshot = normalizeCoinGeckoPrice(
    {
      id: "asset-usd",
      provider: "coingecko",
      currency: "USD"
    },
    {
      usd: 100,
      eur: 92
    },
    capturedAt
  );

  assert.equal(snapshot?.price, 100);
  assert.equal(snapshot?.currency, "USD");
});

test("CoinGecko normalization rejects missing or invalid prices", () => {
  assert.equal(
    normalizeCoinGeckoPrice(
      {
        id: "asset-bad",
        provider: "coingecko",
        currency: "USD"
      },
      {
        usd: 0
      },
      capturedAt
    ),
    null
  );
});

test("Twelve Data normalization uses provider currency when supported", () => {
  const snapshot = normalizeTwelveDataQuote(
    {
      id: "asset-spy",
      provider: "twelve-data",
      currency: "USD"
    },
    {
      close: "512.45",
      currency: "EUR"
    },
    capturedAt
  );

  assert.equal(snapshot?.price, 512.45);
  assert.equal(snapshot?.currency, "EUR");
});

test("Twelve Data normalization rejects non-positive close values", () => {
  assert.equal(
    normalizeTwelveDataQuote(
      {
        id: "asset-spy",
        provider: "twelve-data",
        currency: "USD"
      },
      {
        close: "0",
        currency: "USD"
      },
      capturedAt
    ),
    null
  );
});
