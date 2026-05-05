import { PageBackLink } from "@/components/layout/page-back-link";
import { PersistenceModeBanner } from "@/components/portfolio/persistence-mode-banner";
import { QuickAddTransactionForm } from "@/components/portfolio/quick-add-transaction-form";
import { TransactionImportPanel } from "@/components/portfolio/transaction-import-panel";
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
  const disabledReason = data.persistenceMode === "demo" ? data.persistenceNotice : undefined;

  return (
    <div className="space-y-10">
      <PersistenceModeBanner mode={data.persistenceMode} message={data.persistenceNotice} />
      <div>
        <PageBackLink />
        <h1 className="text-4xl font-bold">Transactions</h1>
        <p className="mt-3 max-w-2xl text-zinc-500">
          Fast manual entry with clean separation between trades, cash flows, transfers, and manual
          valuations.
        </p>
      </div>
      <TransactionImportPanel portfolioId={data.portfolio.id} disabledReason={disabledReason} />
      <QuickAddTransactionForm
        portfolioId={data.portfolio.id}
        initialType={params.type}
        disabledReason={disabledReason}
      />
      <TransactionsTable transactions={data.transactions} assets={data.assets} currency="USD" />
    </div>
  );
}
