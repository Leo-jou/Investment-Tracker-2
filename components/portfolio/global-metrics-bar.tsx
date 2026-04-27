import { PortfolioSummaryCard } from "@/components/portfolio/portfolio-summary-card";
import { formatMoney } from "@/lib/format";
import type { Currency, Portfolio } from "@/lib/types";

type GlobalMetricsBarProps = {
  portfolio: Portfolio;
  currency: Currency;
};

export function GlobalMetricsBar({ portfolio, currency }: GlobalMetricsBarProps) {
  const value = currency === "EUR" ? portfolio.valueEur : portfolio.valueUsd;
  const pnl = currency === "EUR" ? portfolio.pnlEur : portfolio.pnlEur * 1.077;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <PortfolioSummaryCard
        label="Portfolio value"
        value={value}
        currency={currency}
        detail={`Net contributions ${formatMoney(
          currency === "EUR" ? portfolio.netContributionsEur : portfolio.netContributionsEur * 1.077,
          currency
        )}`}
      />
      <PortfolioSummaryCard
        label="Unrealized gain"
        value={pnl * 0.82}
        currency={currency}
        change={portfolio.twr}
        detail={`Last day ${formatMoney(value * portfolio.dayChangePercent * 0.01, currency)}`}
        emphasis={pnl >= 0 ? "positive" : "negative"}
      />
      <PortfolioSummaryCard
        label="Realized gain"
        value={pnl * 0.18}
        currency={currency}
        detail="Realized from sells only"
        emphasis={pnl >= 0 ? "positive" : "negative"}
      />
      <PortfolioSummaryCard
        label="TWR performance"
        value={portfolio.twr}
        currency={currency}
        valueKind="percent"
        change={portfolio.dayChangePercent}
        detail="Deposits and withdrawals excluded"
        emphasis={portfolio.twr >= 0 ? "positive" : "negative"}
      />
    </div>
  );
}
