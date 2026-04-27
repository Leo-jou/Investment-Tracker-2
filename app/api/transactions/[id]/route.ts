import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import {
  deleteTransactionForEmail,
  updateTransactionForEmail
} from "@/lib/db/portfolio-repository";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    const formData = await request.formData();
    await updateTransactionForEmail(email, id, formData);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update transaction." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    await deleteTransactionForEmail(email, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete transaction." },
      { status: 400 }
    );
  }
}
