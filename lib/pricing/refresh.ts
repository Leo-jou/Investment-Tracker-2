import { assets, portfolioSnapshots } from "@/lib/mock-data";

export async function refreshPortfolioData() {
  const hasAnyProvider =
    Boolean(process.env.COINGECKO_DEMO_API_KEY) ||
    Boolean(process.env.TWELVE_DATA_API_KEY) ||
    Boolean(process.env.FMP_API_KEY);

  return {
    mode: hasAnyProvider ? "provider-ready" : "mock",
    refreshedAt: new Date().toISOString(),
    pricesUpdated: assets.length,
    fxPairsUpdated: 2,
    portfolioSnapshotsUpdated: portfolioSnapshots.length,
    message: hasAnyProvider
      ? "Provider keys detected. Real refresh plumbing is ready for integration."
      : "No provider keys found. Mock prices and snapshots remain active."
  };
}
