import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    await requireApiAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const conditions = [];
    if (projectId) {
      conditions.push(eq(todos.projectId, parseInt(projectId, 10)));
    }
    if (status) {
      conditions.push(eq(todos.status, status as "pending" | "in_progress" | "completed"));
    }

    let result;
    if (conditions.length > 0) {
      result = await db
        .select()
        .from(todos)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    } else {
      result = await db.select().from(todos);
    }

    return Response.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to fetch todos");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = await request.json();
    const { title, description, projectId, assignedTo, priority, dueDate } = body;

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const result = await db
      .insert(todos)
      .values({
        title,
        description,
        projectId,
        assignedTo,
        priority,
        dueDate,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create todo");
  }
}
