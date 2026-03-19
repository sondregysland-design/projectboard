import { type NextRequest, NextResponse } from "next/server";
// import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(_request: NextRequest) {
  // Auth disabled for development — enable when Supabase keys are configured
  return NextResponse.next();
  // return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
