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

    const all = (allProjects ?? []) as Project[];
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
