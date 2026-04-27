import type { AssetType, Currency, PriceProvider, TransactionType } from "@/lib/types";

export const demoAssets = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    type: "CRYPTO" as AssetType,
    currency: "USD" as Currency,
    provider: "coingecko" as PriceProvider,
    externalId: "bitcoin",
    color: "#f59e0b",
    price: 84690
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    type: "CRYPTO" as AssetType,
    currency: "USD" as Currency,
    provider: "coingecko" as PriceProvider,
    externalId: "ethereum",
    color: "#64748b",
    price: 3435
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    type: "ETF" as AssetType,
    currency: "USD" as Currency,
    exchange: "NYSEARCA",
    provider: "twelve-data" as PriceProvider,
    externalId: "SPY:NYSEARCA",
    color: "#2563eb",
    price: 512.6
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    type: "STOCK" as AssetType,
    currency: "USD" as Currency,
    exchange: "NASDAQ",
    provider: "twelve-data" as PriceProvider,
    externalId: "NVDA:NASDAQ",
    color: "#65a30d",
    price: 981.62
  }
];

export const demoTransactions = [
  {
    type: "DEPOSIT" as TransactionType,
    occurredOn: "2026-01-03",
    grossAmount: 50000,
    currency: "USD" as Currency,
    fees: 0,
    platform: "Bank",
    note: "Initial funding"
  },
  {
    type: "BUY" as TransactionType,
    symbol: "BTC",
    occurredOn: "2026-01-05",
    quantity: 0.25,
    grossAmount: 17000,
    currency: "USD" as Currency,
    fees: 15,
    platform: "Kraken",
    note: "Initial Bitcoin allocation"
  },
  {
    type: "BUY" as TransactionType,
    symbol: "ETH",
    occurredOn: "2026-01-08",
    quantity: 4,
    grossAmount: 11000,
    currency: "USD" as Currency,
    fees: 10,
    platform: "Kraken",
    note: "Ethereum allocation"
  },
  {
    type: "BUY" as TransactionType,
    symbol: "SPY",
    occurredOn: "2026-01-12",
    quantity: 30,
    grossAmount: 15000,
    currency: "USD" as Currency,
    fees: 1,
    platform: "IBKR",
    note: "S&P 500 core position"
  },
  {
    type: "BUY" as TransactionType,
    symbol: "NVDA",
    occurredOn: "2026-02-10",
    quantity: 5,
    grossAmount: 3900,
    currency: "USD" as Currency,
    fees: 1,
    platform: "IBKR",
    note: "Satellite stock position"
  },
  {
    type: "SELL" as TransactionType,
    symbol: "BTC",
    occurredOn: "2026-03-15",
    quantity: 0.05,
    grossAmount: 4200,
    currency: "USD" as Currency,
    fees: 7,
    platform: "Kraken",
    note: "Trim after rally"
  },
  {
    type: "WITHDRAW" as TransactionType,
    occurredOn: "2026-03-30",
    grossAmount: 3000,
    currency: "USD" as Currency,
    fees: 0,
    platform: "Bank",
    note: "Cash withdrawal"
  }
];
