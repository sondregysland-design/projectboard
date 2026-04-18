import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return Response.json({ error: "Invalid todo ID" }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, assignedTo, priority, status, dueDate } = body;

    const updateData: Record<string, unknown> = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(assignedTo !== undefined && { assignedTo }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(dueDate !== undefined && { dueDate }),
      updatedAt: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completedAt = new Date().toISOString();
    }

    const result = await db
      .update(todos)
      .set(updateData)
      .where(eq(todos.id, todoId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Todo not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    return handleApiError(error, "Failed to update todo");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return Response.json({ error: "Invalid todo ID" }, { status: 400 });
    }

    const result = await db
      .delete(todos)
      .where(eq(todos.id, todoId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Todo not found" }, { status: 404 });
    }

    return Response.json({ message: "Todo deleted", todo: result[0] });
  } catch (error) {
    return handleApiError(error, "Failed to delete todo");
  }
}
