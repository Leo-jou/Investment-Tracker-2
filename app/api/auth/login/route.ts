import { NextResponse } from "next/server";

import {
  createSession,
  isEmailAllowed,
  isValidEmail,
  normalizeEmail
} from "@/lib/auth/session";
import { ensureUserWorkspace } from "@/lib/db/portfolio-repository";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!isEmailAllowed(email)) {
    return NextResponse.json({ error: "This email is not in the allowlist." }, { status: 403 });
  }

  await ensureUserWorkspace(email);
  await createSession(email);
  return NextResponse.json({ ok: true });
}
