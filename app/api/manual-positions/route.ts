import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import {
  createManualPositionForEmail,
  getDashboardDataForEmail
} from "@/lib/db/portfolio-repository";

export async function GET() {
  const email = await requireSessionEmail();
  const data = await getDashboardDataForEmail(email);
  return NextResponse.json({ manualPositions: data.manualPositions });
}

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const formData = await request.formData();
    await createManualPositionForEmail(email, formData);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create manual position." },
      { status: 400 }
    );
  }
}
