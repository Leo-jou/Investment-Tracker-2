"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Currency } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CurrencyToggle({
  currency,
  onCurrencyChange
}: {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["EUR", "USD"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onCurrencyChange(item)}
          className={cn(
            "h-9 rounded-[6px] bg-[#2c2c2f] px-4 text-sm font-semibold text-zinc-300",
            currency === item && "bg-white text-black"
          )}
        >
          {item}
        </button>
      ))}
      <Button variant="subtle" size="sm">
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
}
