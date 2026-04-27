import { NextResponse } from "next/server";

import { isEmailAllowed, isValidEmail, normalizeEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";
import { buildPortfolioDigest } from "@/lib/digest/portfolio-digest";
import { sendEmail } from "@/lib/email/resend";
import { getPortfolioNews } from "@/lib/news/portfolio-news";

export const dynamic = "force-dynamic";

type DigestCronResult = {
  recipient: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
};

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

  const recipients = parseDigestRecipients();
  if (recipients.length === 0) {
    return NextResponse.json({
      ok: false,
      reason: "DIGEST_EMAIL_RECIPIENTS has no valid email recipients."
    });
  }

  const results: DigestCronResult[] = [];

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
      const data = await getDashboardDataForEmail(recipient);
      const news = await getPortfolioNews(data);
      const digest = buildPortfolioDigest(data, news);
      const email = await sendEmail({
        to: recipient,
        subject: digest.subject,
        html: digest.html,
        text: digest.text
      });

      results.push(
        email.sent
          ? { recipient: maskEmail(recipient), status: "sent" }
          : { recipient: maskEmail(recipient), status: "failed", reason: email.reason }
      );
    } catch (error) {
      results.push({
        recipient: maskEmail(recipient),
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown digest failure."
      });
    }
  }

  const sent = results.filter((result) => result.status === "sent").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const skipped = results.filter((result) => result.status === "skipped").length;

  return NextResponse.json({
    ok: failed === 0,
    sent,
    failed,
    skipped,
    results
  });
}

function parseDigestRecipients() {
  return [
    ...new Set(
      (process.env.DIGEST_EMAIL_RECIPIENTS ?? "")
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
