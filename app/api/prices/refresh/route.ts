import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { refreshPortfolioData } from "@/lib/pricing/refresh";

export async function POST(request: Request) {
  const email = await requireSessionEmail();
  const updatePortfolioSnapshots = request.headers.get("x-daily-snapshots-enabled") !== "false";
  const result = await refreshPortfolioData(email, { updatePortfolioSnapshots });
  return NextResponse.json(result);
}
