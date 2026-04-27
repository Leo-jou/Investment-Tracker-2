import { Badge } from "@/components/ui/badge";
import { assets } from "@/lib/mock-data";
import { formatPercent, trendClass } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DailyMovers() {
  const sorted = [...assets]
    .filter((asset) => asset.type !== "CASH")
    .sort((a, b) => b.change24hPercent - a.change24hPercent);
  const gainers = sorted.filter((asset) => asset.change24hPercent >= 0).slice(0, 4);
  const losers = sorted.filter((asset) => asset.change24hPercent < 0).slice(0, 4);

  return (
    <div className="grid gap-16 xl:grid-cols-2">
      <MoverColumn title="Daily gainers" items={gainers} />
      <MoverColumn title="Daily losers" items={losers} />
    </div>
  );
}

function MoverColumn({ title, items }: { title: string; items: typeof assets }) {
  return (
    <section>
      <h2 className="text-3xl font-bold">{title}</h2>
      <div className="mt-8 space-y-4">
        {items.map((asset) => {
          const width = Math.max(4, Math.min(100, Math.abs(asset.change24hPercent) * 35));
          const positive = asset.change24hPercent >= 0;

          return (
            <div key={asset.id} className="grid grid-cols-[136px_1fr_76px] items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-black"
                  style={{ backgroundColor: asset.color }}
                >
                  {asset.symbol[0]}
                </span>
                <Badge>{asset.symbol}</Badge>
              </div>
              <div className="h-2 rounded-full bg-[#303033]">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    positive ? "bg-[#00c2a8]" : "bg-[#ff3d57]"
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
              <p className={cn("text-right font-medium", trendClass(asset.change24hPercent))}>
                {formatPercent(asset.change24hPercent)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
