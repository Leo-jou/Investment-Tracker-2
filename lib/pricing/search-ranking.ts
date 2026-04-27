import type { AssetSearchResult } from "../types";

export function rankAssetSearchResults(query: string, results: AssetSearchResult[]) {
  return [...results].sort((left, right) => scoreResult(query, right) - scoreResult(query, left));
}

export function getCuratedSearchResults(query: string): AssetSearchResult[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const groups: AssetSearchResult[][] = [];

  if (["sp500", "sandp500", "snp500", "spx", "standardandpoors500"].includes(normalized)) {
    groups.push([
      twelveDataAlias("SPY", "SPDR S&P 500 ETF Trust", "ETF", "USD", "NYSE ARCA"),
      twelveDataAlias("VOO", "Vanguard S&P 500 ETF", "ETF", "USD", "NYSE ARCA"),
      twelveDataAlias("IVV", "iShares Core S&P 500 ETF", "ETF", "USD", "NYSE ARCA"),
      twelveDataAlias("CSPX", "iShares Core S&P 500 UCITS ETF", "ETF", "USD", "LSE")
    ]);
  }

  if (["nasdaq100", "ndx"].includes(normalized)) {
    groups.push([
      twelveDataAlias("QQQ", "Invesco QQQ Trust", "ETF", "USD", "NASDAQ"),
      twelveDataAlias("QQQM", "Invesco NASDAQ 100 ETF", "ETF", "USD", "NASDAQ")
    ]);
  }

  if (["gold", "xau", "xauusd"].includes(normalized)) {
    groups.push([
      twelveDataAlias("XAU/USD", "Gold Spot / U.S. Dollar", "COMMODITY", "USD"),
      twelveDataAlias("GLD", "SPDR Gold Shares", "ETF", "USD", "NYSE ARCA"),
      twelveDataAlias("IAU", "iShares Gold Trust", "ETF", "USD", "NYSE ARCA")
    ]);
  }

  if (["silver", "xag", "xagusd"].includes(normalized)) {
    groups.push([
      twelveDataAlias("XAG/USD", "Silver Spot / U.S. Dollar", "COMMODITY", "USD"),
      twelveDataAlias("SLV", "iShares Silver Trust", "ETF", "USD", "NYSE ARCA")
    ]);
  }

  if (["eurusd", "eurodollar"].includes(normalized)) {
    groups.push([twelveDataAlias("EUR/USD", "Euro / U.S. Dollar", "COMMODITY", "USD")]);
  }

  if (["msciworld", "worldetf"].includes(normalized)) {
    groups.push([
      twelveDataAlias("URTH", "iShares MSCI World ETF", "ETF", "USD", "NYSE ARCA"),
      twelveDataAlias("IWDA", "iShares Core MSCI World UCITS ETF", "ETF", "USD", "LSE")
    ]);
  }

  return groups.flat();
}

function twelveDataAlias(
  symbol: string,
  name: string,
  type: AssetSearchResult["type"],
  currency: AssetSearchResult["currency"],
  exchange?: string
): AssetSearchResult {
  return {
    symbol,
    name,
    type,
    currency,
    exchange,
    provider: "twelve-data",
    externalId: exchange ? `${symbol}:${exchange}` : symbol
  };
}

function scoreResult(query: string, result: AssetSearchResult) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedSymbol = normalizeSearchText(result.symbol);
  const normalizedName = normalizeSearchText(result.name);
  const tickerLike = /^[a-z0-9./-]{1,12}$/i.test(query.trim());
  let score = 0;

  if (normalizedSymbol === normalizedQuery) score += 120;
  if (normalizedSymbol.startsWith(normalizedQuery) && result.type === "COMMODITY") score += 70;
  if (normalizedSymbol.replace("usd", "") === normalizedQuery && result.type === "CRYPTO") score += 40;
  if (normalizedName.includes(normalizedQuery)) score += 20;
  if (isCuratedResult(result)) score += 180;
  if (result.provider === "twelve-data" && ["ETF", "STOCK"].includes(result.type) && tickerLike) {
    score += 80;
  }
  if (result.provider === "twelve-data" && result.type === "COMMODITY") score += 45;
  if (result.provider === "coingecko" && result.type === "CRYPTO" && isCryptoQuery(normalizedQuery)) {
    score += 55;
  }
  if (isTokenizedSecurityResult(result)) score -= 120;

  return score;
}

function isCuratedResult(result: AssetSearchResult) {
  const curatedKeys = new Set([
    "SPY:NYSE ARCA",
    "VOO:NYSE ARCA",
    "IVV:NYSE ARCA",
    "CSPX:LSE",
    "QQQ:NASDAQ",
    "QQQM:NASDAQ",
    "XAU/USD",
    "GLD:NYSE ARCA",
    "IAU:NYSE ARCA",
    "XAG/USD",
    "SLV:NYSE ARCA",
    "EUR/USD",
    "URTH:NYSE ARCA",
    "IWDA:LSE"
  ]);
  return result.provider === "twelve-data" && curatedKeys.has(result.externalId);
}

function isTokenizedSecurityResult(result: AssetSearchResult) {
  if (result.provider !== "coingecko") return false;
  const normalizedName = result.name.toLowerCase();
  return (
    normalizedName.includes("tokenized") ||
    normalizedName.includes("backed") ||
    normalizedName.includes("wrapped stock") ||
    normalizedName.includes("stock token")
  );
}

function isCryptoQuery(normalizedQuery: string) {
  return ["btc", "bitcoin", "eth", "ethereum", "sol", "solana", "usdc", "tether", "usdt"].includes(
    normalizedQuery
  );
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}
