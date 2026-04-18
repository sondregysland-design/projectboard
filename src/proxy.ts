import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const role = request.cookies.get("role")?.value;
  const { pathname } = request.nextUrl;

  // Allow login page and API routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // No role -> login
  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Workshop trying to access leader pages
  const leaderPaths = ["/prosjekter", "/prosedyrer", "/gjoremal", "/lager"];
  if (
    role === "workshop" &&
    leaderPaths.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/verksted", request.url));
  }

  // Leader trying to access workshop
  if (role === "leader" && pathname.startsWith("/verksted")) {
    return NextResponse.redirect(new URL("/prosjekter", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
