import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectTable } from "@/components/prosjekter/ProjectTable";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProsjekterPage() {
  let projects: Project[] = [];
  let standInProjects: Project[] = [];

  try {
    const supabase = await createClient();
    const { data: allProjects } = await supabase
      .from("projects")
      .select("*")
      .order("date", { ascending: false });

    const all = (allProjects ?? []).map((r: Record<string, unknown>) => ({
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
      files: (r.files as Project["files"]) || [],
      isStandin: !!r.is_standin,
    }));
    projects = all.filter((p) => !p.isStandin);
    standInProjects = all.filter((p) => p.isStandin);
  } catch (err) {
    console.error("Failed to fetch projects:", err);
  }

  return (
    <>
      <PageHeader
        title="Prosjekt"
        highlight="styring"
        subtitle="Administrer prosjekter, utstyr og lenker"
      />

      <ProjectTable
        projects={projects}
        standInProjects={standInProjects}
      />
    </>
  );
}
