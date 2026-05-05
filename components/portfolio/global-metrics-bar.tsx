import { PortfolioSummaryCard } from "@/components/portfolio/portfolio-summary-card";
import { formatMoney } from "@/lib/format";
import type { TimeframeStats } from "@/lib/portfolio/timeframes";
import type { Currency, Portfolio } from "@/lib/types";

type GlobalMetricsBarProps = {
  portfolio: Portfolio;
  currency: Currency;
  timeframeStats: TimeframeStats;
};

export function GlobalMetricsBar({ portfolio, currency, timeframeStats }: GlobalMetricsBarProps) {
  const value = currency === "EUR" ? portfolio.valueEur : portfolio.valueUsd;
  const fallbackEurUsd =
    portfolio.valueEur > 0 && portfolio.valueUsd > 0 ? portfolio.valueUsd / portfolio.valueEur : 1.077;
  const convertFromEur = (amount: number) => (currency === "EUR" ? amount : amount * fallbackEurUsd);
  const netContributions =
    currency === "EUR"
      ? portfolio.netContributionsEur
      : (portfolio.netContributionsUsd ?? convertFromEur(portfolio.netContributionsEur));
  const openPositionPnl =
    currency === "EUR"
      ? (portfolio.unrealizedGainEur ?? portfolio.pnlEur)
      : (portfolio.unrealizedGainUsd ?? convertFromEur(portfolio.pnlEur));
  const realizedGain =
    currency === "EUR"
      ? (portfolio.realizedGainEur ?? 0)
      : (portfolio.realizedGainUsd ?? convertFromEur(portfolio.realizedGainEur ?? 0));
  const periodValueChange = timeframeStats.valueChange;
  const periodTwr = timeframeStats.twr;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <PortfolioSummaryCard
        label="Portfolio value"
        value={value}
        currency={currency}
        detail={`Net contributions ${formatMoney(netContributions, currency)}`}
        secondaryDetail={
          periodValueChange === null
            ? `${timeframeStats.label}: not enough snapshots for a period change`
            : `${timeframeStats.label} value change ${formatMoney(periodValueChange, currency)}`
        }
        tooltip="Current portfolio value includes priced holdings, cash, and manual positions. Net contributions are deposits minus withdrawals; buys and sells are excluded."
        calculationLines={[
          "Value = priced holdings + cash + manual positions.",
          "Net contributions = deposits - withdrawals.",
          "Trades move cash into holdings and do not count as contributions."
        ]}
      />
      <PortfolioSummaryCard
        label="Open-position P&L"
        value={openPositionPnl}
        currency={currency}
        detail="Current holdings vs cost basis"
        tooltip="Open-position P&L is the current value of transaction-backed open holdings minus their remaining average-cost basis. Manual positions are included in portfolio value, but not this metric because they have no cost basis."
        calculationLines={[
          "Open-position P&L = current open holding value - remaining average-cost basis.",
          "Closed gains from sells are shown separately as realized P&L."
        ]}
        emphasis={openPositionPnl >= 0 ? "positive" : "negative"}
      />
      <PortfolioSummaryCard
        label="Realized P&L"
        value={realizedGain}
        currency={currency}
        detail="Closed-position gain or loss from sells"
        tooltip="Realized P&L uses the same average-cost method as holdings. Sell fees reduce proceeds; buy fees are included in cost basis."
        calculationLines={[
          "Realized P&L = net sell proceeds - average cost of sold quantity.",
          "This is a performance metric, not a tax calculation."
        ]}
        emphasis={realizedGain >= 0 ? "positive" : "negative"}
      />
      <PortfolioSummaryCard
        label="TWR performance"
        value={periodTwr}
        currency={currency}
        valueKind="percent"
        detail={
          periodTwr === null
            ? `${timeframeStats.label}: needs at least two snapshots`
            : `${timeframeStats.label} cash-flow-neutral return`
        }
        tooltip="Time-weighted return measures investment performance while excluding external deposits and withdrawals. It is the primary performance metric."
        calculationLines={[
          "TWR compounds snapshot-to-snapshot returns.",
          "External cash flows are removed from the return calculation.",
          "Sparse timeframes show a data-quality message instead of a fake value."
        ]}
        emphasis={periodTwr === null ? "neutral" : periodTwr >= 0 ? "positive" : "negative"}
      />
    </div>
  );
}
