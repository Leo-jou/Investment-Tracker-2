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

function getSetCookies(headers: Headers) {
  const headersWithCookies = headers as Headers & { getSetCookie?: () => string[] };
  return headersWithCookies.getSetCookie?.() ?? [headers.get("set-cookie")].filter(Boolean);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
