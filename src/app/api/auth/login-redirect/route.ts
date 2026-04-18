import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role");
  if (role !== "leader" && role !== "workshop") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookieStore = await cookies();
  cookieStore.set("role", role, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  const target = role === "leader" ? "/prosjekter" : "/verksted";
  return NextResponse.redirect(new URL(target, request.url));
}
