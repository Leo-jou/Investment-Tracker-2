"use server";

import { redirect } from "next/navigation";

import {
  clearSession,
  createSession,
  isEmailAllowed,
  isValidEmail,
  normalizeEmail
} from "@/lib/auth/session";
import { ensureUserWorkspace } from "@/lib/db/portfolio-repository";

export async function loginWithEmail(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!isValidEmail(email)) {
    redirect("/login?error=invalid-email");
  }

  if (!isEmailAllowed(email)) {
    redirect("/login?error=not-allowed");
  }

  await ensureUserWorkspace(email);
  await createSession(email);
  redirect("/dashboard");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
