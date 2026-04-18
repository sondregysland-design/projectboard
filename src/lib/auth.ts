import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "leader" | "workshop";

export async function getRole(): Promise<Role | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;
  if (role === "leader" || role === "workshop") return role;
  return null;
}

export async function requireRole(required: Role): Promise<Role> {
  const role = await getRole();
  if (!role) redirect("/login");
  if (role !== required) redirect("/login");
  return role;
}
