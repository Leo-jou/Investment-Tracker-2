import type { DashboardData } from "../db/portfolio-repository.ts";
import type { Asset, PortfolioNewsItem } from "../types.ts";

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  sourceCountry?: string;
  language?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
};

export async function getPortfolioNews(data: DashboardData): Promise<PortfolioNewsItem[]> {
  const heldAssets = getHeldAssets(data);
  if (heldAssets.length === 0) return [];

  const gdeltItems = await fetchGdeltNews(heldAssets);
  return gdeltItems.length > 0 ? gdeltItems : buildLocalNews(heldAssets);
}

export function getHeldAssets(data: DashboardData) {
  const assetById = new Map(data.assets.map((asset) => [asset.id, asset]));
  return data.positions
    .map((position) => assetById.get(position.assetId))
    .filter((asset): asset is Asset => Boolean(asset))
    .slice(0, 8);
}

async function fetchGdeltNews(assets: Asset[]): Promise<PortfolioNewsItem[]> {
  const query = buildGdeltQuery(assets);
  if (!query) return [];

  const params = new URLSearchParams({
    query,
    mode: "artlist",
    format: "json",
    maxrecords: "12",
    timespan: "1d",
    sort: "datedesc"
  });

  try {
    const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as GdeltResponse;
    const seen = new Set<string>();

    return (payload.articles ?? []).flatMap((article) => {
      const url = normalizeHttpUrl(article.url);
      const title = article.title?.trim();
      if (!url || !title || seen.has(url)) return [];
      seen.add(url);

      const matchedAsset = findMatchedAsset(assets, `${title} ${url}`);
      return [
        {
          id: url,
          symbol: matchedAsset?.symbol,
          title,
          url,
          source: article.domain ?? "GDELT",
          publishedAt: normalizeGdeltDate(article.seendate),
          summary: buildSummary(matchedAsset, article.domain ?? "GDELT"),
          provider: "gdelt" as const
        }
      ];
    });
  } catch {
    return [];
  }
}

function normalizeHttpUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function buildGdeltQuery(assets: Asset[]) {
  const terms = assets
    .flatMap((asset) => [asset.name, asset.symbol])
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !["USD", "EUR"].includes(term.toUpperCase()))
    .slice(0, 10);

  if (terms.length === 0) return "";
  return `(${terms.map((term) => `"${term.replaceAll("\"", "")}"`).join(" OR ")})`;
}

function findMatchedAsset(assets: Asset[], text: string) {
  const normalized = text.toLowerCase();
  return assets.find((asset) => {
    const symbol = asset.symbol.toLowerCase();
    const name = asset.name.toLowerCase();
    return normalized.includes(symbol) || normalized.includes(name);
  });
}

function normalizeGdeltDate(value?: string) {
  if (!value) return new Date().toISOString();
  const normalized = value.replace(
    /^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})Z?$/,
    "$1-$2-$3T$4:$5:$6Z"
  );
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function buildSummary(asset: Asset | undefined, source: string) {
  if (!asset) return `Relevant market headline found via ${source}.`;
  return `${asset.symbol} appeared in recent coverage from ${source}. Review the source before acting.`;
}

function buildLocalNews(assets: Asset[]): PortfolioNewsItem[] {
  return assets.slice(0, 5).map((asset, index) => ({
    id: `local-${asset.symbol}`,
    symbol: asset.symbol,
    title: `${asset.symbol} watchlist: monitor ${asset.name} coverage and price action`,
    url: `https://www.google.com/search?q=${encodeURIComponent(`${asset.name} ${asset.symbol} news`)}`,
    source: "Portfolio monitor",
    publishedAt: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
    summary: `${asset.name} is part of the current portfolio. Live headlines were unavailable, so this item links to a fresh search.`,
    provider: "local"
  }));
}
