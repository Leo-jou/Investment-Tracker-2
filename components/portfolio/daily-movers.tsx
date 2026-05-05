import { Badge } from "@/components/ui/badge";

export function DailyMovers() {
  return (
    <section>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Daily movers</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            24h gainers and losers are hidden until provider-backed change data is stored.
          </p>
        </div>
        <Badge>Not connected</Badge>
      </div>
    </section>
  );
}
