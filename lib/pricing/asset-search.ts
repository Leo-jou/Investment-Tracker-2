import { mockAssetSearchResults } from "@/lib/mock-data";
import type { AssetSearchResult } from "@/lib/types";

type CoinGeckoCoin = {
  id: string;
  name: string;
  symbol: string;
};

type TwelveDataSymbol = {
  symbol: string;
  instrument_name?: string;
  instrument_type?: string;
  exchange?: string;
  currency?: string;
};

type FmpSearchResult = {
  symbol: string;
  name: string;
  exchangeShortName?: string;
  currency?: string;
};

export async function searchAssets(query: string): Promise<AssetSearchResult[]> {
  const normalized = query.trim();

  if (!normalized) {
    return mockAssetSearchResults.slice(0, 6);
  }

  const providerResults = await Promise.allSettled([
    searchCoinGecko(normalized),
    searchTwelveData(normalized),
    searchFmp(normalized)
  ]);

  const merged = providerResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  if (merged.length === 0) {
    return searchMockAssets(normalized);
  }

  return dedupeResults([...merged, ...searchMockAssets(normalized)]).slice(0, 10);
}

async function searchCoinGecko(query: string): Promise<AssetSearchResult[]> {
  const headers: HeadersInit = {};
  const apiKey = process.env.COINGECKO_DEMO_API_KEY;

  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }

  const response = await fetch(
    `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
    { headers, next: { revalidate: 300 } }
  );

  if (!response.ok) return [];

  const data = (await response.json()) as { coins?: CoinGeckoCoin[] };
  return (data.coins ?? []).slice(0, 5).map((coin) => ({
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    type: "CRYPTO",
    currency: "USD",
    provider: "coingecko",
    externalId: coin.id
  }));
}

async function searchTwelveData(query: string): Promise<AssetSearchResult[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return [];

  const response = await fetch(
    `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${apiKey}`,
    { next: { revalidate: 300 } }
  );

  if (!response.ok) return [];

  const data = (await response.json()) as { data?: TwelveDataSymbol[] };
  return (data.data ?? []).slice(0, 6).map((item) => ({
    symbol: item.symbol,
    name: item.instrument_name ?? item.symbol,
    type: mapTwelveDataType(item.instrument_type),
    exchange: item.exchange,
    currency: item.currency === "EUR" ? "EUR" : "USD",
    provider: "twelve-data",
    externalId: item.exchange ? `${item.symbol}:${item.exchange}` : item.symbol
  }));
}

async function searchFmp(query: string): Promise<AssetSearchResult[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return [];

  const response = await fetch(
    `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(
      query
    )}&limit=8&apikey=${apiKey}`,
    { next: { revalidate: 300 } }
  );

  if (!response.ok) return [];

  const data = (await response.json()) as FmpSearchResult[];
  return data.map((item) => ({
    symbol: item.symbol,
    name: item.name,
    type: "STOCK",
    exchange: item.exchangeShortName,
    currency: item.currency === "EUR" ? "EUR" : "USD",
    provider: "fmp",
    externalId: item.exchangeShortName ? `${item.symbol}:${item.exchangeShortName}` : item.symbol
  }));
}

function searchMockAssets(query: string) {
  const normalized = query.toLowerCase();
  return mockAssetSearchResults.filter(
    (result) =>
      result.symbol.toLowerCase().includes(normalized) ||
      result.name.toLowerCase().includes(normalized) ||
      result.exchange?.toLowerCase().includes(normalized)
  );
}

function dedupeResults(results: AssetSearchResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = `${result.provider}:${result.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapTwelveDataType(type?: string): AssetSearchResult["type"] {
  const normalized = type?.toLowerCase() ?? "";

  if (normalized.includes("etf")) return "ETF";
  if (normalized.includes("crypto")) return "CRYPTO";
  if (normalized.includes("commodity")) return "COMMODITY";
  return "STOCK";
}
