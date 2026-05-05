import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import {
  createTransactionForEmail,
  getDashboardDataForEmail
} from "@/lib/db/portfolio-repository";

export async function GET() {
  const email = await requireSessionEmail();
  const data = await getDashboardDataForEmail(email);
  return NextResponse.json({ transactions: data.transactions });
}

export async function POST(request: Request) {
  try {
    const email = await requireSessionEmail();
    const formData = await request.formData();
    const transaction = await createTransactionForEmail(email, formData);
    return NextResponse.json({ ok: true, transaction });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create transaction." },
      { status: 400 }
    );
  }
}
