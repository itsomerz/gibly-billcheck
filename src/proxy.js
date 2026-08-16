import { NextResponse } from "next/server";
import { BETA_AUTH_COOKIE, betaAuthToken } from "@/lib/betaAuth";

export function proxy(request) {
  const password = process.env.BETA_PASSWORD;
  // No password configured — gate is off (e.g. local dev without it set).
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(BETA_AUTH_COOKIE)?.value;
  if (cookie === betaAuthToken(password)) return NextResponse.next();

  const url = new URL("/beta-gate", request.url);
  url.searchParams.set("from", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!beta-gate|api/beta-auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
