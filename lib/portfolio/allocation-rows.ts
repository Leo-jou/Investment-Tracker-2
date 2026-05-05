import type { AllocationSlice, Asset, ManualPosition, Position } from "../types.ts";

export type AllocationMode = "Assets" | "Asset types" | "Currency" | "Sectors";

export type AllocationTableRow = AllocationSlice & {
  unrealizedGainEur: number | null;
};

type BuildAllocationRowsInput = {
  mode: AllocationMode;
  allocations: AllocationSlice[];
  assets: Asset[];
  positions: Position[];
  manualPositions: ManualPosition[];
};

type GroupedAllocation = {
  value: number;
  color: string;
  unrealizedGainEur: number;
  hasManualValue: boolean;
};

export function buildAllocationRows({
  mode,
  allocations,
  assets,
  positions,
  manualPositions
}: BuildAllocationRowsInput): AllocationTableRow[] {
  if (mode === "Assets" || mode === "Sectors") {
    if (positions.length > 0 || manualPositions.length > 0) {
      return withPercentages([
        ...assetPositionRows(assets, positions),
        ...manualPositions.map((position) => ({
          label: position.label,
          value: position.valueEur,
          percent: 0,
          color: "#14b8a6",
          unrealizedGainEur: null
        }))
      ]);
    }

    return allocations.map((allocation) => ({
      ...allocation,
      unrealizedGainEur: null
    }));
  }

  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const grouped = new Map<string, GroupedAllocation>();

  for (const position of positions) {
    const asset = assetById.get(position.assetId);
    const label = mode === "Asset types" ? asset?.type ?? "Unknown" : asset?.currency ?? "USD";
    addGroupedValue(grouped, label, position.marketValueEur, asset?.color ?? "#3b82f6", {
      unrealizedGainEur: position.pnlEur,
      isManual: false
    });
  }

  for (const position of manualPositions) {
    const label = mode === "Asset types" ? "Manual" : position.currency;
    addGroupedValue(grouped, label, position.valueEur, "#14b8a6", {
      unrealizedGainEur: 0,
      isManual: true
    });
  }

  return withPercentages(
    Array.from(grouped.entries()).map(([label, value]) => ({
      label,
      value: value.value,
      percent: 0,
      color: value.color,
      unrealizedGainEur: value.hasManualValue ? null : value.unrealizedGainEur
    }))
  ).sort((left, right) => right.value - left.value);
}

function assetPositionRows(assets: Asset[], positions: Position[]): AllocationTableRow[] {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  return positions.map((position) => {
    const asset = assetById.get(position.assetId);
    return {
      label: asset?.symbol ?? "Unknown",
      value: position.marketValueEur,
      percent: 0,
      color: asset?.color ?? "#3b82f6",
      unrealizedGainEur: position.pnlEur
    };
  });
}

function addGroupedValue(
  grouped: Map<string, GroupedAllocation>,
  label: string,
  value: number,
  color: string,
  options: { unrealizedGainEur: number; isManual: boolean }
) {
  const current = grouped.get(label);
  if (current) {
    current.value += value;
    current.unrealizedGainEur += options.unrealizedGainEur;
    current.hasManualValue ||= options.isManual;
    return;
  }
  grouped.set(label, {
    value,
    color,
    unrealizedGainEur: options.unrealizedGainEur,
    hasManualValue: options.isManual
  });
}

function withPercentages(rows: AllocationTableRow[]): AllocationTableRow[] {
  const total = rows.reduce((sum, slice) => sum + slice.value, 0);
  return rows.map((slice) => ({
    ...slice,
    percent: total === 0 ? 0 : (slice.value / total) * 100
  }));
}
