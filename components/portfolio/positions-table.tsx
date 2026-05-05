"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MoreHorizontal, Search } from "lucide-react";

import { AssetPill } from "@/components/portfolio/asset-pill";
import { formatMoney, formatPercent, formatQuantity, trendClass } from "@/lib/format";
import {
  formatPriceTimestamp,
  getAssetPriceStatus,
  priceProviderLabel,
  type PriceStatusTone
} from "@/lib/portfolio/price-status";
import type { Asset, Currency, Position } from "@/lib/types";
import { cn } from "@/lib/utils";

type PositionsTableProps = {
  positions: Position[];
  assets: Asset[];
  currency: Currency;
};

type HoldingView = "Position" | "Performance" | "Risk" | "Details";

type PositionRow = {
  position: Position;
  asset: Asset;
};

type Column = {
  key: string;
  label: string;
  align?: "left" | "right";
  width: string;
  render: (row: PositionRow) => ReactNode;
};

const holdingViews: HoldingView[] = ["Position", "Performance", "Risk", "Details"];

const viewDescriptions: Record<HoldingView, string> = {
  Position: "Current holding size, value, allocation, and platform labels.",
  Performance: "Open-position P&L. Provider-backed 24h moves are hidden until connected.",
  Risk: "Concentration and data-quality notes for current exposure.",
  Details: "Provider, exchange, native currency, and price metadata."
};

export function PositionsTable({ positions, assets, currency }: PositionsTableProps) {
  const [activeView, setActiveView] = useState<HoldingView>("Position");
  const [displaySold, setDisplaySold] = useState(false);
  const fx = currency === "EUR" ? 1 : 1.077;
  const assetById = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);
  const rows = useMemo(
    () =>
      positions.flatMap((position) => {
        const asset = assetById.get(position.assetId);
        if (!asset) return [];
        if (!displaySold && position.quantity <= 0) return [];

        return [
          {
            position,
            asset
          }
        ];
      }),
    [assetById, displaySold, positions]
  );
  const columns = getColumns(activeView, currency, fx);

  return (
    <section>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Total holdings</h2>
          <p className="mt-2 text-sm text-zinc-500">{viewDescriptions[activeView]}</p>
          <div className="mt-8 flex flex-wrap gap-3 text-lg">
            {holdingViews.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveView(tab)}
                className={cn(
                  "rounded-[6px] px-4 py-2 text-zinc-300",
                  activeView === tab && "bg-[#2c2c2f] font-semibold text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={displaySold}
          onClick={() => setDisplaySold((enabled) => !enabled)}
          className="flex items-center gap-3 text-sm text-zinc-400"
        >
          Display sold
          <span
            className={cn(
              "flex h-6 w-11 items-center rounded-full p-1",
              displaySold ? "bg-[#00c2a8]" : "bg-[#4a4a4d]"
            )}
          >
            <span
              className={cn(
                "h-4 w-4 rounded-full bg-[#161616] transition-transform",
                displaySold && "translate-x-5"
              )}
            />
          </span>
        </button>
      </div>

      <div className="overflow-x-auto tv-scrollbar">
        <table className="w-full min-w-[1120px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[320px]" />
            {columns.map((column) => (
              <col key={column.key} className={column.width} />
            ))}
            <col className="w-[48px]" />
          </colgroup>
          <thead>
            <tr className="border-y border-[#2b2b2f] text-left text-zinc-500">
              <th className="py-3 font-medium">
                <div className="flex items-center gap-4">
                  <Search className="h-6 w-6 text-zinc-200" strokeWidth={1.5} />
                  <span>
                    Symbol
                    <span className="block text-xs text-zinc-400">{rows.length} holdings</span>
                  </span>
                </div>
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "py-3 font-medium",
                    column.align === "right" ? "text-right" : "text-left"
                  )}
                >
                  {column.label}
                </th>
              ))}
              <th className="py-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.position.id} className="border-b border-[#202024] hover:bg-[#121214]">
                <td className="py-3 pr-4">
                  <AssetPill asset={row.asset} />
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "py-3 text-zinc-300 tabular-nums",
                      column.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
                <td className="py-3 text-right">
                  <button type="button" className="text-zinc-400 hover:text-white">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getColumns(activeView: HoldingView, currency: Currency, fx: number): Column[] {
  if (activeView === "Performance") {
    return [
      {
        key: "unrealized",
        label: "Unrealized P&L",
        align: "right",
        width: "w-[170px]",
        render: ({ position }) => (
          <span className={trendClass(position.pnlEur)}>
            {formatMoney(position.pnlEur * fx, currency)}
          </span>
        )
      },
      {
        key: "return",
        label: "Return",
        align: "right",
        width: "w-[130px]",
        render: ({ position }) => (
          <span className={trendClass(position.pnlPercent)}>{formatPercent(position.pnlPercent)}</span>
        )
      },
      {
        key: "daily-gain",
        label: "24h gain",
        align: "right",
        width: "w-[150px]",
        render: () => <Unavailable24h />
      },
      {
        key: "daily-return",
        label: "24h move",
        align: "right",
        width: "w-[130px]",
        render: () => <Unavailable24h />
      },
      {
        key: "allocation",
        label: "Allocation",
        align: "right",
        width: "w-[130px]",
        render: ({ position }) => `${position.allocationPercent.toFixed(2)}%`
      }
    ];
  }

  if (activeView === "Risk") {
    return [
      {
        key: "asset-type",
        label: "Type",
        width: "w-[130px]",
        render: ({ asset }) => asset.type
      },
      {
        key: "exposure",
        label: "Exposure",
        align: "right",
        width: "w-[170px]",
        render: ({ position }) => formatMoney(position.marketValueEur * fx, currency)
      },
      {
        key: "allocation",
        label: "Concentration",
        align: "right",
        width: "w-[150px]",
        render: ({ position }) => `${position.allocationPercent.toFixed(2)}%`
      },
      {
        key: "platform",
        label: "Platform",
        align: "right",
        width: "w-[180px]",
        render: ({ position }) => platformLabel(position)
      },
      {
        key: "risk",
        label: "Risk note",
        align: "right",
        width: "w-[220px]",
        render: ({ asset, position }) => getRiskNote(asset, position)
      }
    ];
  }

  if (activeView === "Details") {
    return [
      {
        key: "last-price",
        label: "Last price",
        align: "right",
        width: "w-[150px]",
        render: ({ asset }) =>
          asset.priceEur > 0 ? formatMoney(asset.priceEur * fx, currency) : <span className="text-zinc-500">Unavailable</span>
      },
      {
        key: "last-quote",
        label: "Last quote",
        align: "right",
        width: "w-[170px]",
        render: ({ asset }) => (
          <span className="text-xs text-zinc-400">{formatPriceTimestamp(asset.priceCapturedAt)}</span>
        )
      },
      {
        key: "avg-price",
        label: "Avg price",
        align: "right",
        width: "w-[150px]",
        render: ({ position }) => formatMoney(position.averageCostEur * fx, currency)
      },
      {
        key: "currency",
        label: "Native",
        align: "right",
        width: "w-[110px]",
        render: ({ asset }) => asset.currency
      },
      {
        key: "provider",
        label: "Provider",
        align: "right",
        width: "w-[150px]",
        render: ({ asset }) => priceProviderLabel(asset.provider)
      },
      {
        key: "price-status",
        label: "Status",
        align: "right",
        width: "w-[170px]",
        render: ({ asset }) => {
          const status = getAssetPriceStatus(asset);
          return (
            <span>
              <span className={priceStatusClass(status.tone)}>{status.label}</span>
              <span className="mt-1 block text-xs text-zinc-600">{status.detail}</span>
            </span>
          );
        }
      },
      {
        key: "exchange",
        label: "Exchange",
        align: "right",
        width: "w-[140px]",
        render: ({ asset }) => asset.exchange ?? "-"
      },
      {
        key: "external-id",
        label: "Provider ID",
        align: "right",
        width: "w-[200px]",
        render: ({ asset }) => (
          <span className="block truncate" title={asset.externalId}>
            {asset.externalId}
          </span>
        )
      }
    ];
  }

  return [
    {
      key: "allocation",
      label: "Allocation",
      align: "right",
      width: "w-[130px]",
      render: ({ position }) => `${position.allocationPercent.toFixed(2)}%`
    },
    {
      key: "quantity",
      label: "Qty",
      align: "right",
      width: "w-[120px]",
      render: ({ position }) => formatQuantity(position.quantity)
    },
    {
      key: "avg-price",
      label: "Avg price",
      align: "right",
      width: "w-[150px]",
      render: ({ position }) => formatMoney(position.averageCostEur * fx, currency)
    },
    {
      key: "market-value",
      label: "Market value",
      align: "right",
      width: "w-[160px]",
      render: ({ position }) => formatMoney(position.marketValueEur * fx, currency)
    },
    {
      key: "platform",
      label: "Platform",
      align: "right",
      width: "w-[180px]",
      render: ({ position }) => platformLabel(position)
    },
    {
      key: "total-gain",
      label: "Total gain",
      align: "right",
      width: "w-[180px]",
      render: ({ position }) => (
        <span className={trendClass(position.pnlEur)}>
          {formatMoney(position.pnlEur * fx, currency)}
          <span className="ml-2 text-xs">{formatPercent(position.pnlPercent)}</span>
        </span>
      )
    }
  ];
}

function platformLabel(position: Position) {
  const platforms = position.platforms?.length
    ? position.platforms
    : position.platform
      ? [position.platform]
      : [];
  if (platforms.length === 0) return <span className="text-zinc-600">Unspecified</span>;
  if (platforms.length <= 2) return platforms.join(", ");
  return `${platforms.slice(0, 2).join(", ")} +${platforms.length - 2}`;
}

function Unavailable24h() {
  return <span className="text-zinc-500">Not connected</span>;
}

function priceStatusClass(tone: PriceStatusTone) {
  const base = "inline-flex rounded-[5px] px-2 py-1 text-xs font-semibold";
  if (tone === "ok") return `${base} bg-[#05251f] text-[#00c2a8]`;
  if (tone === "danger") return `${base} bg-[#2a0710] text-[#ff4d64]`;
  if (tone === "warning") return `${base} bg-[#2f2107] text-[#f6b342]`;
  return `${base} bg-[#202024] text-zinc-300`;
}

function getRiskNote(asset: Asset, position: Position) {
  if (position.quantity <= 0 || position.allocationPercent <= 0) return "No current exposure";
  if (asset.type === "MANUAL" || asset.type === "CASH") return "Manual/stale value";
  if (position.allocationPercent >= 25) return "High concentration";
  if (position.allocationPercent >= 10) return "Meaningful concentration";
  return "Included in portfolio risk";
}
