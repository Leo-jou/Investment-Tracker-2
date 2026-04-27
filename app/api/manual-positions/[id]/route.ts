import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { deleteManualPositionForEmail } from "@/lib/db/portfolio-repository";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const email = await requireSessionEmail();
    const { id } = await context.params;
    await deleteManualPositionForEmail(email, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete manual position." },
      { status: 400 }
    );
  }
}
