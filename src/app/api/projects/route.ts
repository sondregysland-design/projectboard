import { db } from "@/lib/db";
import { projects, rovSystems } from "@/lib/db/schema";
import { eq, ne } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    await requireApiAuth();
    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get("includeCompleted") === "true";
    const onlyCompleted = searchParams.get("status") === "completed";

    let query = db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        client: projects.client,
        location: projects.location,
        rovSystemId: projects.rovSystemId,
        rovSystemName: rovSystems.name,
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
      .orderBy(desc(projects.createdAt));

    if (onlyCompleted) {
      query = query.where(eq(projects.status, "completed")) as typeof query;
    } else if (!includeCompleted) {
      query = query.where(ne(projects.status, "completed")) as typeof query;
    }

    const result = await query;
    return Response.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to fetch projects");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = await request.json();
    const { name, description, client, location, priority, assignedTo, startDate, dueDate } = body;

    if (!name || !client) {
      return Response.json({ error: "Name and client are required" }, { status: 400 });
    }

    const result = await db
      .insert(projects)
      .values({
        name,
        description,
        client,
        location,
        priority,
        assignedTo,
        startDate,
        dueDate,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create project");
  }
}
