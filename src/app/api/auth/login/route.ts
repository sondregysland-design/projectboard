import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { role } = await request.json();
  if (role !== "leader" && role !== "workshop") {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set("role", role, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return Response.json({ success: true });
}
