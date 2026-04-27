import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { createPortfolioForEmail } from "@/lib/db/portfolio-repository";

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const portfolio = await createPortfolioForEmail(email, await request.formData());
    return NextResponse.json({ portfolio });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create portfolio." },
      { status: 400 }
    );
  }
}
