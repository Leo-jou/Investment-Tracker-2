import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { demoModeMutationMessage } from "@/lib/db/client";
import { refreshPortfolioData } from "@/lib/pricing/refresh";

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const updatePortfolioSnapshots = request.headers.get("x-daily-snapshots-enabled") !== "false";
    const result = await refreshPortfolioData(email, { updatePortfolioSnapshots });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refresh failed.";
    return NextResponse.json(
      { ok: false, error: message, message },
      { status: message === demoModeMutationMessage ? 409 : 400 }
    );
  }
}
