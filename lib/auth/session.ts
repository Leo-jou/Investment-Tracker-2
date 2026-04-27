import crypto from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { sessionCookieName } from "@/lib/auth/constants";
import { isEmailAllowed, isValidEmail, normalizeEmail } from "@/lib/auth/email";

export { sessionCookieName };
export { isEmailAllowed, isValidEmail, normalizeEmail };

type SessionPayload = {
  email: string;
  expiresAt: number;
};

const maxAgeSeconds = 60 * 60 * 24 * 14;

export async function createSession(email: string) {
  const payload: SessionPayload = {
    email: normalizeEmail(email),
    expiresAt: Date.now() + maxAgeSeconds * 1000
  };
  const token = signPayload(payload);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getSessionEmail() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.expiresAt >= Date.now()) return payload.email;
  }

  const authSession = await auth();
  const email = authSession?.user?.email;
  return email ? normalizeEmail(email) : null;
}

export async function requireSessionEmail() {
  const email = await getSessionEmail();
  if (!email) redirect("/login");
  return email;
}

function signPayload(payload: SessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

function sign(value: string) {
  return crypto.createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }
  return secret ?? "local-development-only-secret";
}
