import type * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[6px] border border-[#2b2b2f] bg-[#050505] px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#3b82f6]",
        className
      )}
      {...props}
    />
  );
}
