export type Currency = "EUR" | "USD";

export type AssetType =
  | "CRYPTO"
  | "STOCK"
  | "ETF"
  | "COMMODITY"
  | "CASH"
  | "MANUAL";

export type TransactionType =
  | "BUY"
  | "SELL"
  | "DEPOSIT"
  | "WITHDRAW"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "MANUAL_VALUE"
  | "CASH_ADJUSTMENT";

export type PriceProvider = "coingecko" | "twelve-data" | "fmp" | "manual" | "mock";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type UserPreferences = {
  defaultCurrency: Currency;
  dailySnapshotsEnabled: boolean;
  backupEmailEnabled: boolean;
  backupEmail?: string;
  dailyExportEnabled: boolean;
};

export type Portfolio = {
  id: string;
  name: string;
  description: string;
  baseCurrency: Currency;
  valueEur: number;
  valueUsd: number;
  twr: number;
  pnlEur: number;
  dayChangePercent: number;
  netContributionsEur: number;
};

export type PortfolioOption = {
  id: string;
  name: string;
  description: string;
};

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  currency: Currency;
  exchange?: string;
  provider: PriceProvider;
  externalId: string;
  priceEur: number;
  priceUsd: number;
  change24hPercent: number;
  color: string;
};

export type Position = {
  id: string;
  portfolioId: string;
  assetId: string;
  quantity: number;
  averageCostEur: number;
  marketValueEur: number;
  marketValueUsd: number;
  pnlEur: number;
  pnlPercent: number;
  allocationPercent: number;
  platform?: string;
};

export type Transaction = {
  id: string;
  portfolioId: string;
  type: TransactionType;
  assetId?: string;
  assetSymbol?: string;
  date: string;
  quantity?: number;
  grossAmount: number;
  currency: Currency;
  fees: number;
  note?: string;
  platform?: string;
};

export type ManualPosition = {
  id: string;
  portfolioId: string;
  label: string;
  valueEur: number;
  valueUsd: number;
  currency: Currency;
  updatedAt: string;
  note?: string;
};

export type PortfolioSnapshot = {
  date: string;
  valueEur: number;
  valueUsd: number;
  investedCapitalEur: number;
  cashFlowEur: number;
  cashFlowUsd?: number;
  twr: number;
};

export type AllocationSlice = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

export type AssetSearchResult = {
  symbol: string;
  name: string;
  type: AssetType;
  exchange?: string;
  currency: Currency;
  provider: PriceProvider;
  externalId: string;
  priceEur?: number;
  priceUsd?: number;
};

export type ApiStatus = {
  provider: string;
  configured: boolean;
  purpose: string;
  unconfiguredLabel?: string;
};

export type PortfolioNewsItem = {
  id: string;
  symbol?: string;
  matchedSymbols?: string[];
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  provider: "rss" | "sec" | "gdelt";
  sourceType: "market-rss" | "crypto-rss" | "filing" | "broad-news";
  confidence: number;
  reason: string;
};

export type PortfolioDigest = {
  generatedAt: string;
  subject: string;
  text: string;
  html: string;
  highlights: string[];
  news: PortfolioNewsItem[];
};
