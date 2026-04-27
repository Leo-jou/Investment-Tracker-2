import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName } from "@/lib/auth/constants";

const publicPaths = ["/login", "/api/auth"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next();
  }

  const hasSession =
    Boolean(request.cookies.get(sessionCookieName)?.value) ||
    request.cookies.getAll().some((cookie) => isAuthJsSessionCookie(cookie.name));

  if (!hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function isAuthJsSessionCookie(name: string) {
  return (
    name.includes("authjs.session-token") ||
    name.includes("next-auth.session-token")
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
