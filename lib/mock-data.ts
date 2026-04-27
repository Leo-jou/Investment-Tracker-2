import type {
  AllocationSlice,
  ApiStatus,
  Asset,
  AssetSearchResult,
  ManualPosition,
  Portfolio,
  PortfolioSnapshot,
  Position,
  Transaction,
  User
} from "@/lib/types";

export const mockUser: User = {
  id: "user_1",
  name: process.env.APP_USER_NAME ?? "Leo",
  email: process.env.APP_USER_EMAIL ?? "leo@example.com"
};

export const assets: Asset[] = [
  {
    id: "asset_btc",
    symbol: "BTC",
    name: "Bitcoin",
    type: "CRYPTO",
    currency: "USD",
    provider: "coingecko",
    externalId: "bitcoin",
    priceEur: 78640,
    priceUsd: 84690,
    change24hPercent: 1.8,
    color: "#f59e0b"
  },
  {
    id: "asset_eth",
    symbol: "ETH",
    name: "Ethereum",
    type: "CRYPTO",
    currency: "USD",
    provider: "coingecko",
    externalId: "ethereum",
    priceEur: 3190,
    priceUsd: 3435,
    change24hPercent: -0.7,
    color: "#64748b"
  },
  {
    id: "asset_vwce",
    symbol: "VWCE",
    name: "Vanguard FTSE All-World UCITS ETF",
    type: "ETF",
    currency: "EUR",
    exchange: "XETRA",
    provider: "twelve-data",
    externalId: "VWCE:XETRA",
    priceEur: 124.72,
    priceUsd: 134.32,
    change24hPercent: 0.2,
    color: "#2563eb"
  },
  {
    id: "asset_msft",
    symbol: "MSFT",
    name: "Microsoft Corporation",
    type: "STOCK",
    currency: "USD",
    exchange: "NASDAQ",
    provider: "twelve-data",
    externalId: "MSFT:NASDAQ",
    priceEur: 392.8,
    priceUsd: 423,
    change24hPercent: 0.9,
    color: "#16a34a"
  },
  {
    id: "asset_nvda",
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    type: "STOCK",
    currency: "USD",
    exchange: "NASDAQ",
    provider: "twelve-data",
    externalId: "NVDA:NASDAQ",
    priceEur: 911.5,
    priceUsd: 981.62,
    change24hPercent: 2.4,
    color: "#65a30d"
  },
  {
    id: "asset_gold",
    symbol: "XAU",
    name: "Gold Spot",
    type: "COMMODITY",
    currency: "USD",
    provider: "twelve-data",
    externalId: "XAU/USD",
    priceEur: 2168,
    priceUsd: 2335,
    change24hPercent: -0.1,
    color: "#d97706"
  },
  {
    id: "asset_cash_eur",
    symbol: "EUR",
    name: "Euro Cash",
    type: "CASH",
    currency: "EUR",
    provider: "manual",
    externalId: "EUR",
    priceEur: 1,
    priceUsd: 1.077,
    change24hPercent: 0,
    color: "#14b8a6"
  }
];

export const portfolios: Portfolio[] = [
  {
    id: "portfolio_personal",
    name: "Personal",
    description: "Core long-term investing",
    baseCurrency: "USD",
    valueEur: 126415,
    valueUsd: 136143,
    twr: 18.42,
    pnlEur: 29464,
    dayChangePercent: 0.74,
    netContributionsEur: 96951
  }
];

export const positions: Position[] = [
  {
    id: "pos_1",
    portfolioId: "portfolio_personal",
    assetId: "asset_vwce",
    quantity: 520,
    averageCostEur: 101.42,
    marketValueEur: 64854,
    marketValueUsd: 69846,
    pnlEur: 12115,
    pnlPercent: 22.97,
    allocationPercent: 35.2,
    platform: "Interactive Brokers"
  },
  {
    id: "pos_2",
    portfolioId: "portfolio_personal",
    assetId: "asset_btc",
    quantity: 0.42,
    averageCostEur: 49800,
    marketValueEur: 33029,
    marketValueUsd: 35572,
    pnlEur: 12113,
    pnlPercent: 57.91,
    allocationPercent: 17.9,
    platform: "Kraken"
  },
  {
    id: "pos_3",
    portfolioId: "portfolio_short",
    assetId: "asset_nvda",
    quantity: 18,
    averageCostEur: 674.3,
    marketValueEur: 16407,
    marketValueUsd: 17670,
    pnlEur: 4268,
    pnlPercent: 35.16,
    allocationPercent: 8.9,
    platform: "Trading 212"
  },
  {
    id: "pos_4",
    portfolioId: "portfolio_company",
    assetId: "asset_msft",
    quantity: 42,
    averageCostEur: 321.9,
    marketValueEur: 16498,
    marketValueUsd: 17768,
    pnlEur: 2978,
    pnlPercent: 22.03,
    allocationPercent: 9,
    platform: "Interactive Brokers"
  },
  {
    id: "pos_5",
    portfolioId: "portfolio_personal",
    assetId: "asset_eth",
    quantity: 6.8,
    averageCostEur: 2420,
    marketValueEur: 21692,
    marketValueUsd: 23362,
    pnlEur: 5236,
    pnlPercent: 31.82,
    allocationPercent: 11.8,
    platform: "Kraken"
  },
  {
    id: "pos_6",
    portfolioId: "portfolio_company",
    assetId: "asset_gold",
    quantity: 7.6,
    averageCostEur: 1908,
    marketValueEur: 16477,
    marketValueUsd: 17745,
    pnlEur: 1976,
    pnlPercent: 13.63,
    allocationPercent: 8.9,
    platform: "Manual"
  },
  {
    id: "pos_7",
    portfolioId: "portfolio_company",
    assetId: "asset_cash_eur",
    quantity: 9725,
    averageCostEur: 1,
    marketValueEur: 9725,
    marketValueUsd: 10474,
    pnlEur: 0,
    pnlPercent: 0,
    allocationPercent: 5.3,
    platform: "Bank"
  }
];

export const manualPositions: ManualPosition[] = [
  {
    id: "manual_1",
    portfolioId: "portfolio_personal",
    label: "Crowdfunding notes",
    valueEur: 6840,
    valueUsd: 7367,
    currency: "EUR",
    updatedAt: "2026-04-25"
  },
  {
    id: "manual_2",
    portfolioId: "portfolio_short",
    label: "Private AI angel allocation",
    valueEur: 10343,
    valueUsd: 11139,
    currency: "EUR",
    updatedAt: "2026-04-18"
  }
];

export const transactions: Transaction[] = [
  {
    id: "tx_1",
    portfolioId: "portfolio_personal",
    type: "BUY",
    assetId: "asset_btc",
    assetSymbol: "BTC",
    date: "2026-04-22",
    quantity: 0.035,
    grossAmount: 2690,
    currency: "EUR",
    fees: 7.2,
    note: "Monthly crypto DCA",
    platform: "Kraken"
  },
  {
    id: "tx_2",
    portfolioId: "portfolio_personal",
    type: "BUY",
    assetId: "asset_vwce",
    assetSymbol: "VWCE",
    date: "2026-04-18",
    quantity: 24,
    grossAmount: 2989,
    currency: "EUR",
    fees: 1.25,
    note: "ETF contribution",
    platform: "Interactive Brokers"
  },
  {
    id: "tx_3",
    portfolioId: "portfolio_company",
    type: "DEPOSIT",
    date: "2026-04-08",
    grossAmount: 8000,
    currency: "EUR",
    fees: 0,
    note: "Treasury allocation",
    platform: "Bank"
  },
  {
    id: "tx_4",
    portfolioId: "portfolio_short",
    type: "SELL",
    assetId: "asset_nvda",
    assetSymbol: "NVDA",
    date: "2026-03-30",
    quantity: 4,
    grossAmount: 3530,
    currency: "EUR",
    fees: 2.1,
    note: "Trimmed after run-up",
    platform: "Trading 212"
  },
  {
    id: "tx_5",
    portfolioId: "portfolio_short",
    type: "TRANSFER_IN",
    date: "2026-03-27",
    grossAmount: 5000,
    currency: "EUR",
    fees: 0,
    note: "From Personal",
    platform: "Internal"
  },
  {
    id: "tx_6",
    portfolioId: "portfolio_personal",
    type: "MANUAL_VALUE",
    date: "2026-03-22",
    grossAmount: 6840,
    currency: "EUR",
    fees: 0,
    note: "Crowdfunding notes valuation",
    platform: "Manual"
  }
];

export const portfolioSnapshots: PortfolioSnapshot[] = [
  { date: "2025-10-01", valueEur: 127800, valueUsd: 137641, investedCapitalEur: 118400, cashFlowEur: 0, twr: 0 },
  { date: "2025-11-01", valueEur: 132900, valueUsd: 143133, investedCapitalEur: 120900, cashFlowEur: 2500, twr: 2.01 },
  { date: "2025-12-01", valueEur: 139450, valueUsd: 150187, investedCapitalEur: 124900, cashFlowEur: 4000, twr: 3.82 },
  { date: "2026-01-01", valueEur: 151220, valueUsd: 162864, investedCapitalEur: 132200, cashFlowEur: 7300, twr: 7.92 },
  { date: "2026-02-01", valueEur: 158930, valueUsd: 171167, investedCapitalEur: 135700, cashFlowEur: 3500, twr: 10.88 },
  { date: "2026-03-01", valueEur: 171480, valueUsd: 184684, investedCapitalEur: 139200, cashFlowEur: 3500, twr: 15.62 },
  { date: "2026-04-01", valueEur: 177120, valueUsd: 190758, investedCapitalEur: 141200, cashFlowEur: 2000, twr: 16.91 },
  { date: "2026-04-27", valueEur: 184260, valueUsd: 198442, investedCapitalEur: 141200, cashFlowEur: 0, twr: 18.42 }
];

export const allocationByAsset: AllocationSlice[] = [
  { label: "VWCE", value: 64854, percent: 35.2, color: "#2563eb" },
  { label: "BTC", value: 33029, percent: 17.9, color: "#f59e0b" },
  { label: "ETH", value: 21692, percent: 11.8, color: "#64748b" },
  { label: "MSFT", value: 16498, percent: 9, color: "#16a34a" },
  { label: "NVDA", value: 16407, percent: 8.9, color: "#65a30d" },
  { label: "Gold", value: 16477, percent: 8.9, color: "#d97706" },
  { label: "Manual/Cash", value: 15303, percent: 8.3, color: "#14b8a6" }
];

export const mockAssetSearchResults: AssetSearchResult[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    type: "CRYPTO",
    currency: "USD",
    provider: "coingecko",
    externalId: "bitcoin",
    priceEur: 78640,
    priceUsd: 84690
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    type: "CRYPTO",
    currency: "USD",
    provider: "coingecko",
    externalId: "ethereum",
    priceEur: 3190,
    priceUsd: 3435
  },
  {
    symbol: "VWCE",
    name: "Vanguard FTSE All-World UCITS ETF",
    type: "ETF",
    exchange: "XETRA",
    currency: "EUR",
    provider: "twelve-data",
    externalId: "VWCE:XETRA",
    priceEur: 124.72,
    priceUsd: 134.32
  },
  {
    symbol: "CSPX",
    name: "iShares Core S&P 500 UCITS ETF",
    type: "ETF",
    exchange: "LSE",
    currency: "USD",
    provider: "twelve-data",
    externalId: "CSPX:LSE",
    priceEur: 489.6,
    priceUsd: 527.24
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "STOCK",
    exchange: "NASDAQ",
    currency: "USD",
    provider: "twelve-data",
    externalId: "AAPL:NASDAQ",
    priceEur: 158.48,
    priceUsd: 170.66
  },
  {
    symbol: "XAU",
    name: "Gold Spot",
    type: "COMMODITY",
    currency: "USD",
    provider: "twelve-data",
    externalId: "XAU/USD",
    priceEur: 2168,
    priceUsd: 2335
  }
];

export const apiStatuses: ApiStatus[] = [
  {
    provider: "CoinGecko",
    configured: Boolean(process.env.COINGECKO_DEMO_API_KEY),
    purpose: "Crypto search and prices"
  },
  {
    provider: "Twelve Data",
    configured: Boolean(process.env.TWELVE_DATA_API_KEY),
    purpose: "Stocks, ETFs, commodities, FX"
  },
  {
    provider: "Financial Modeling Prep",
    configured: Boolean(process.env.FMP_API_KEY),
    purpose: "Optional fallback and enrichment"
  },
  {
    provider: "Neon Postgres",
    configured: Boolean(process.env.DATABASE_URL),
    purpose: "Persistent app data"
  }
];

export function getAssetById(id: string) {
  return assets.find((asset) => asset.id === id);
}

export function getPortfolioById(id: string) {
  return portfolios.find((portfolio) => portfolio.id === id);
}

export function getPositionsForPortfolio(portfolioId: string) {
  if (portfolioId === "portfolio_global") return positions;
  return positions.filter((position) => position.portfolioId === portfolioId);
}

export function getTransactionsForPortfolio(portfolioId: string) {
  if (portfolioId === "portfolio_global") return transactions;
  return transactions.filter((transaction) => transaction.portfolioId === portfolioId);
}

export function getManualPositionsForPortfolio(portfolioId: string) {
  if (portfolioId === "portfolio_global") return manualPositions;
  return manualPositions.filter((position) => position.portfolioId === portfolioId);
}
