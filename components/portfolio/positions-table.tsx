"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MoreHorizontal, Search } from "lucide-react";

import { AssetPill } from "@/components/portfolio/asset-pill";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatPercent, formatQuantity, trendClass } from "@/lib/format";
import type { Asset, Currency, Position } from "@/lib/types";
import { cn } from "@/lib/utils";

type PositionsTableProps = {
  positions: Position[];
  assets: Asset[];
  currency: Currency;
};

type HoldingView = "Position" | "Price" | "Financials" | "Performance" | "Risk" | "Technicals";

type PositionRow = {
  position: Position;
  asset: Asset;
  investedEur: number;
  dailyGainEur: number;
};

type Column = {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: PositionRow) => ReactNode;
};

const holdingViews: HoldingView[] = [
  "Position",
  "Price",
  "Financials",
  "Performance",
  "Risk",
  "Technicals"
];

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
            asset,
            investedEur: position.marketValueEur - position.pnlEur,
            dailyGainEur: position.marketValueEur * asset.change24hPercent * 0.01
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
        <table className="w-full min-w-[1120px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-[#2b2b2f] text-left text-zinc-500">
              <th className="w-[320px] py-3 font-medium">
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
                      "py-3 text-zinc-300",
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
      <div className="mt-4 flex flex-wrap gap-2">
        {[...new Set(positions.map((position) => position.platform).filter(Boolean))].map(
          (platform) => (
            <Badge key={platform}>{platform}</Badge>
          )
        )}
      </div>
    </section>
  );
}

function getColumns(activeView: HoldingView, currency: Currency, fx: number): Column[] {
  if (activeView === "Price") {
    return [
      {
        key: "last-price",
        label: "Last price",
        align: "right",
        render: ({ asset }) => formatMoney(asset.priceEur * fx, currency)
      },
      {
        key: "avg-price",
        label: "Avg price",
        align: "right",
        render: ({ position }) => formatMoney(position.averageCostEur * fx, currency)
      },
      {
        key: "quantity",
        label: "Qty",
        align: "right",
        render: ({ position }) => formatQuantity(position.quantity)
      },
      {
        key: "market-value",
        label: "Market value",
        align: "right",
        render: ({ position }) => formatMoney(position.marketValueEur * fx, currency)
      },
      {
        key: "day-change",
        label: "24h",
        align: "right",
        render: ({ asset }) => (
          <span className={trendClass(asset.change24hPercent)}>{formatPercent(asset.change24hPercent)}</span>
        )
      }
    ];
  }

  if (activeView === "Financials") {
    return [
      {
        key: "market-value",
        label: "Market value",
        align: "right",
        render: ({ position }) => formatMoney(position.marketValueEur * fx, currency)
      },
      {
        key: "invested",
        label: "Invested",
        align: "right",
        render: ({ investedEur }) => formatMoney(investedEur * fx, currency)
      },
      {
        key: "cost-basis",
        label: "Cost basis",
        align: "right",
        render: ({ position }) => formatMoney(position.averageCostEur * position.quantity * fx, currency)
      },
      {
        key: "currency",
        label: "Currency",
        align: "right",
        render: ({ asset }) => asset.currency
      },
      {
        key: "provider",
        label: "Provider",
        align: "right",
        render: ({ asset }) => asset.provider
      }
    ];
  }

  if (activeView === "Performance") {
    return [
      {
        key: "unrealized",
        label: "Unrealized gain",
        align: "right",
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
        render: ({ position }) => (
          <span className={trendClass(position.pnlPercent)}>{formatPercent(position.pnlPercent)}</span>
        )
      },
      {
        key: "daily-gain",
        label: "Daily gain",
        align: "right",
        render: ({ dailyGainEur }) => (
          <span className={trendClass(dailyGainEur)}>{formatMoney(dailyGainEur * fx, currency)}</span>
        )
      },
      {
        key: "daily-return",
        label: "Daily return",
        align: "right",
        render: ({ asset }) => (
          <span className={trendClass(asset.change24hPercent)}>{formatPercent(asset.change24hPercent)}</span>
        )
      },
      {
        key: "allocation",
        label: "Allocation",
        align: "right",
        render: ({ position }) => `${position.allocationPercent.toFixed(2)}%`
      }
    ];
  }

  if (activeView === "Risk") {
    return [
      {
        key: "asset-type",
        label: "Type",
        render: ({ asset }) => asset.type
      },
      {
        key: "current-move",
        label: "Current move",
        align: "right",
        render: ({ asset }) => (
          <span className={trendClass(asset.change24hPercent)}>{formatPercent(asset.change24hPercent)}</span>
        )
      },
      {
        key: "market-value",
        label: "Exposure",
        align: "right",
        render: ({ position }) => formatMoney(position.marketValueEur * fx, currency)
      },
      {
        key: "allocation",
        label: "Concentration",
        align: "right",
        render: ({ position }) => `${position.allocationPercent.toFixed(2)}%`
      },
      {
        key: "risk",
        label: "Risk note",
        align: "right",
        render: ({ asset, position }) => getRiskNote(asset, position)
      }
    ];
  }

  if (activeView === "Technicals") {
    return [
      {
        key: "trend",
        label: "Trend",
        render: ({ asset }) => (asset.change24hPercent > 0 ? "Up" : asset.change24hPercent < 0 ? "Down" : "Flat")
      },
      {
        key: "change",
        label: "24h",
        align: "right",
        render: ({ asset }) => (
          <span className={trendClass(asset.change24hPercent)}>{formatPercent(asset.change24hPercent)}</span>
        )
      },
      {
        key: "last-price",
        label: "Last price",
        align: "right",
        render: ({ asset }) => formatMoney(asset.priceEur * fx, currency)
      },
      {
        key: "exchange",
        label: "Exchange",
        align: "right",
        render: ({ asset }) => asset.exchange ?? "-"
      },
      {
        key: "external-id",
        label: "Provider ID",
        align: "right",
        render: ({ asset }) => asset.externalId
      }
    ];
  }

  return [
    {
      key: "allocation",
      label: "Allocation",
      align: "right",
      render: ({ position }) => `${position.allocationPercent.toFixed(2)}%`
    },
    {
      key: "quantity",
      label: "Qty",
      align: "right",
      render: ({ position }) => formatQuantity(position.quantity)
    },
    {
      key: "avg-price",
      label: "Avg price",
      align: "right",
      render: ({ position }) => formatMoney(position.averageCostEur * fx, currency)
    },
    {
      key: "invested",
      label: "Invested",
      align: "right",
      render: ({ investedEur }) => formatMoney(investedEur * fx, currency)
    },
    {
      key: "unrealized",
      label: "Unrealized gain",
      align: "right",
      render: ({ position }) => (
        <span className={trendClass(position.pnlEur)}>{formatMoney(position.pnlEur * fx, currency)}</span>
      )
    },
    {
      key: "daily-gain",
      label: "Daily gain",
      align: "right",
      render: ({ dailyGainEur }) => (
        <span className={trendClass(dailyGainEur)}>{formatMoney(dailyGainEur * fx, currency)}</span>
      )
    },
    {
      key: "total-gain",
      label: "Total gain",
      align: "right",
      render: ({ position }) => (
        <span className={trendClass(position.pnlEur)}>
          {formatMoney(position.pnlEur * fx, currency)}
          <span className="ml-2 text-xs">{formatPercent(position.pnlPercent)}</span>
        </span>
      )
    }
  ];
}

function getRiskNote(asset: Asset, position: Position) {
  if (position.quantity <= 0 || position.allocationPercent <= 0) return "No current exposure";
  if (asset.type === "MANUAL" || asset.type === "CASH") return "Manual/stale value";
  if (position.allocationPercent >= 25) return "High concentration";
  if (position.allocationPercent >= 10) return "Meaningful concentration";
  return "Included in portfolio risk";
}
