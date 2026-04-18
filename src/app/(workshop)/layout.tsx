import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("workshop");
  return (
    <div className="min-h-screen">
      <Sidebar role="workshop" />
      <main className="md:ml-64 p-3 pt-16 md:p-8 md:pt-8">{children}</main>
    </div>
  );
}
