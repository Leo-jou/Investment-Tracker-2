import type * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-[6px] bg-[#2f2f33] px-2.5 text-xs font-semibold text-zinc-100",
        className
      )}
      {...props}
    />
  );
}
