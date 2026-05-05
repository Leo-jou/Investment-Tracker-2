import { Badge } from "@/components/ui/badge";
import type { Asset } from "@/lib/types";

export function AssetPill({ asset }: { asset: Asset }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black"
        style={{ backgroundColor: asset.color }}
      >
        {asset.symbol.slice(0, 1)}
      </span>
      <Badge className="shrink-0">{asset.symbol}</Badge>
      <span className="truncate text-sm text-zinc-200">{asset.name}</span>
      {(asset.provider === "mock" || asset.provider === "manual") && (
        <span className="shrink-0 rounded-[4px] border border-[#4a3820] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#f6b342]">
          saved price
        </span>
      )}
    </div>
  );
}
