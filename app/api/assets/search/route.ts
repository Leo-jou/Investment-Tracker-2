import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { listAssetsForEmail } from "@/lib/db/portfolio-repository";
import { searchAssets } from "@/lib/pricing/asset-search";
import type { Asset, AssetSearchResult } from "@/lib/types";

export async function GET(request: Request) {
  const email = await requireSessionEmail();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const [localResults, providerResults] = await Promise.all([
      searchLocalAssets(email, query),
      searchAssets(query)
    ]);
    const results = dedupeSearchResults([...localResults, ...providerResults]).slice(0, 10);
    return NextResponse.json({ results, source: "dynamic-with-mock-fallback" });
  } catch {
    const results = await searchAssets("");
    return NextResponse.json(
      {
        results,
        source: "mock-fallback",
        error: "Asset search providers are unavailable."
      },
      { status: 200 }
    );
  }
}

async function searchLocalAssets(email: string, query: string): Promise<AssetSearchResult[]> {
  const normalized = query.trim().toLowerCase();
  const assets = await listAssetsForEmail(email);

  return assets
    .filter((asset) => {
      if (!normalized) return true;
      return (
        asset.symbol.toLowerCase().includes(normalized) ||
        asset.name.toLowerCase().includes(normalized) ||
        asset.exchange?.toLowerCase().includes(normalized)
      );
    })
    .map(toAssetSearchResult);
}

function toAssetSearchResult(asset: Asset): AssetSearchResult {
  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    exchange: asset.exchange,
    currency: asset.currency,
    provider: asset.provider,
    externalId: asset.externalId,
    priceEur: asset.priceEur,
    priceUsd: asset.priceUsd
  };
}

function dedupeSearchResults(results: AssetSearchResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = `${result.provider}:${result.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
