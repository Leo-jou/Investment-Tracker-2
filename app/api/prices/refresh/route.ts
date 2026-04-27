import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { refreshPortfolioData } from "@/lib/pricing/refresh";

export async function POST() {
  const email = await requireSessionEmail();
  const result = await refreshPortfolioData(email);
  return NextResponse.json(result);
}
