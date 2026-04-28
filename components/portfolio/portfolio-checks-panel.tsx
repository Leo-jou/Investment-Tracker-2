import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import type { PortfolioCheck } from "@/lib/portfolio/checks";
import { cn } from "@/lib/utils";

type PortfolioChecksPanelProps = {
  checks: PortfolioCheck[];
};

export function PortfolioChecksPanel({ checks }: PortfolioChecksPanelProps) {
  if (checks.length === 0) return null;

  const warningCount = checks.filter((check) => check.severity === "warning").length;

  return (
    <section className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {warningCount > 0 ? (
            <AlertTriangle className="h-5 w-5 text-[#f6b342]" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-[#00c2a8]" />
          )}
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Portfolio checks</h2>
            <p className="text-sm text-zinc-500">
              {warningCount > 0
                ? `${warningCount} item${warningCount === 1 ? "" : "s"} need attention`
                : "No critical portfolio issues detected"}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {checks.map((check) => (
          <article
            key={check.id}
            className={cn(
              "rounded-[7px] border p-3",
              check.severity === "warning"
                ? "border-[#4a3820] bg-[#120d05]"
                : "border-[#202024] bg-[#070707]"
            )}
          >
            <div className="flex items-center gap-2">
              <Info
                className={cn(
                  "h-4 w-4",
                  check.severity === "warning" ? "text-[#f6b342]" : "text-[#3b82f6]"
                )}
              />
              <p className="text-sm font-semibold text-zinc-100">{check.title}</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{check.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
