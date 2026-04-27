import type { ReactNode } from "react";

import { TopBar } from "@/components/layout/top-bar";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-zinc-200">
      <TopBar />
      <main className="min-h-screen px-4 pb-12 pt-[88px] md:px-8 xl:px-11">
        {children}
      </main>
    </div>
  );
}
