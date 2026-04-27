import { assets as mockAssets, portfolioSnapshots as mockPortfolioSnapshots } from "@/lib/mock-data";
import {
  insertFxSnapshotsForRefresh,
  insertPriceSnapshotsForRefresh,
  listAssetsForPriceRefresh,
  refreshCurrentPortfolioSnapshotsForEmail,
  type FxSnapshotInput,
  type PriceSnapshotInput,
  type RefreshableAsset
} from "@/lib/db/portfolio-repository";
import {
  normalizeCoinGeckoPrice,
  normalizeTwelveDataQuote
} from "@/lib/pricing/provider-normalizers";

type RefreshError = {
  scope: string;
  message: string;
};

type RefreshResult = {
  mode: "provider" | "mock" | "partial";
  refreshedAt: string;
  pricesUpdated: number;
  pricesSkipped: number;
  fxPairsUpdated: number;
  portfolioSnapshotsUpdated: number;
  errors: RefreshError[];
  message: string;
};

type RefreshOptions = {
  updatePortfolioSnapshots?: boolean;
};

type CoinGeckoSimplePrice = Record<
  string,
  {
    usd?: number;
    eur?: number;
  }
>;

type TwelveDataQuote = {
  close?: string;
  currency?: string;
  code?: number;
  message?: string;
};

type TwelveDataExchangeRate = {
  rate?: number;
  code?: number;
  message?: string;
};

export async function refreshPortfolioData(
  email: string,
  options: RefreshOptions = {}
): Promise<RefreshResult> {
  const capturedAt = new Date();
  const refreshedAt = capturedAt.toISOString();

  if (!process.env.DATABASE_URL) {
    return {
      mode: "mock",
      refreshedAt,
      pricesUpdated: mockAssets.length,
      pricesSkipped: 0,
      fxPairsUpdated: 2,
      portfolioSnapshotsUpdated: mockPortfolioSnapshots.length,
      errors: [],
      message: "DATABASE_URL is missing. Mock prices and snapshots remain active."
    };
  }

  const errors: RefreshError[] = [];
  const refreshableAssets = await listAssetsForPriceRefresh();
  const priceResults = await fetchProviderPrices(refreshableAssets, capturedAt, errors);
  const fxResults = await fetchFxRates(capturedAt, errors);

  const pricesUpdated = await insertPriceSnapshotsForRefresh(priceResults);
  const fxPairsUpdated = await insertFxSnapshotsForRefresh(fxResults);
  const portfolioSnapshotsUpdated =
    options.updatePortfolioSnapshots === false
      ? 0
      : await refreshCurrentPortfolioSnapshotsForEmail(email);

  const providerKeysConfigured =
    Boolean(process.env.COINGECKO_DEMO_API_KEY) || Boolean(process.env.TWELVE_DATA_API_KEY);
  const pricesSkipped = Math.max(refreshableAssets.length - pricesUpdated, 0);
  const mode = !providerKeysConfigured ? "mock" : errors.length > 0 ? "partial" : "provider";

  return {
    mode,
    refreshedAt,
    pricesUpdated,
    pricesSkipped,
    fxPairsUpdated,
    portfolioSnapshotsUpdated,
    errors,
    message: buildRefreshMessage(mode, pricesUpdated, pricesSkipped, fxPairsUpdated, errors)
  };
}

async function fetchProviderPrices(
  assets: RefreshableAsset[],
  capturedAt: Date,
  errors: RefreshError[]
) {
  const [coinGeckoPrices, twelveDataPrices] = await Promise.all([
    fetchCoinGeckoPrices(assets, capturedAt, errors),
    fetchTwelveDataPrices(assets, capturedAt, errors)
  ]);

  return [...coinGeckoPrices, ...twelveDataPrices];
}

export async function fetchLivePriceSnapshot(
  asset: RefreshableAsset,
  capturedAt = new Date()
): Promise<PriceSnapshotInput | null> {
  if (asset.provider === "coingecko") {
    return fetchCoinGeckoPrice(asset, capturedAt);
  }

  if (asset.provider === "twelve-data") {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) return null;
    return fetchTwelveDataPrice(asset, apiKey, capturedAt);
  }

  return null;
}

async function fetchCoinGeckoPrice(
  asset: RefreshableAsset,
  capturedAt: Date
): Promise<PriceSnapshotInput | null> {
  const apiKey = process.env.COINGECKO_DEMO_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      asset.externalId
    )}&vs_currencies=usd,eur&include_last_updated_at=true`,
    {
      headers: {
        "x-cg-demo-api-key": apiKey
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Price request failed with HTTP ${response.status}.`);
  }

  const data = (await response.json()) as CoinGeckoSimplePrice;
  return normalizeCoinGeckoPrice(asset, data[asset.externalId], capturedAt);
}

async function fetchCoinGeckoPrices(
  assets: RefreshableAsset[],
  capturedAt: Date,
  errors: RefreshError[]
): Promise<PriceSnapshotInput[]> {
  const apiKey = process.env.COINGECKO_DEMO_API_KEY;
  const cryptoAssets = assets.filter((asset) => asset.provider === "coingecko");

  if (!apiKey || cryptoAssets.length === 0) return [];

  const ids = Array.from(new Set(cryptoAssets.map((asset) => asset.externalId))).join(",");

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        ids
      )}&vs_currencies=usd,eur`,
      {
        headers: {
          "x-cg-demo-api-key": apiKey
        }
      }
    );

    if (!response.ok) {
      errors.push({
        scope: "CoinGecko",
        message: `Price request failed with HTTP ${response.status}.`
      });
      return [];
    }

    const data = (await response.json()) as CoinGeckoSimplePrice;

    return cryptoAssets.flatMap((asset) => {
      const providerPrice = data[asset.externalId];
      const normalized = normalizeCoinGeckoPrice(asset, providerPrice, capturedAt);

      if (!normalized) {
        errors.push({
          scope: `CoinGecko ${asset.symbol}`,
          message: "Provider response did not include a usable USD or EUR price."
        });
        return [];
      }

      return [normalized];
    });
  } catch (error) {
    errors.push({
      scope: "CoinGecko",
      message: error instanceof Error ? error.message : "Unknown provider error."
    });
    return [];
  }
}

async function fetchTwelveDataPrices(
  assets: RefreshableAsset[],
  capturedAt: Date,
  errors: RefreshError[]
): Promise<PriceSnapshotInput[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  const providerAssets = assets.filter((asset) => asset.provider === "twelve-data");

  if (!apiKey || providerAssets.length === 0) return [];

  const results = await Promise.allSettled(
    providerAssets.map((asset) => fetchTwelveDataPrice(asset, apiKey, capturedAt))
  );

  return results.flatMap((result, index) => {
    const asset = providerAssets[index];

    if (result.status === "rejected") {
      errors.push({
        scope: `Twelve Data ${asset.symbol}`,
        message: result.reason instanceof Error ? result.reason.message : "Unknown provider error."
      });
      return [];
    }

    if (!result.value) {
      errors.push({
        scope: `Twelve Data ${asset.symbol}`,
        message: "Provider response did not include a usable close price."
      });
      return [];
    }

    return [result.value];
  });
}

async function fetchTwelveDataPrice(
  asset: RefreshableAsset,
  apiKey: string,
  capturedAt: Date
): Promise<PriceSnapshotInput | null> {
  const { symbol, exchange } = splitTwelveDataExternalId(asset);

  if (!exchange) {
    const quote = await fetchTwelveDataQuote(symbol, apiKey);
    return normalizeTwelveDataQuote(asset, quote, capturedAt);
  }

  let primaryError: unknown;

  try {
    const primaryQuote = await fetchTwelveDataQuote(symbol, apiKey, exchange);
    const normalizedPrimaryQuote = normalizeTwelveDataQuote(asset, primaryQuote, capturedAt);
    if (normalizedPrimaryQuote) return normalizedPrimaryQuote;
  } catch (error) {
    primaryError = error;
  }

  const fallbackQuote = await fetchTwelveDataQuote(symbol, apiKey);
  const normalizedFallbackQuote = normalizeTwelveDataQuote(asset, fallbackQuote, capturedAt);

  if (normalizedFallbackQuote) return normalizedFallbackQuote;
  if (primaryError) throw primaryError;
  return null;
}

async function fetchTwelveDataQuote(symbol: string, apiKey: string, exchange?: string) {
  const params = new URLSearchParams({
    symbol,
    apikey: apiKey
  });

  if (exchange) params.set("exchange", exchange);

  const response = await fetch(`https://api.twelvedata.com/quote?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Price request failed with HTTP ${response.status}.`);
  }

  const quote = (await response.json()) as TwelveDataQuote;

  if (quote.code || quote.message) {
    throw new Error(quote.message ?? `Provider returned code ${quote.code}.`);
  }

  return quote;
}

async function fetchFxRates(capturedAt: Date, errors: RefreshError[]): Promise<FxSnapshotInput[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      symbol: "EUR/USD",
      apikey: apiKey
    });
    const response = await fetch(`https://api.twelvedata.com/exchange_rate?${params.toString()}`);

    if (!response.ok) {
      errors.push({
        scope: "Twelve Data FX",
        message: `FX request failed with HTTP ${response.status}.`
      });
      return [];
    }

    const data = (await response.json()) as TwelveDataExchangeRate;

    if (data.code || data.message || !isPositiveNumber(data.rate)) {
      errors.push({
        scope: "Twelve Data FX",
        message: data.message ?? "Provider response did not include a usable EUR/USD rate."
      });
      return [];
    }

    return [
      {
        baseCurrency: "EUR",
        quoteCurrency: "USD",
        rate: data.rate,
        capturedAt
      },
      {
        baseCurrency: "USD",
        quoteCurrency: "EUR",
        rate: 1 / data.rate,
        capturedAt
      }
    ];
  } catch (error) {
    errors.push({
      scope: "Twelve Data FX",
      message: error instanceof Error ? error.message : "Unknown provider error."
    });
    return [];
  }
}

function splitTwelveDataExternalId(asset: RefreshableAsset) {
  const [symbol, exchangeFromExternalId] = asset.externalId.split(":");
  return {
    symbol: symbol || asset.symbol,
    exchange: asset.exchange ?? exchangeFromExternalId
  };
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function buildRefreshMessage(
  mode: RefreshResult["mode"],
  pricesUpdated: number,
  pricesSkipped: number,
  fxPairsUpdated: number,
  errors: RefreshError[]
) {
  if (mode === "mock") {
    return "No provider keys found. Existing mock or saved prices remain active.";
  }

  const base = `Updated ${pricesUpdated} prices and ${fxPairsUpdated} FX pairs.`;
  const skipped = pricesSkipped > 0 ? ` ${pricesSkipped} assets kept their last saved price.` : "";
  const failures = errors.length > 0 ? ` ${errors.length} provider issue(s) reported.` : "";

  return `${base}${skipped}${failures}`;
}
