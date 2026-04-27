import assert from "node:assert/strict";
import test from "node:test";

import { fallbackFxRates } from "../lib/data/conversions.ts";
import {
  buildPositionStates,
  calculateCashUsd,
  calculateExternalCashFlowEur,
  calculateNetContributionsUsd,
  type PortfolioMathTransaction
} from "../lib/portfolio/calculations.ts";

const rates = fallbackFxRates;

function tx(overrides: Partial<PortfolioMathTransaction>): PortfolioMathTransaction {
  return {
    id: "tx",
    type: "BUY",
    occurredOn: "2026-01-01",
    createdAt: "2026-01-01T00:00:00.000Z",
    grossAmount: 0,
    currency: "USD",
    fees: 0,
    ...overrides
  };
}

test("cash calculation separates trades from external contributions", () => {
  const cash = calculateCashUsd(
    [
      tx({ id: "deposit", type: "DEPOSIT", grossAmount: 1000 }),
      tx({ id: "buy", type: "BUY", assetId: "asset_btc", quantity: 1, grossAmount: 300, fees: 1 }),
      tx({ id: "sell", type: "SELL", assetId: "asset_btc", quantity: 0.25, grossAmount: 100, fees: 1 }),
      tx({ id: "withdraw", type: "WITHDRAW", grossAmount: 50 })
    ],
    rates
  );

  assert.equal(cash, 748);
});

test("net contributions include deposits and withdrawals only", () => {
  const contributions = calculateNetContributionsUsd(
    [
      tx({ type: "DEPOSIT", grossAmount: 1000 }),
      tx({ type: "BUY", assetId: "asset_btc", quantity: 1, grossAmount: 300 }),
      tx({ type: "SELL", assetId: "asset_btc", quantity: 0.25, grossAmount: 100 }),
      tx({ type: "WITHDRAW", grossAmount: 50 })
    ],
    rates
  );

  assert.equal(contributions, 950);
});

test("same-day buy before sell uses created-at ordering for positions", () => {
  const states = buildPositionStates(
    [
      tx({
        id: "sell",
        type: "SELL",
        assetId: "asset_btc",
        quantity: 4,
        grossAmount: 500,
        createdAt: "2026-01-01T12:00:00.000Z"
      }),
      tx({
        id: "buy",
        type: "BUY",
        assetId: "asset_btc",
        quantity: 10,
        grossAmount: 1000,
        createdAt: "2026-01-01T10:00:00.000Z"
      })
    ],
    rates
  );

  assert.equal(states.get("asset_btc")?.quantity, 6);
  assert.equal(states.get("asset_btc")?.costBasisUsd, 600);
});

test("oversold position state never goes negative", () => {
  const states = buildPositionStates(
    [
      tx({ id: "buy", type: "BUY", assetId: "asset_btc", quantity: 2, grossAmount: 200 }),
      tx({ id: "sell", type: "SELL", assetId: "asset_btc", quantity: 4, grossAmount: 500 })
    ],
    rates
  );

  assert.equal(states.get("asset_btc")?.quantity, 0);
  assert.equal(states.get("asset_btc")?.costBasisUsd, 0);
});

test("external cash flow excludes trades and can be date-scoped", () => {
  const flow = calculateExternalCashFlowEur(
    [
      tx({ type: "DEPOSIT", occurredOn: "2026-01-01", grossAmount: 1000 }),
      tx({ type: "BUY", occurredOn: "2026-01-01", assetId: "asset_btc", quantity: 1, grossAmount: 300 }),
      tx({ type: "WITHDRAW", occurredOn: "2026-01-02", grossAmount: 50 })
    ],
    rates,
    "2026-01-01"
  );

  assert.equal(flow, 928.5);
});
