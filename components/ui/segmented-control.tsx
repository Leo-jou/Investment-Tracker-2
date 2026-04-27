"use client";

import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

type SegmentedControlProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SegmentedControl({
  options,
  value,
  onChange,
  className
}: SegmentedControlProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 rounded-full bg-[#2c2c2f] px-4 text-sm text-zinc-300 transition-colors hover:bg-[#3a3a3f]",
            option.value === value && "bg-white text-black hover:bg-zinc-200"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
