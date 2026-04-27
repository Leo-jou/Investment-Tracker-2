import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { getDashboardDataForEmail } from "@/lib/db/portfolio-repository";
import { getPortfolioNews } from "@/lib/news/portfolio-news";

export async function GET(request: Request) {
  const email = await requireSessionEmail();
  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get("portfolioId") ?? undefined;
  const data = await getDashboardDataForEmail(email, portfolioId);
  const news = await getPortfolioNews(data);
  return NextResponse.json({ news });
}
