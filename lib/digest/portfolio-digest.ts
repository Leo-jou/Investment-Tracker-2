import type { DashboardData } from "../db/portfolio-repository.ts";
import { formatMoney, formatPercent } from "../format.ts";
import type { PortfolioDigest, PortfolioNewsItem } from "../types.ts";

export function buildPortfolioDigest(
  data: DashboardData,
  news: PortfolioNewsItem[] = []
): PortfolioDigest {
  const generatedAt = new Date().toISOString();
  const topPositions = [...data.positions]
    .sort((left, right) => right.marketValueUsd - left.marketValueUsd)
    .slice(0, 5);
  const latestSnapshot = data.snapshots.at(-1);
  const recentTransactions = data.transactions.slice(0, 5);
  const highlights = [
    `Portfolio value: ${formatMoney(data.portfolio.valueUsd, "USD")} (${formatMoney(
      data.portfolio.valueEur,
      "EUR"
    )}).`,
    `TWR: ${formatPercent(data.portfolio.twr)}. P&L: ${formatMoney(data.portfolio.pnlEur, "EUR")}.`,
    `Net contributions: ${formatMoney(data.portfolio.netContributionsEur, "EUR")}.`,
    latestSnapshot
      ? `Latest snapshot: ${latestSnapshot.date}, value ${formatMoney(latestSnapshot.valueUsd, "USD")}.`
      : "No portfolio snapshots yet."
  ];

  const positionLines = topPositions.map((position) => {
    const asset = data.assets.find((candidate) => candidate.id === position.assetId);
    return `${asset?.symbol ?? "Unknown"}: ${formatMoney(position.marketValueUsd, "USD")} (${position.allocationPercent.toFixed(2)}%)`;
  });
  const transactionLines = recentTransactions.map((transaction) =>
    `${transaction.date}: ${transaction.type} ${transaction.assetSymbol ?? ""} ${formatMoney(
      transaction.grossAmount,
      transaction.currency
    )}`.trim()
  );
  const newsLines = news.slice(0, 5).map((item) => `${item.symbol ?? "Market"}: ${item.title}`);
  const subject = `FolioCore digest - ${data.portfolio.name}`;
  const text = [
    subject,
    "",
    "Highlights",
    ...highlights.map((line) => `- ${line}`),
    "",
    "Top positions",
    ...positionLines.map((line) => `- ${line}`),
    "",
    "Recent transactions",
    ...(transactionLines.length ? transactionLines : ["No recent transactions."]).map((line) => `- ${line}`),
    "",
    "Portfolio news",
    ...(newsLines.length ? newsLines : ["No portfolio headlines available."]).map((line) => `- ${line}`)
  ].join("\n");

  return {
    generatedAt,
    subject,
    text,
    html: renderDigestHtml(subject, highlights, positionLines, transactionLines, news),
    highlights,
    news
  };
}

function renderDigestHtml(
  subject: string,
  highlights: string[],
  positionLines: string[],
  transactionLines: string[],
  news: PortfolioNewsItem[]
) {
  return `<!doctype html>
<html>
  <body style="font-family: Inter, Arial, sans-serif; background:#050505; color:#f4f4f5; padding:24px;">
    <main style="max-width:720px; margin:0 auto;">
      <h1 style="font-size:28px; margin:0 0 24px;">${escapeHtml(subject)}</h1>
      ${renderList("Highlights", highlights)}
      ${renderList("Top positions", positionLines)}
      ${renderList("Recent transactions", transactionLines.length ? transactionLines : ["No recent transactions."])}
      <h2 style="font-size:20px; margin-top:28px;">Portfolio news</h2>
      <ul style="padding-left:18px;">
        ${
          news.length
            ? news
                .slice(0, 5)
                .map(
                  (item) =>
                    `<li style="margin-bottom:10px;"><a style="color:#60a5fa;" href="${escapeHtml(
                      item.url
                    )}">${escapeHtml(item.title)}</a><br><span style="color:#a1a1aa;">${escapeHtml(
                      item.source
                    )}</span></li>`
                )
                .join("")
            : `<li>No portfolio headlines available.</li>`
        }
      </ul>
    </main>
  </body>
</html>`;
}

function renderList(title: string, lines: string[]) {
  return `<h2 style="font-size:20px; margin-top:28px;">${escapeHtml(title)}</h2><ul style="padding-left:18px;">${lines
    .map((line) => `<li style="margin-bottom:8px;">${escapeHtml(line)}</li>`)
    .join("")}</ul>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
