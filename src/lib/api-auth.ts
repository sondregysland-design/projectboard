import { cookies } from "next/headers";
import type { Role } from "./auth";

export async function getApiRole(): Promise<Role | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;
  if (role === "leader" || role === "workshop") return role;
  return null;
}

export async function requireApiAuth(): Promise<Role> {
  const role = await getApiRole();
  if (!role) {
    throw new ApiAuthError("Unauthorized");
  }
  return role;
}

export async function requireApiRole(required: Role): Promise<Role> {
  const role = await requireApiAuth();
  if (role !== required) {
    throw new ApiAuthError("Forbidden", 403);
  }
  return role;
}

export class ApiAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(fallbackMessage, error);
  return Response.json({ error: fallbackMessage }, { status: 500 });
}
