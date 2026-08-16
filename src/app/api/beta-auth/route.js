import { NextResponse } from "next/server";
import { BETA_AUTH_COOKIE, betaAuthToken, safeRedirectPath } from "@/lib/betaAuth";

export async function POST(request) {
  const formData = await request.formData();
  const password = formData.get("password");
  const from = safeRedirectPath(formData.get("from"));

  const expected = process.env.BETA_PASSWORD;
  if (!expected || password !== expected) {
    const url = new URL("/beta-gate", request.url);
    url.searchParams.set("from", from);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(from, request.url), { status: 303 });
  response.cookies.set(BETA_AUTH_COOKIE, betaAuthToken(expected), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
