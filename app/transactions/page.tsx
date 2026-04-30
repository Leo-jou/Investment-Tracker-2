import { PageBackLink } from "@/components/layout/page-back-link";
import { QuickAddTransactionForm } from "@/components/portfolio/quick-add-transaction-form";
import { TransactionsTable } from "@/components/portfolio/transactions-table";
import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const email = await requireSessionEmail();
  const params = await searchParams;
  const data = await getDashboardDataForEmail(email);

  return (
    <div className="space-y-10">
      <div>
        <PageBackLink />
        <h1 className="text-4xl font-bold">Transactions</h1>
        <p className="mt-3 max-w-2xl text-zinc-500">
          Fast manual entry with clean separation between trades, cash flows, transfers, and manual
          valuations.
        </p>
      </div>
      <QuickAddTransactionForm portfolioId={data.portfolio.id} initialType={params.type} />
      <TransactionsTable transactions={data.transactions} assets={data.assets} currency="USD" />
    </div>
  );
}
