import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".vercel/.env.production.local", quiet: true });
config({ quiet: true });

const defaultBaseUrl = "https://foliocore.vercel.app";

const baseUrl = (process.env.SMOKE_BASE_URL ?? defaultBaseUrl).replace(/\/$/, "");
const email =
  process.env.SMOKE_EMAIL ??
  (process.env.APP_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)[0];

if (!email) {
  throw new Error("Set SMOKE_EMAIL or APP_ALLOWED_EMAILS before running the production smoke test.");
}

const checks: string[] = [];

async function main() {
  await expectStatus("/login", 200);
  await expectRedirect("/transactions", "/login?next=%2Ftransactions");

  const cookie = await login();
  await expectTransactionsApi(cookie);
  if (process.env.SMOKE_REFRESH === "1") {
    await expectPriceRefresh(cookie);
  }
  if (process.env.SMOKE_QUOTE === "1") {
    await expectLiveQuote(cookie);
  }
  if (process.env.SMOKE_QUOTE_MATRIX === "1") {
    await expectLiveQuoteMatrix(cookie);
  }
  if (process.env.SMOKE_EXPORT === "1") {
    await expectExport(cookie);
  }
  if (process.env.SMOKE_NEWS === "1") {
    await expectNews(cookie);
  }
  if (process.env.SMOKE_DIGEST === "1") {
    await expectDigest(cookie);
  }
  await expectStatus("/dashboard", 200, cookie);

  console.log(`Production smoke passed for ${baseUrl}`);
  for (const check of checks) console.log(`- ${check}`);
}

async function expectStatus(path: string, expectedStatus: number, cookie?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: cookie ? { cookie } : undefined,
    redirect: "manual"
  });

  if (response.status !== expectedStatus) {
    throw new Error(`${path} returned ${response.status}; expected ${expectedStatus}.`);
  }

  checks.push(`${path} returned ${expectedStatus}`);
}

async function expectRedirect(path: string, expectedLocation: string) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  const location = response.headers.get("location") ?? "";

  if (response.status !== 307 || !location.endsWith(expectedLocation)) {
    throw new Error(`${path} did not redirect to ${expectedLocation}.`);
  }

  checks.push(`${path} redirected to login`);
}

async function login() {
  const formData = new FormData();
  formData.set("email", email);

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    body: formData,
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/api/auth/login returned ${response.status}; expected 200.`);
  }

  const cookies = getSetCookies(response.headers);
  const sessionCookie = cookies.find((cookie) => cookie.startsWith("foliocore_session="));

  if (!sessionCookie) {
    throw new Error("/api/auth/login did not return a session cookie.");
  }

  checks.push("/api/auth/login returned a session cookie");
  return sessionCookie.split(";")[0];
}

async function expectTransactionsApi(cookie: string) {
  const response = await fetch(`${baseUrl}/api/transactions`, {
    headers: { cookie },
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/api/transactions returned ${response.status}; expected 200.`);
  }

  const payload = (await response.json()) as { transactions?: unknown };

  if (!Array.isArray(payload.transactions)) {
    throw new Error("/api/transactions did not return a transactions array.");
  }

  checks.push(`/api/transactions returned ${payload.transactions.length} transactions`);
}

async function expectPriceRefresh(cookie: string) {
  const response = await fetch(`${baseUrl}/api/prices/refresh`, {
    method: "POST",
    headers: { cookie },
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/api/prices/refresh returned ${response.status}; expected 200.`);
  }

  const payload = (await response.json()) as {
    pricesUpdated?: unknown;
    fxPairsUpdated?: unknown;
    portfolioSnapshotsUpdated?: unknown;
    message?: unknown;
  };

  if (
    typeof payload.pricesUpdated !== "number" ||
    typeof payload.fxPairsUpdated !== "number" ||
    typeof payload.portfolioSnapshotsUpdated !== "number"
  ) {
    throw new Error("/api/prices/refresh did not return structured refresh counts.");
  }

  checks.push(
    `/api/prices/refresh updated ${payload.pricesUpdated} prices, ${payload.fxPairsUpdated} FX pairs, and ${payload.portfolioSnapshotsUpdated} portfolio snapshots`
  );
}

async function expectLiveQuote(cookie: string) {
  await expectQuote(cookie, {
    symbol: "BTC",
    name: "Bitcoin",
    type: "CRYPTO",
    currency: "USD",
    provider: "coingecko",
    externalId: "bitcoin"
  });

  checks.push("/api/assets/quote returned a live BTC quote");
}

async function expectLiveQuoteMatrix(cookie: string) {
  const requiredCases = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      type: "CRYPTO",
      currency: "USD",
      provider: "coingecko",
      externalId: "bitcoin"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      type: "CRYPTO",
      currency: "USD",
      provider: "coingecko",
      externalId: "ethereum"
    }
  ];
  const diagnosticCases = [
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      type: "STOCK",
      currency: "USD",
      provider: "twelve-data",
      externalId: "NVDA:NASDAQ",
      exchange: "NASDAQ"
    },
    {
      symbol: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      type: "ETF",
      currency: "USD",
      provider: "twelve-data",
      externalId: "SPY"
    },
    {
      symbol: "XAU/USD",
      name: "Gold Spot / U.S. Dollar",
      type: "COMMODITY",
      currency: "USD",
      provider: "twelve-data",
      externalId: "XAU/USD"
    }
  ];

  const results = [];
  for (const quoteCase of requiredCases) {
    const quote = await expectQuote(cookie, quoteCase);
    results.push(quote.symbol);
  }

  const unavailable = [];
  for (const quoteCase of diagnosticCases) {
    const quote = await tryExpectQuote(cookie, quoteCase);
    if (quote) {
      results.push(quote.symbol);
    } else {
      unavailable.push(quoteCase.symbol);
    }
  }

  const unavailableSummary =
    unavailable.length > 0 ? `; provider-limited/unavailable: ${unavailable.join(", ")}` : "";
  checks.push(`/api/assets/quote matrix live quotes: ${results.join(", ")}${unavailableSummary}`);
}

async function expectExport(cookie: string) {
  const response = await fetch(`${baseUrl}/api/export?format=json`, {
    headers: { cookie },
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/api/export returned ${response.status}; expected 200.`);
  }

  const payload = (await response.json()) as {
    portfolio?: unknown;
    positions?: unknown;
    transactions?: unknown;
  };

  if (
    !payload.portfolio ||
    !Array.isArray(payload.positions) ||
    !Array.isArray(payload.transactions)
  ) {
    throw new Error("/api/export did not return a structured portfolio export.");
  }

  checks.push("/api/export returned a structured portfolio JSON export");
}

async function expectNews(cookie: string) {
  const response = await fetch(`${baseUrl}/api/news`, {
    headers: { cookie },
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/api/news returned ${response.status}; expected 200.`);
  }

  const payload = (await response.json()) as { news?: unknown };

  if (!Array.isArray(payload.news)) {
    throw new Error("/api/news did not return a news array.");
  }

  checks.push(`/api/news returned ${payload.news.length} portfolio headlines`);
}

async function expectDigest(cookie: string) {
  const response = await fetch(`${baseUrl}/api/digest`, {
    headers: { cookie },
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/api/digest returned ${response.status}; expected 200.`);
  }

  const payload = (await response.json()) as {
    digest?: {
      subject?: unknown;
      text?: unknown;
    };
  };

  if (
    typeof payload.digest?.subject !== "string" ||
    typeof payload.digest?.text !== "string"
  ) {
    throw new Error("/api/digest did not return a structured digest preview.");
  }

  checks.push("/api/digest returned a structured portfolio digest preview");
}

async function tryExpectQuote(
  cookie: string,
  input: Parameters<typeof expectQuote>[1]
) {
  try {
    return await expectQuote(cookie, input);
  } catch {
    return null;
  }
}

async function expectQuote(
  cookie: string,
  input: {
    symbol: string;
    name: string;
    type: string;
    currency: string;
    provider: string;
    externalId: string;
    exchange?: string;
  }
) {
  const response = await fetch(`${baseUrl}/api/assets/quote`, {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json"
    },
    body: JSON.stringify(input),
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/api/assets/quote returned ${response.status}; expected 200.`);
  }

  const payload = (await response.json()) as {
    quote?: {
      symbol?: unknown;
      priceUsd?: unknown;
      quoteSource?: unknown;
    };
  };

  if (
    typeof payload.quote?.priceUsd !== "number" ||
    payload.quote.priceUsd <= 0 ||
    payload.quote.quoteSource !== "live"
  ) {
    throw new Error(
      `/api/assets/quote did not return a live positive USD quote for ${input.symbol}.`
    );
  }

  return {
    symbol: typeof payload.quote.symbol === "string" ? payload.quote.symbol : input.symbol,
    priceUsd: payload.quote.priceUsd
  };
}

function getSetCookies(headers: Headers) {
  const headersWithCookies = headers as Headers & { getSetCookie?: () => string[] };
  return headersWithCookies.getSetCookie?.() ?? [headers.get("set-cookie")].filter(Boolean);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
