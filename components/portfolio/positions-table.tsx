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

export function PositionsTable({ positions, assets, currency }: PositionsTableProps) {
  const fx = currency === "EUR" ? 1 : 1.077;
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));

  return (
    <section>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Total holdings</h2>
          <div className="mt-8 flex flex-wrap gap-3 text-lg">
            {["Position", "Price", "Financials", "Performance", "Risk", "Technicals"].map(
              (tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    "rounded-[6px] px-4 py-2 text-zinc-300",
                    index === 0 && "bg-[#2c2c2f] font-semibold text-white"
                  )}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm text-zinc-400">
          Display sold
          <span className="flex h-6 w-11 items-center rounded-full bg-[#4a4a4d] p-1">
            <span className="h-4 w-4 rounded-full bg-[#161616]" />
          </span>
        </label>
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
                    <span className="block text-xs text-zinc-400">{positions.length} holdings</span>
                  </span>
                </div>
              </th>
              <th className="py-3 text-right font-medium">Allocation</th>
              <th className="py-3 text-right font-medium">Qty</th>
              <th className="py-3 text-right font-medium">Avg price</th>
              <th className="py-3 text-right font-medium">Invested</th>
              <th className="py-3 text-right font-medium">Unrealized gain</th>
              <th className="py-3 text-right font-medium">Daily gain</th>
              <th className="py-3 text-right font-medium">Total gain</th>
              <th className="py-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => {
              const asset = assetById.get(position.assetId);
              if (!asset) return null;
              const invested = position.marketValueEur - position.pnlEur;
              const dailyGain = position.marketValueEur * asset.change24hPercent * 0.01;

              return (
                <tr key={position.id} className="border-b border-[#202024] hover:bg-[#121214]">
                  <td className="py-3 pr-4">
                    <AssetPill asset={asset} />
                  </td>
                  <td className="py-3 text-right text-zinc-200">
                    {position.allocationPercent.toFixed(2)}%
                  </td>
                  <td className="py-3 text-right text-zinc-300">
                    {formatQuantity(position.quantity)}
                  </td>
                  <td className="py-3 text-right text-zinc-300">
                    {formatMoney(position.averageCostEur * fx, currency)}
                  </td>
                  <td className="py-3 text-right text-zinc-300">
                    {formatMoney(invested * fx, currency)}
                  </td>
                  <td className={cn("py-3 text-right", trendClass(position.pnlEur))}>
                    {formatMoney(position.pnlEur * fx, currency)}
                  </td>
                  <td className={cn("py-3 text-right", trendClass(dailyGain))}>
                    {formatMoney(dailyGain * fx, currency)}
                  </td>
                  <td className={cn("py-3 text-right", trendClass(position.pnlEur))}>
                    <span>{formatMoney(position.pnlEur * fx, currency)}</span>
                    <span className="ml-2 text-xs">{formatPercent(position.pnlPercent)}</span>
                  </td>
                  <td className="py-3 text-right">
                    <button type="button" className="text-zinc-400 hover:text-white">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
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
