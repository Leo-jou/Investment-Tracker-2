import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { updatePortfolioForEmail } from "@/lib/db/portfolio-repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const email = await requireSessionEmail();
    const { id } = await params;
    const portfolio = await updatePortfolioForEmail(email, id, await request.formData());
    return NextResponse.json({ portfolio });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update portfolio." },
      { status: 400 }
    );
  }
}
