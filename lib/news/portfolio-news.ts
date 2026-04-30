import type { DashboardData } from "../db/portfolio-repository.ts";
import type { Asset, AssetType, ManualPosition, PortfolioNewsItem } from "../types.ts";

type NewsSubject = {
  symbol: string;
  name: string;
  type: AssetType | "MANUAL";
  terms: string[];
};

type RssSource = {
  id: string;
  name: string;
  url: string;
  sourceType: PortfolioNewsItem["sourceType"];
  assetTypes?: AssetType[];
  priority: number;
};

type RssEntry = {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
};

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
};

const rssSources: RssSource[] = [
  {
    id: "coindesk",
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    sourceType: "crypto-rss",
    assetTypes: ["CRYPTO"],
    priority: 95
  },
  {
    id: "cointelegraph",
    name: "Cointelegraph",
    url: "https://cointelegraph.com/rss",
    sourceType: "crypto-rss",
    assetTypes: ["CRYPTO"],
    priority: 90
  },
  {
    id: "cnbc-markets",
    name: "CNBC Markets",
    url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    sourceType: "market-rss",
    assetTypes: ["STOCK", "ETF", "COMMODITY"],
    priority: 80
  },
  {
    id: "cnbc-business",
    name: "CNBC Business",
    url: "https://www.cnbc.com/id/10001147/device/rss/rss.html",
    sourceType: "market-rss",
    assetTypes: ["STOCK", "ETF", "COMMODITY"],
    priority: 75
  },
  {
    id: "marketwatch",
    name: "MarketWatch",
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    sourceType: "market-rss",
    assetTypes: ["STOCK", "ETF", "COMMODITY"],
    priority: 74
  },
  {
    id: "yahoo-finance",
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com/news/rssindex",
    sourceType: "market-rss",
    priority: 70
  },
  {
    id: "nasdaq-earnings",
    name: "Nasdaq Earnings",
    url: "https://www.nasdaq.com/feed/rssoutbound?category=Earnings",
    sourceType: "market-rss",
    assetTypes: ["STOCK", "ETF"],
    priority: 78
  },
  {
    id: "nasdaq-etfs",
    name: "Nasdaq ETFs",
    url: "https://www.nasdaq.com/feed/rssoutbound?category=ETFs",
    sourceType: "market-rss",
    assetTypes: ["ETF"],
    priority: 76
  },
  {
    id: "nasdaq-crypto",
    name: "Nasdaq Crypto",
    url: "https://www.nasdaq.com/feed/rssoutbound?category=Cryptocurrencies",
    sourceType: "crypto-rss",
    assetTypes: ["CRYPTO"],
    priority: 76
  }
];

const cikBySymbol: Record<string, string> = {
  AAPL: "0000320193",
  AMZN: "0001018724",
  COIN: "0001679788",
  GOOGL: "0001652044",
  META: "0001326801",
  MSFT: "0000789019",
  NVDA: "0001045810",
  SPY: "0000884394",
  TSLA: "0001318605"
};

const secForms = new Set(["8-K", "10-Q", "10-K", "6-K", "20-F", "40-F", "N-CSR", "NPORT-P"]);

export async function getPortfolioNews(data: DashboardData): Promise<PortfolioNewsItem[]> {
  const subjects = getNewsSubjects(data);
  if (subjects.length === 0) return [];

  const [rssItems, secItems, gdeltItems] = await Promise.all([
    fetchRssNews(subjects),
    fetchSecNews(subjects),
    fetchGdeltNews(subjects)
  ]);

  return dedupeNews([...secItems, ...rssItems, ...gdeltItems])
    .sort(sortNewsItems)
    .filter((item) => item.confidence >= 30)
    .reduce(selectDiverseNews(subjects, 12), []);
}

export function getNewsSubjects(data: DashboardData) {
  const assetById = new Map(data.assets.map((asset) => [asset.id, asset]));
  const assets = data.positions
    .map((position) => assetById.get(position.assetId))
    .filter((asset): asset is Asset => Boolean(asset))
    .slice(0, 12);
  const manualSubjects = data.manualPositions.slice(0, 4).map(manualPositionToSubject);

  return [...assets.map(assetToSubject), ...manualSubjects];
}

async function fetchRssNews(subjects: NewsSubject[]): Promise<PortfolioNewsItem[]> {
  const applicableSources = buildRssSources(subjects).filter((source) =>
    sourceApplies(source, subjects)
  );
  const sourceItems = await Promise.allSettled(
    applicableSources.map(async (source) => {
      const text = await fetchText(source.url, 6000);
      const entries = parseRssFeed(text).slice(0, 20);

      return entries.flatMap((entry) => {
        const scored = scoreEntry(entry.title, entry.summary, source, subjects);
        if (!scored) return [];

        return [
          {
            id: `${source.id}:${entry.url}`,
            symbol: scored.symbol,
            matchedSymbols: scored.matchedSymbols,
            title: entry.title,
            url: entry.url,
            source: source.name,
            publishedAt: entry.publishedAt,
            summary: entry.summary || scored.reason,
            provider: "rss" as const,
            sourceType: source.sourceType,
            confidence: Math.min(100, scored.score + source.priority / 10),
            reason: scored.reason
          }
        ];
      });
    })
  );

  return sourceItems.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

function buildRssSources(subjects: NewsSubject[]) {
  const dynamicSources = subjects.flatMap(dynamicRssSourcesForSubject);
  const byId = new Map<string, RssSource>();

  for (const source of [...dynamicSources, ...rssSources]) {
    if (!byId.has(source.id)) byId.set(source.id, source);
  }

  return [...byId.values()].slice(0, 24);
}

function dynamicRssSourcesForSubject(subject: NewsSubject): RssSource[] {
  const symbol = subject.symbol.toUpperCase().replace(/[^A-Z0-9.]/g, "");
  const sources: RssSource[] = [];

  if ((subject.type === "STOCK" || subject.type === "ETF") && /^[A-Z.]{1,8}$/.test(symbol)) {
    sources.push({
      id: `nasdaq-symbol-${symbol}`,
      name: `Nasdaq ${symbol}`,
      url: `https://www.nasdaq.com/feed/rssoutbound?symbol=${symbol.toLowerCase()}`,
      sourceType: "market-rss",
      assetTypes: [subject.type],
      priority: 84
    });
  }

  const yahooSymbol = yahooFinanceSymbol(subject);
  if (yahooSymbol) {
    sources.push({
      id: `yahoo-symbol-${yahooSymbol}`,
      name: `Yahoo Finance ${subject.symbol}`,
      url: `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(
        yahooSymbol
      )}&region=US&lang=en-US`,
      sourceType: subject.type === "CRYPTO" ? "crypto-rss" : "market-rss",
      assetTypes: subject.type === "MANUAL" ? undefined : [subject.type as AssetType],
      priority: 88
    });
  }

  const cryptoTag = cryptoNewsTag(symbol);
  if (subject.type === "CRYPTO" && cryptoTag) {
    sources.push({
      id: `cointelegraph-${cryptoTag}`,
      name: `Cointelegraph ${subject.symbol}`,
      url: `https://cointelegraph.com/rss/tag/${cryptoTag}`,
      sourceType: "crypto-rss",
      assetTypes: ["CRYPTO"],
      priority: 96
    });
  }

  return sources;
}

async function fetchSecNews(subjects: NewsSubject[]): Promise<PortfolioNewsItem[]> {
  const secUserAgent = process.env.SEC_USER_AGENT;
  if (!secUserAgent) return [];

  const secSubjects = subjects.filter((subject) => cikBySymbol[subject.symbol.toUpperCase()]);
  const results = await Promise.allSettled(
    secSubjects.map(async (subject) => {
      const cik = cikBySymbol[subject.symbol.toUpperCase()];
      const payload = (await fetchJson(
        `https://data.sec.gov/submissions/CIK${cik}.json`,
        6000,
        {
          "user-agent": secUserAgent
        }
      )) as {
        filings?: {
          recent?: Record<string, string[]>;
        };
      };
      const recent = payload.filings?.recent;
      if (!recent) return [];

      const forms = recent.form ?? [];
      const dates = recent.filingDate ?? [];
      const accessionNumbers = recent.accessionNumber ?? [];
      const primaryDocuments = recent.primaryDocument ?? [];

      return forms.slice(0, 30).flatMap((form, index) => {
        if (!secForms.has(form)) return [];
        const filingDate = dates[index];
        const accession = accessionNumbers[index];
        if (!filingDate || !accession || !isRecentDate(filingDate, 45)) return [];

        const accessionPath = accession.replaceAll("-", "");
        const document = primaryDocuments[index] ?? `${accession}-index.html`;
        const url = `https://www.sec.gov/Archives/edgar/data/${Number(
          cik
        )}/${accessionPath}/${document}`;

        return [
          {
            id: `sec:${subject.symbol}:${accession}`,
            symbol: subject.symbol,
            matchedSymbols: [subject.symbol],
            title: `${subject.name} filed ${form}`,
            url,
            source: "SEC EDGAR",
            publishedAt: new Date(`${filingDate}T12:00:00.000Z`).toISOString(),
            summary: `${form} filing for ${subject.symbol}. Review the official filing for details.`,
            provider: "sec" as const,
            sourceType: "filing" as const,
            confidence: 98,
            reason: "Official SEC filing matched by ticker CIK."
          }
        ];
      });
    })
  );

  return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

async function fetchGdeltNews(subjects: NewsSubject[]): Promise<PortfolioNewsItem[]> {
  if (process.env.NEWS_GDELT_ENABLED !== "true") return [];

  const query = buildGdeltQuery(subjects);
  if (!query) return [];

  const params = new URLSearchParams({
    query,
    mode: "artlist",
    format: "json",
    maxrecords: "15",
    timespan: "3d",
    sort: "datedesc"
  });

  try {
    const payload = (await fetchJson(
      `https://api.gdeltproject.org/api/v2/doc/doc?${params}`,
      7000
    )) as GdeltResponse;

    return (payload.articles ?? []).flatMap((article) => {
      const url = normalizeHttpsUrl(article.url);
      const title = article.title?.trim();
      if (!url || !title) return [];
      if (!isTrustedGdeltDomain(url, article.domain)) return [];

      const scored = scoreText(title, "", subjects);
      if (!scored || scored.score < 35) return [];

      return [
        {
          id: `gdelt:${url}`,
          symbol: scored.symbol,
          matchedSymbols: scored.matchedSymbols,
          title,
          url,
          source: article.domain ?? "GDELT",
          publishedAt: normalizeGdeltDate(article.seendate),
          summary: scored.reason,
          provider: "gdelt" as const,
          sourceType: "broad-news",
          confidence: Math.min(85, scored.score),
          reason: "Broad news match from GDELT."
        }
      ];
    });
  } catch {
    return [];
  }
}

function sourceApplies(source: RssSource, subjects: NewsSubject[]) {
  if (!source.assetTypes) return true;
  return subjects.some((subject) => source.assetTypes?.includes(subject.type as AssetType));
}

function scoreEntry(
  title: string,
  summary: string,
  source: RssSource,
  subjects: NewsSubject[]
) {
  const scored = scoreText(title, summary, subjects);
  if (!scored) return null;
  const sourceBonus = source.assetTypes?.some((type) =>
    subjects.some((subject) => subject.type === type && scored.matchedSymbols.includes(subject.symbol))
  )
    ? 12
    : 0;
  const score = scored.score + sourceBonus;
  return score >= 30 ? { ...scored, score } : null;
}

function scoreText(title: string, summary: string, subjects: NewsSubject[]) {
  const haystack = normalizeSearchText(`${title} ${summary}`);
  let best:
    | {
        symbol: string;
        matchedSymbols: string[];
        score: number;
        reason: string;
      }
    | null = null;

  for (const subject of subjects) {
    let score = 0;
    const matchedTerms = [];
    const normalizedTitle = normalizeSearchText(title);

    for (const term of subject.terms) {
      const normalizedTerm = normalizeSearchText(term);
      if (!normalizedTerm || normalizedTerm.length < 3) continue;
      if (containsNormalizedTerm(normalizedTitle, normalizedTerm)) {
        score += term.toUpperCase() === subject.symbol ? 45 : 35;
        matchedTerms.push(term);
      } else if (containsNormalizedTerm(haystack, normalizedTerm)) {
        score += term.toUpperCase() === subject.symbol ? 25 : 16;
        matchedTerms.push(term);
      }
    }

    if (score > (best?.score ?? 0)) {
      best = {
        symbol: subject.symbol,
        matchedSymbols: [subject.symbol],
        score,
        reason:
          matchedTerms.length > 0
            ? `Matched ${subject.symbol} via ${matchedTerms.slice(0, 3).join(", ")}.`
            : `Matched ${subject.symbol}.`
      };
    }
  }

  return best;
}

function parseRssFeed(xml: string): RssEntry[] {
  const blocks = findXmlBlocks(xml, "item");
  const entryBlocks = blocks.length > 0 ? blocks : findXmlBlocks(xml, "entry");

  return entryBlocks.flatMap((block) => {
    const title = cleanXmlText(readXmlTag(block, "title"));
    const rawLink =
      readXmlTag(block, "link") || readXmlAttribute(block, "link", "href") || readXmlTag(block, "guid");
    const url = normalizeHttpsUrl(cleanXmlText(rawLink));
    if (!title || !url) return [];

    const publishedAt = normalizeDate(
      cleanXmlText(readXmlTag(block, "pubDate") || readXmlTag(block, "published") || readXmlTag(block, "updated"))
    );
    const summary = truncate(
      cleanXmlText(
        readXmlTag(block, "description") ||
          readXmlTag(block, "summary") ||
          readXmlTag(block, "content:encoded")
      ),
      220
    );

    return [{ title, url, publishedAt, summary }];
  });
}

function findXmlBlocks(xml: string, tag: string) {
  return [...xml.matchAll(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, "gi"))].map(
    (match) => match[0]
  );
}

function readXmlTag(block: string, tag: string) {
  return block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i"))?.[1] ?? "";
}

function readXmlAttribute(block: string, tag: string, attribute: string) {
  return (
    block.match(new RegExp(`<${tag}\\b[^>]*\\s${attribute}=["']([^"']+)["'][^>]*>`, "i"))?.[1] ??
    ""
  );
}

function cleanXmlText(value: string) {
  return decodeXmlEntities(
    value
      .replaceAll("<![CDATA[", "")
      .replaceAll("]]>", "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function decodeXmlEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'");
}

function dedupeNews(items: PortfolioNewsItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const keys = [normalizeHttpsUrl(item.url), normalizeTitleKey(item.title)].filter(
      (key): key is string => Boolean(key)
    );
    if (keys.some((key) => seen.has(key))) return false;
    for (const key of keys) seen.add(key);
    return true;
  });
}

function sortNewsItems(left: PortfolioNewsItem, right: PortfolioNewsItem) {
  const dateOrder = new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  if (dateOrder !== 0) return dateOrder;
  return right.confidence - left.confidence;
}

function selectDiverseNews(subjects: NewsSubject[], limit: number) {
  return (selected: PortfolioNewsItem[], item: PortfolioNewsItem) => {
    if (selected.length >= limit) return selected;
    const symbol = item.symbol ?? "Market";
    const countForSymbol = selected.filter((candidate) => (candidate.symbol ?? "Market") === symbol)
      .length;
    const coveredSymbols = new Set(selected.map((candidate) => candidate.symbol).filter(Boolean));
    const knownSymbols = new Set(subjects.map((subject) => subject.symbol));
    const stillNeedsFirstMatch =
      knownSymbols.has(symbol) && !coveredSymbols.has(symbol) && item.confidence >= 35;

    if (stillNeedsFirstMatch || countForSymbol < 2) {
      selected.push(item);
    }

    return selected;
  };
}

function assetToSubject(asset: Asset): NewsSubject {
  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    terms: dedupeTerms([asset.symbol, asset.name, ...assetAliases(asset)])
  };
}

function manualPositionToSubject(position: ManualPosition): NewsSubject {
  const labelTerms = position.label
    .split(/[\s/,-]+/)
    .filter((term) => term.length >= 4)
    .slice(0, 4);
  return {
    symbol: position.label,
    name: position.label,
    type: "MANUAL",
    terms: dedupeTerms([position.label, ...labelTerms])
  };
}

function assetAliases(asset: Asset) {
  const symbol = asset.symbol.toUpperCase();
  const aliases: Record<string, string[]> = {
    BTC: ["Bitcoin"],
    BTCUSD: ["Bitcoin"],
    ETH: ["Ethereum", "Ether"],
    ETHUSD: ["Ethereum", "Ether"],
    SPY: ["S&P 500", "SPDR S&P 500", "SPDR S&P 500 ETF Trust"],
    VOO: ["S&P 500", "Vanguard S&P 500"],
    IVV: ["S&P 500", "iShares Core S&P 500"],
    QQQ: ["Nasdaq 100", "Invesco QQQ"],
    NVDA: ["Nvidia", "NVIDIA Corporation"],
    MSFT: ["Microsoft", "Microsoft Corporation"],
    XAU: ["Gold", "Gold spot"],
    "XAU/USD": ["Gold", "Gold spot"],
    GLD: ["Gold", "SPDR Gold Shares"]
  };
  return aliases[symbol] ?? [];
}

function cryptoNewsTag(symbol: string) {
  const tags: Record<string, string> = {
    BTC: "bitcoin",
    BTCUSD: "bitcoin",
    ETH: "ethereum",
    ETHUSD: "ethereum",
    SOL: "solana",
    SOLUSD: "solana",
    XRP: "ripple",
    XRPUSD: "ripple"
  };
  return tags[symbol];
}

function yahooFinanceSymbol(subject: NewsSubject) {
  const symbol = subject.symbol.toUpperCase();
  const mappings: Record<string, string> = {
    "XAU/USD": "GC=F",
    XAU: "GC=F",
    GOLD: "GC=F",
    "EUR/USD": "EURUSD=X",
    EURUSD: "EURUSD=X",
    BTC: "BTC-USD",
    BTCUSD: "BTC-USD",
    ETH: "ETH-USD",
    ETHUSD: "ETH-USD"
  };

  if (mappings[symbol]) return mappings[symbol];
  if (subject.type === "STOCK" || subject.type === "ETF") return symbol;
  return null;
}

function dedupeTerms(terms: string[]) {
  return [...new Set(terms.map((term) => term.trim()).filter((term) => term.length >= 2))];
}

function buildGdeltQuery(subjects: NewsSubject[]) {
  const terms = subjects
    .flatMap((subject) =>
      subject.type === "MANUAL" || subject.type === "CASH" ? [] : subject.terms.slice(0, 3)
    )
    .filter((term) => term.length >= 3 && !["USD", "EUR"].includes(term.toUpperCase()))
    .slice(0, 12);

  if (terms.length === 0) return "";
  return `(${terms.map((term) => `"${term.replaceAll("\"", "")}"`).join(" OR ")})`;
}

async function fetchText(url: string, timeoutMs: number, headers?: HeadersInit) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 900 }
  });
  if (!response.ok) throw new Error(`News source returned ${response.status}`);
  return response.text();
}

async function fetchJson(url: string, timeoutMs: number, headers?: HeadersInit) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 900 }
  });
  if (!response.ok) throw new Error(`News source returned ${response.status}`);
  return response.json();
}

function normalizeHttpsUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isTrustedGdeltDomain(url: string, reportedDomain?: string) {
  const trustedDomains = new Set([
    "apnews.com",
    "bloomberg.com",
    "cnbc.com",
    "coindesk.com",
    "cointelegraph.com",
    "investing.com",
    "marketwatch.com",
    "nasdaq.com",
    "reuters.com"
  ]);
  const urlDomain = normalizeDomain(new URL(url).hostname);
  const sourceDomain = normalizeDomain(reportedDomain);
  return trustedDomains.has(urlDomain) || trustedDomains.has(sourceDomain);
}

function normalizeDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeGdeltDate(value?: string) {
  if (!value) return new Date().toISOString();
  const normalized = value.replace(
    /^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})Z?$/,
    "$1-$2-$3T$4:$5:$6Z"
  );
  return normalizeDate(normalized);
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/&amp;/g, "&").replace(/[^a-z0-9+&]+/g, " ").trim();
}

function normalizeTitleKey(value: string) {
  return normalizeSearchText(value)
    .replace(/\b[-+]?\d+(\.\d+)?%?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsNormalizedTerm(text: string, term: string) {
  if (!term) return false;
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escapedTerm}(?=\\s|$)`, "i").test(text);
}

function normalizeDomain(value?: string) {
  return value?.toLowerCase().replace(/^www\./, "") ?? "";
}

function truncate(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).trim()}...`;
}

function isRecentDate(value: string, maxAgeDays: number) {
  const time = new Date(`${value}T00:00:00.000Z`).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= maxAgeDays * 86_400_000;
}
