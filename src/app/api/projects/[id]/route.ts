import { db } from "@/lib/db";
import {
  projects,
  rovSystems,
  procedures,
  drawings,
  projectPartsUsage,
  parts,
  workshopLogs,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return Response.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const projectResult = await db
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
        completedAt: projects.completedAt,
        notes: projects.notes,
        hasTilbud: projects.hasTilbud,
        hasPo: projects.hasPo,
        contactName: projects.contactName,
        contactEmail: projects.contactEmail,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(rovSystems, eq(projects.rovSystemId, rovSystems.id))
      .where(eq(projects.id, projectId));

    if (projectResult.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectResult[0];

    const [projectProcedures, projectDrawings, partsUsage, logs] =
      await Promise.all([
        project.rovSystemId
          ? db
              .select()
              .from(procedures)
              .where(eq(procedures.rovSystemId, project.rovSystemId))
          : Promise.resolve([]),
        project.rovSystemId
          ? db
              .select()
              .from(drawings)
              .where(eq(drawings.rovSystemId, project.rovSystemId))
          : Promise.resolve([]),
        db
          .select({
            id: projectPartsUsage.id,
            projectId: projectPartsUsage.projectId,
            partId: projectPartsUsage.partId,
            quantityUsed: projectPartsUsage.quantityUsed,
            deductedAt: projectPartsUsage.deductedAt,
            partName: parts.name,
            partSku: parts.sku,
            partCategory: parts.category,
          })
          .from(projectPartsUsage)
          .leftJoin(parts, eq(projectPartsUsage.partId, parts.id))
          .where(eq(projectPartsUsage.projectId, projectId)),
        db
          .select()
          .from(workshopLogs)
          .where(eq(workshopLogs.projectId, projectId)),
      ]);

    return Response.json({
      ...project,
      procedures: projectProcedures,
      drawings: projectDrawings,
      partsUsage,
      workshopLogs: logs,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch project");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return Response.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      name, description, client, location, status, priority,
      assignedTo, startDate, dueDate, completedAt,
      notes, hasTilbud, hasPo, contactName, contactEmail,
    } = body;

    // Auto-set completedAt when status changes to "completed"
    const autoCompletedAt =
      status === "completed" && completedAt === undefined
        ? new Date().toISOString()
        : status !== "completed" && status !== undefined
          ? null
          : completedAt;

    const result = await db
      .update(projects)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(client !== undefined && { client }),
        ...(location !== undefined && { location }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(startDate !== undefined && { startDate }),
        ...(dueDate !== undefined && { dueDate }),
        ...(autoCompletedAt !== undefined && { completedAt: autoCompletedAt }),
        ...(notes !== undefined && { notes }),
        ...(hasTilbud !== undefined && { hasTilbud: hasTilbud ? 1 : 0 }),
        ...(hasPo !== undefined && { hasPo: hasPo ? 1 : 0 }),
        ...(contactName !== undefined && { contactName }),
        ...(contactEmail !== undefined && { contactEmail }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    return handleApiError(error, "Failed to update project");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return Response.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const result = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ message: "Project deleted", project: result[0] });
  } catch (error) {
    return handleApiError(error, "Failed to delete project");
  }
}
