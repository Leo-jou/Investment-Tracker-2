import type { DashboardData } from "../db/portfolio-repository.ts";
import { formatMoney, formatPercent, formatQuantity } from "../format.ts";
import { buildPortfolioChecks } from "../portfolio/checks.ts";
import type {
  PortfolioDigest,
  PortfolioDigestHighlight,
  PortfolioNewsItem,
  Position
} from "../types.ts";

type PortfolioDigestOptions = {
  baseUrl?: string;
};

export function buildPortfolioDigest(
  data: DashboardData,
  news: PortfolioNewsItem[] = [],
  options: PortfolioDigestOptions = {}
): PortfolioDigest {
  const generatedAt = new Date().toISOString();
  const topPositions = [...data.positions]
    .sort((left, right) => right.marketValueUsd - left.marketValueUsd)
    .slice(0, 8);
  const latestSnapshot = data.snapshots.at(-1);
  const twrLabel = latestSnapshot ? formatPercent(latestSnapshot.twr) : "Need snapshots";
  const recentTransactions = data.transactions.slice(0, 8);
  const highlightCards = buildHighlightCards(data);
  const highlights = [
    `Portfolio value: ${formatMoney(data.portfolio.valueUsd, "USD")} (${formatMoney(
      data.portfolio.valueEur,
      "EUR"
    )}).`,
    `Snapshot TWR: ${twrLabel}. Open-position P&L: ${formatMoney(
      data.portfolio.unrealizedGainEur ?? 0,
      "EUR"
    )}. Realized P&L: ${formatMoney(data.portfolio.realizedGainEur ?? 0, "EUR")}.`,
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
  const newsLines = news.slice(0, 8).map((item) => `${item.symbol ?? "Market"}: ${item.title}`);
  const subject = `FolioCore portfolio report - ${data.portfolio.name}`;
  const text = [
    subject,
    `Generated ${formatDateTime(generatedAt)}`,
    "",
    "Highlights",
    ...highlightCards.map((card) => `- ${card.label}: ${card.value}. ${card.detail}`),
    "",
    "Top positions",
    ...positionLines.map((line) => `- ${line}`),
    "",
    "Recent transactions",
    ...(transactionLines.length ? transactionLines : ["No recent transactions."]).map((line) => `- ${line}`),
    "",
    "Matched headlines",
    ...(newsLines.length ? newsLines : ["No matched headlines available."]).map((line) => `- ${line}`)
  ].join("\n");

  return {
    generatedAt,
    subject,
    text,
    html: renderDigestHtml(
      data,
      subject,
      generatedAt,
      highlightCards,
      topPositions,
      recentTransactions,
      news,
      options
    ),
    highlights,
    highlightCards,
    news
  };
}

function buildHighlightCards(data: DashboardData): PortfolioDigestHighlight[] {
  const topWinner = [...data.positions].sort((left, right) => right.pnlEur - left.pnlEur)[0];
  const topLoser = [...data.positions].sort((left, right) => left.pnlEur - right.pnlEur)[0];
  const latestSnapshot = data.snapshots.at(-1);
  const twrLabel = latestSnapshot ? formatPercent(latestSnapshot.twr) : "Need snapshots";
  const largestAllocation = data.allocations.reduce(
    (largest, item) => (item.percent > largest.percent ? item : largest),
    data.allocations[0] ?? { label: "None", percent: 0, value: 0, color: "#71717a" }
  );
  const checks = buildPortfolioChecks({
    positions: data.positions,
    assets: data.assets,
    manualPositions: data.manualPositions,
    snapshots: data.snapshots
  });
  const warningCount = checks.filter((check) => check.severity === "warning").length;

  return [
    {
      label: "Portfolio value",
      value: formatMoney(data.portfolio.valueUsd, "USD"),
      detail: `${twrLabel} snapshot TWR; ${formatMoney(
        data.portfolio.netContributionsUsd ?? data.portfolio.netContributionsEur,
        "USD"
      )} net contributions.`,
      tone: latestSnapshot ? (latestSnapshot.twr >= 0 ? "positive" : "negative") : "neutral"
    },
    {
      label: "Largest winner",
      value: positionLabel(data, topWinner),
      detail: topWinner
        ? `${formatMoney(topWinner.pnlEur, "EUR")} open-position P&L.`
        : "No priced holdings yet.",
      tone: topWinner && topWinner.pnlEur >= 0 ? "positive" : "neutral"
    },
    {
      label: "Largest drag",
      value: positionLabel(data, topLoser),
      detail: topLoser
        ? `${formatMoney(topLoser.pnlEur, "EUR")} open-position P&L.`
        : "No priced holdings yet.",
      tone: topLoser && topLoser.pnlEur < 0 ? "negative" : "neutral"
    },
    {
      label: "Concentration",
      value: largestAllocation.label,
      detail: `${largestAllocation.percent.toFixed(1)}% of current allocation.`,
      tone: largestAllocation.percent >= 50 ? "warning" : "neutral"
    },
    {
      label: "Data quality",
      value: warningCount > 0 ? `${warningCount} warning${warningCount === 1 ? "" : "s"}` : "No warnings",
      detail:
        checks.length > 0
          ? checks.map((check) => check.title).join("; ")
          : "No portfolio checks are currently active.",
      tone: warningCount > 0 ? "warning" : "positive"
    }
  ];
}

function renderDigestHtml(
  data: DashboardData,
  subject: string,
  generatedAt: string,
  highlightCards: PortfolioDigestHighlight[],
  topPositions: Position[],
  recentTransactions: DashboardData["transactions"],
  news: PortfolioNewsItem[],
  options: PortfolioDigestOptions
) {
  const assetById = new Map(data.assets.map((asset) => [asset.id, asset]));
  const allocationRows = data.allocations.slice(0, 8);
  const latestSnapshot = data.snapshots.at(-1);
  const twrLabel = latestSnapshot ? formatPercent(latestSnapshot.twr) : "Need snapshots";
  const csvHref = absoluteUrl(
    `/api/export?format=csv&portfolioId=${encodeURIComponent(data.portfolio.id)}`,
    options.baseUrl
  );
  const backupHref = absoluteUrl(
    `/api/export?format=backup-json&portfolioId=${encodeURIComponent(data.portfolio.id)}`,
    options.baseUrl
  );

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subject)}</title>
    <style>
      :root { color-scheme: dark; }
      body { margin:0; background:#050505; color:#f4f4f5; font-family: Inter, Arial, sans-serif; }
      main { max-width: 960px; margin: 0 auto; padding: 32px 24px 48px; }
      .brand { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
      .logo { width:42px; height:42px; border:1px solid #2b2b2f; border-radius:8px; position:relative; background:#090909; }
      .logo span { position:absolute; bottom:9px; width:5px; border-radius:999px; }
      .logo span:nth-child(1) { left:10px; height:22px; background:#3b82f6; }
      .logo span:nth-child(2) { left:18px; height:17px; background:#00c2a8; }
      .logo span:nth-child(3) { left:26px; height:25px; background:#f4f4f5; }
      h1 { margin:0; font-size:32px; letter-spacing:0; }
      h2 { margin:32px 0 14px; font-size:20px; }
      p { color:#a1a1aa; line-height:1.55; }
      .muted { color:#71717a; font-size:13px; }
      .grid { display:grid; gap:12px; grid-template-columns:repeat(4,minmax(0,1fr)); }
      .highlight-grid { display:grid; gap:12px; grid-template-columns:repeat(5,minmax(0,1fr)); }
      .card { border:1px solid #2b2b2f; border-radius:8px; padding:16px; background:#080808; }
      .label { color:#71717a; font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
      .value { margin-top:8px; font-size:24px; font-weight:700; color:#fff; }
      table { width:100%; border-collapse:collapse; font-size:13px; }
      th { color:#71717a; text-align:left; font-weight:600; border-bottom:1px solid #2b2b2f; padding:10px 8px; }
      td { border-bottom:1px solid #202024; padding:10px 8px; vertical-align:top; }
      .right { text-align:right; }
      .positive { color:#00c2a8; }
      .negative { color:#ff4777; }
      .warning { color:#f6b342; }
      .bar { height:8px; border-radius:999px; background:#2b2b2f; overflow:hidden; min-width:120px; }
      .fill { height:100%; background:#3b82f6; }
      a { color:#60a5fa; text-decoration:none; }
      .print-actions { margin-top:20px; display:flex; gap:10px; }
      .button { display:inline-block; border:1px solid #2b2b2f; border-radius:6px; padding:10px 12px; color:#f4f4f5; }
      @media (max-width: 900px) { .highlight-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
      @media (max-width: 760px) { .grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
      @media print {
        body { background:#fff; color:#111; }
        main { padding:0; max-width:none; }
        .card, .logo { border-color:#d4d4d8; background:#fff; }
        th, td { border-color:#e4e4e7; }
        p, .muted, .label, th { color:#52525b; }
        a { color:#111; }
        .print-actions { display:none; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="brand">
        <div class="logo"><span></span><span></span><span></span></div>
        <div>
          <h1>${escapeHtml(subject)}</h1>
          <p class="muted">Generated ${escapeHtml(formatDateTime(generatedAt))}</p>
        </div>
      </div>

      <section class="grid">
        ${metricCard("Value", formatMoney(data.portfolio.valueUsd, "USD"))}
        ${metricCard("Snapshot TWR", twrLabel, latestSnapshot?.twr)}
        ${metricCard(
          "Open-position P&L",
          formatMoney(data.portfolio.unrealizedGainEur ?? 0, "EUR"),
          data.portfolio.unrealizedGainEur ?? 0
        )}
        ${metricCard(
          "Realized P&L",
          formatMoney(data.portfolio.realizedGainEur ?? 0, "EUR"),
          data.portfolio.realizedGainEur ?? 0
        )}
        ${metricCard("Holdings", String(data.positions.length + data.manualPositions.length))}
      </section>

      <h2>Highlights</h2>
      <div class="highlight-grid">
        ${highlightCards
          .map(
            (card) => `<div class="card">
              <p class="label">${escapeHtml(card.label)}</p>
              <p class="value ${toneClass(card.tone)}">${escapeHtml(card.value)}</p>
              <p>${escapeHtml(card.detail)}</p>
            </div>`
          )
          .join("")}
      </div>

      <h2>Allocation</h2>
      <div class="card">
        <table>
          <thead><tr><th>Bucket</th><th class="right">Allocation</th><th>Weight</th></tr></thead>
          <tbody>
            ${allocationRows
              .map(
                (allocation) => `<tr>
                  <td>${escapeHtml(allocation.label)}</td>
                  <td class="right">${allocation.percent.toFixed(2)}%</td>
                  <td><div class="bar"><div class="fill" style="width:${Math.max(0, Math.min(100, allocation.percent)).toFixed(2)}%"></div></div></td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <h2>Top positions</h2>
      <div class="card">
        <table>
          <thead><tr><th>Asset</th><th class="right">Qty</th><th class="right">Value</th><th class="right">Open P&L</th><th class="right">Allocation</th></tr></thead>
          <tbody>
            ${topPositions
              .map((position) => {
                const asset = assetById.get(position.assetId);
                return `<tr>
                  <td><strong>${escapeHtml(asset?.symbol ?? "Unknown")}</strong><br><span class="muted">${escapeHtml(asset?.name ?? "")}</span></td>
                  <td class="right">${formatQuantity(position.quantity)}</td>
                  <td class="right">${formatMoney(position.marketValueUsd, "USD")}</td>
                  <td class="right ${position.pnlEur >= 0 ? "positive" : "negative"}">${formatMoney(position.pnlEur, "EUR")}</td>
                  <td class="right">${position.allocationPercent.toFixed(2)}%</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>

      <h2>Matched headlines</h2>
      <div class="card">
        ${
          news.length
            ? news
                .slice(0, 8)
                .map(
                  (item) =>
                    `<p><strong>${escapeHtml(item.symbol ?? "Market")}</strong>: <a href="${escapeHtml(
                      item.url
                    )}">${escapeHtml(item.title)}</a><br><span class="muted">${escapeHtml(
                      sourceTypeLabel(item.sourceType)
                    )} · ${escapeHtml(item.source)} · ${escapeHtml(item.reason)}</span></p>`
                )
                .join("")
            : `<p>No matched headlines available.</p>`
        }
      </div>

      <h2>Recent transactions</h2>
      <div class="card">
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Asset</th><th class="right">Amount</th><th>Platform</th></tr></thead>
          <tbody>
            ${
              recentTransactions.length
                ? recentTransactions
                    .map(
                      (transaction) => `<tr>
                        <td>${escapeHtml(transaction.date)}</td>
                        <td>${escapeHtml(transaction.type)}</td>
                        <td>${escapeHtml(transaction.assetSymbol ?? "")}</td>
                        <td class="right">${formatMoney(transaction.grossAmount, transaction.currency)}</td>
                        <td>${escapeHtml(transaction.platform ?? "")}</td>
                      </tr>`
                    )
                    .join("")
                : `<tr><td colspan="5">No recent transactions.</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <p class="muted">This report is a portfolio backup and review aid, not financial or tax advice.</p>
      <div class="print-actions">
        <a class="button" href="${escapeHtml(csvHref)}">Download CSV</a>
        <a class="button" href="${escapeHtml(backupHref)}">Download backup JSON</a>
        <a class="button" href="#" onclick="window.print(); return false;">Print or save PDF</a>
      </div>
    </main>
  </body>
</html>`;
}

function metricCard(label: string, value: string, trend?: number) {
  const trendClass = typeof trend === "number" ? (trend >= 0 ? "positive" : "negative") : "";
  return `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="value ${trendClass}">${escapeHtml(value)}</div></div>`;
}

function positionLabel(data: DashboardData, position?: Position) {
  if (!position) return "None";
  const asset = data.assets.find((candidate) => candidate.id === position.assetId);
  return asset?.symbol ?? "Unknown";
}

function toneClass(tone: PortfolioDigestHighlight["tone"]) {
  if (tone === "positive") return "positive";
  if (tone === "negative") return "negative";
  if (tone === "warning") return "warning";
  return "";
}

function sourceTypeLabel(sourceType: PortfolioNewsItem["sourceType"]) {
  if (sourceType === "filing") return "Official US filing";
  if (sourceType === "broad-news") return "Optional broad news search";
  return "News feed";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(value));
}

function absoluteUrl(path: string, baseUrl?: string) {
  if (!baseUrl) return path;
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
