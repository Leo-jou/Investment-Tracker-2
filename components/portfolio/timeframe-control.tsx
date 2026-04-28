"use client";

import { ChevronDown } from "lucide-react";

import { timeframeOptions, type TimeframeKey } from "@/lib/portfolio/timeframes";
import { cn } from "@/lib/utils";

type TimeframeControlProps = {
  value: TimeframeKey;
  onChange: (value: TimeframeKey) => void;
};

const primaryTimeframes: TimeframeKey[] = ["1D", "1W", "1M", "YTD", "1Y", "ALL"];
const secondaryTimeframes: TimeframeKey[] = ["3M", "6M"];

export function TimeframeControl({ value, onChange }: TimeframeControlProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-zinc-500">Timeframe</span>
      <div className="flex flex-wrap gap-1 rounded-[8px] border border-[#2b2b2f] bg-black p-1">
        {primaryTimeframes.map((key) => {
          const option = timeframeOptions.find((candidate) => candidate.key === key)!;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "h-8 rounded-[6px] px-3 text-sm text-zinc-400 hover:bg-[#17171a] hover:text-zinc-100",
                value === key && "bg-white font-semibold text-black hover:bg-zinc-200 hover:text-black"
              )}
            >
              {option.shortLabel}
            </button>
          );
        })}
        <label className="relative">
          <span className="sr-only">More timeframes</span>
          <select
            value={secondaryTimeframes.includes(value) ? value : ""}
            onChange={(event) => {
              const next = event.target.value as TimeframeKey;
              if (next) onChange(next);
            }}
            className={cn(
              "h-8 appearance-none rounded-[6px] bg-transparent pl-3 pr-7 text-sm text-zinc-400 hover:bg-[#17171a] hover:text-zinc-100",
              secondaryTimeframes.includes(value) && "bg-white font-semibold text-black"
            )}
          >
            <option value="">More</option>
            {secondaryTimeframes.map((key) => {
              const option = timeframeOptions.find((candidate) => candidate.key === key)!;
              return (
                <option key={key} value={key}>
                  {option.shortLabel}
                </option>
              );
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-zinc-500" />
        </label>
      </div>
    </div>
  );
}
