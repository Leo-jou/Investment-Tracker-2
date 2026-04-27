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
  const response = await fetch(`${baseUrl}/api/assets/quote`, {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      symbol: "BTC",
      name: "Bitcoin",
      type: "CRYPTO",
      currency: "USD",
      provider: "coingecko",
      externalId: "bitcoin"
    }),
    redirect: "manual"
  });

  if (response.status !== 200) {
    throw new Error(`/api/assets/quote returned ${response.status}; expected 200.`);
  }

  const payload = (await response.json()) as {
    quote?: {
      priceUsd?: unknown;
      quoteSource?: unknown;
    };
  };

  if (
    typeof payload.quote?.priceUsd !== "number" ||
    payload.quote.priceUsd <= 0 ||
    payload.quote.quoteSource !== "live"
  ) {
    throw new Error("/api/assets/quote did not return a live positive USD quote.");
  }

  checks.push("/api/assets/quote returned a live BTC quote");
}

function getSetCookies(headers: Headers) {
  const headersWithCookies = headers as Headers & { getSetCookie?: () => string[] };
  return headersWithCookies.getSetCookie?.() ?? [headers.get("set-cookie")].filter(Boolean);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
