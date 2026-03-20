import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCards } from "@/components/prosjekter/SummaryCards";
import { getStatusLabel } from "@/lib/utils";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let allProjects: Project[] = [];

  try {
    const supabase = await createClient();
    const { data: projects } = await supabase
      .from("pb_projects")
      .select("*")
      .order("date", { ascending: false });

    allProjects = (projects ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: (r.name as string) || "",
      status: (r.status as string) || "planning",
      date: (r.date as string) || "",
      field: (r.field as string) || "",
      felt: (r.felt as string[]) || [],
      links: (r.links as Project["links"]) || [],
      ecompletionUrl: (r.ecompletion_url as string) || "",
      bsaUrl: (r.bsa_url as string) || "",
      so: (r.so as string) || "",
      ce: !!r.ce,
      po: !!r.po,
      notes: (r.notes as string) || "",
      contactName: (r.contact_name as string) || "",
      contactInfo: (r.contact_info as string) || "",
      shippingAddress: (r.shipping_address as string) || "",
      files: (r.files as Project["files"]) || [],
      isStandin: !!r.is_standin,
    }));
  } catch (err) {
    console.error("Failed to fetch projects:", err);
  }

  const recentProjects = allProjects
    .filter((p) => !p.isStandin)
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Prosjekt"
        highlight="oversikt"
        subtitle="Oversikt over alle prosjekter og status"
      />

      <div className="space-y-6">
        <SummaryCards projects={allProjects.filter((p) => !p.isStandin)} />

        {/* Recent projects */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-text">Siste prosjekter</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentProjects.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-text-light">
                Ingen prosjekter ennå. Gå til Prosjektstyring for å legge til.
              </div>
            )}
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {project.name ? project.name.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">
                      {project.name || "Uten navn"}
                    </p>
                    <p className="text-xs text-text-light">
                      {project.field || "Ingen felt"} &middot; {project.date}
                    </p>
                  </div>
                </div>
                <StatusLabel status={project.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function StatusLabel({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    planning: "bg-gray-100 text-gray-600",
    workshop: "bg-blue-100 text-blue-700",
    offshore: "bg-amber-100 text-amber-700",
    invoicing: "bg-purple-100 text-purple-700",
    finished: "bg-emerald-100 text-emerald-700",
  };
  const color = colorMap[status] ?? colorMap.planning;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
