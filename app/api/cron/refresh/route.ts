import { NextResponse } from "next/server";

import { isEmailAllowed, isValidEmail, normalizeEmail } from "@/lib/auth/session";
import { refreshPortfolioData } from "@/lib/pricing/refresh";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, reason: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, reason: "Unauthorized." }, { status: 401 });
  }

  const recipients = parseRefreshRecipients();
  if (recipients.length === 0) {
    return NextResponse.json({
      ok: false,
      reason: "CRON_REFRESH_EMAILS or DIGEST_EMAIL_RECIPIENTS has no valid email recipients."
    });
  }

  const results = [];

  for (const recipient of recipients) {
    if (!isEmailAllowed(recipient, { failClosed: true })) {
      results.push({
        recipient: maskEmail(recipient),
        status: "skipped",
        reason: "Recipient is not in APP_ALLOWED_EMAILS."
      });
      continue;
    }

    try {
      const result = await refreshPortfolioData(recipient, { updatePortfolioSnapshots: true });
      results.push({
        recipient: maskEmail(recipient),
        status: "refreshed",
        mode: result.mode,
        pricesUpdated: result.pricesUpdated,
        fxPairsUpdated: result.fxPairsUpdated,
        portfolioSnapshotsUpdated: result.portfolioSnapshotsUpdated,
        errors: result.errors.length
      });
    } catch (error) {
      results.push({
        recipient: maskEmail(recipient),
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown refresh failure."
      });
    }
  }

  const failed = results.filter((result) => result.status === "failed").length;

  return NextResponse.json({
    ok: failed === 0,
    refreshed: results.filter((result) => result.status === "refreshed").length,
    failed,
    skipped: results.filter((result) => result.status === "skipped").length,
    results
  });
}

function parseRefreshRecipients() {
  return [
    ...new Set(
      (process.env.CRON_REFRESH_EMAILS ?? process.env.DIGEST_EMAIL_RECIPIENTS ?? "")
        .split(",")
        .map((value) => normalizeEmail(value))
        .filter((value) => isValidEmail(value))
    )
  ];
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "invalid-email";
  return `${name.slice(0, 2)}***@${domain}`;
}
