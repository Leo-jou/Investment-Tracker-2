import { PageBackLink } from "@/components/layout/page-back-link";
import { ManualPositionsCard } from "@/components/portfolio/manual-positions-card";
import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";

export default async function ManualPositionsPage() {
  const email = await requireSessionEmail();
  const data = await getDashboardDataForEmail(email);

  return (
    <div className="space-y-10">
      <div>
        <PageBackLink />
        <h1 className="text-4xl font-bold">Manual positions</h1>
        <p className="mt-3 max-w-2xl text-zinc-500">
          Track external holdings, cash balances, private investments, and any value that does not
          have a price feed.
        </p>
      </div>
      <ManualPositionsCard
        positions={data.manualPositions}
        currency="USD"
        portfolioId={data.portfolio.id}
      />
    </div>
  );
}
