import { formatMoney, formatPercent, trendClass } from "@/lib/format";
import type { Currency } from "@/lib/types";
import { cn } from "@/lib/utils";

type PortfolioSummaryCardProps = {
  label: string;
  value: number;
  currency: Currency;
  detail?: string;
  change?: number;
  emphasis?: "neutral" | "positive" | "negative";
  valueKind?: "money" | "percent";
};

export function PortfolioSummaryCard({
  label,
  value,
  currency,
  detail,
  change,
  emphasis = "neutral",
  valueKind = "money"
}: PortfolioSummaryCardProps) {
  return (
    <section className="min-h-[118px] rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <p className="text-base font-medium text-zinc-300">{label}</p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <p
          className={cn(
            "text-3xl font-bold leading-none tracking-normal text-zinc-100",
            emphasis === "positive" && "text-[#00c2a8]",
            emphasis === "negative" && "text-[#ff4d64]"
          )}
        >
          {valueKind === "money" ? formatMoney(value, currency) : formatPercent(value)}
        </p>
        {change !== undefined && (
          <p className={cn("text-base font-medium", trendClass(change))}>
            {formatPercent(change)}
          </p>
        )}
      </div>
      {detail && <p className="mt-3 text-sm text-zinc-500">{detail}</p>}
    </section>
  );
}
