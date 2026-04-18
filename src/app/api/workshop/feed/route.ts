import { db } from "@/lib/db";
import { projects, rovSystems, procedures, drawings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireApiAuth();
    // Fetch all projects in "workshop" status, joined with ROV systems
    const workshopProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        client: projects.client,
        location: projects.location,
        rovSystemId: projects.rovSystemId,
        rovSystemName: rovSystems.name,
        rovSystemModel: rovSystems.model,
        status: projects.status,
        priority: projects.priority,
        assignedTo: projects.assignedTo,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(rovSystems, eq(projects.rovSystemId, rovSystems.id))
      .where(eq(projects.status, "workshop"))
      .orderBy(desc(projects.createdAt));

    // Fetch procedures and drawings for each project's ROV system
    const result = await Promise.all(
      workshopProjects.map(async (project) => {
        let projectProcedures: (typeof procedures.$inferSelect)[] = [];
        let projectDrawings: (typeof drawings.$inferSelect)[] = [];

        if (project.rovSystemId) {
          [projectProcedures, projectDrawings] = await Promise.all([
            db
              .select()
              .from(procedures)
              .where(eq(procedures.rovSystemId, project.rovSystemId)),
            db
              .select()
              .from(drawings)
              .where(eq(drawings.rovSystemId, project.rovSystemId)),
          ]);
        }

        return {
          ...project,
          procedures: projectProcedures,
          drawings: projectDrawings,
        };
      })
    );

    return Response.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to fetch workshop feed");
  }
}
