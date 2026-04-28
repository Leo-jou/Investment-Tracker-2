import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";
import { buildPortfolioDigest } from "@/lib/digest/portfolio-digest";
import { sendEmail } from "@/lib/email/resend";
import { getPortfolioNews } from "@/lib/news/portfolio-news";

export async function GET(request: Request) {
  const email = await requireSessionEmail();
  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get("portfolioId") ?? undefined;
  const format = searchParams.get("format") ?? "json";
  const baseUrl = process.env.AUTH_URL ?? new URL(request.url).origin;
  const data = await getDashboardDataForEmail(email, portfolioId);
  const news = await getPortfolioNews(data);
  const digest = buildPortfolioDigest(data, news, { baseUrl });

  if (format === "html") {
    return new Response(digest.html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  if (format === "text") {
    return new Response(digest.text, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  return NextResponse.json({ digest });
}

export async function POST(request: Request) {
  const sessionEmail = await requireSessionEmail();
  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get("portfolioId") ?? undefined;
  const baseUrl = process.env.AUTH_URL ?? new URL(request.url).origin;
  await request.json().catch(() => ({}));
  const data = await getDashboardDataForEmail(sessionEmail, portfolioId);
  const news = await getPortfolioNews(data);
  const digest = buildPortfolioDigest(data, news, { baseUrl });
  const result = await sendEmail({
    to: sessionEmail,
    subject: digest.subject,
    html: digest.html,
    text: digest.text
  });

  return NextResponse.json({ result, digest }, { status: result.sent ? 200 : 202 });
}
