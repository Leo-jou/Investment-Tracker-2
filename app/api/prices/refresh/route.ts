import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { refreshPortfolioData } from "@/lib/pricing/refresh";

export async function POST() {
  await requireSessionEmail();
  const result = await refreshPortfolioData();
  return NextResponse.json(result);
}
