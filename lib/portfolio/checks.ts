import type { Asset, ManualPosition, PortfolioSnapshot, Position } from "@/lib/types";

export type PortfolioCheckSeverity = "warning" | "info";

export type PortfolioCheck = {
  id: string;
  severity: PortfolioCheckSeverity;
  title: string;
  detail: string;
};

type PortfolioChecksInput = {
  positions: Position[];
  assets: Asset[];
  manualPositions: ManualPosition[];
  snapshots: PortfolioSnapshot[];
  now?: Date;
};

export function buildPortfolioChecks({
  positions,
  assets,
  manualPositions,
  snapshots,
  now = new Date()
}: PortfolioChecksInput): PortfolioCheck[] {
  const checks: PortfolioCheck[] = [];
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const sortedSnapshots = [...snapshots].sort((left, right) => left.date.localeCompare(right.date));
  const latestSnapshot = sortedSnapshots.at(-1);

  if (sortedSnapshots.length < 2) {
    checks.push({
      id: "insufficient-snapshots",
      severity: "warning",
      title: "Performance history is thin",
      detail: "TWR and risk metrics need at least two portfolio snapshots before period changes can be calculated."
    });
  }

  if (latestSnapshot && daysBetween(latestSnapshot.date, now) > 2) {
    checks.push({
      id: "stale-snapshot",
      severity: "warning",
      title: "Snapshot is stale",
      detail: `Latest portfolio snapshot is ${latestSnapshot.date}. Refresh prices to record a newer value.`
    });
  }

  const largest = [...positions].sort((left, right) => right.allocationPercent - left.allocationPercent)[0];
  if (largest && largest.allocationPercent >= 25) {
    const asset = assetById.get(largest.assetId);
    checks.push({
      id: "concentration",
      severity: largest.allocationPercent >= 50 ? "warning" : "info",
      title: "Concentration check",
      detail: `${asset?.symbol ?? "Largest holding"} is ${largest.allocationPercent.toFixed(
        1
      )}% of priced holdings.`
    });
  }

  const missingPlatforms = positions.filter(
    (position) => !position.platforms?.length && !position.platform
  ).length;
  if (missingPlatforms > 0) {
    checks.push({
      id: "missing-platforms",
      severity: "info",
      title: "Platform labels missing",
      detail: `${missingPlatforms} holding${missingPlatforms === 1 ? "" : "s"} do not have a platform label.`
    });
  }

  const unsupportedAssets = positions.filter((position) => {
    const asset = assetById.get(position.assetId);
    return asset?.provider === "manual" || asset?.provider === "mock";
  }).length;
  if (unsupportedAssets > 0) {
    checks.push({
      id: "saved-pricing",
      severity: "info",
      title: "Saved-price holdings",
      detail: `${unsupportedAssets} priced holding${unsupportedAssets === 1 ? "" : "s"} use saved or manual provider data.`
    });
  }

  const staleManualPositions = manualPositions.filter(
    (position) => daysBetween(position.updatedAt, now) > 30
  ).length;
  if (staleManualPositions > 0) {
    checks.push({
      id: "manual-stale",
      severity: "info",
      title: "Manual values need review",
      detail: `${staleManualPositions} manual position${staleManualPositions === 1 ? "" : "s"} have not been updated in more than 30 days.`
    });
  }

  return checks.slice(0, 4);
}

function daysBetween(date: string, now: Date) {
  const then = new Date(`${date}T00:00:00.000Z`).getTime();
  const current = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (Number.isNaN(then)) return 0;
  return Math.floor((current - then) / 86_400_000);
}
