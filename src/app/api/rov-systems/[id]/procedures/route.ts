import { db } from "@/lib/db";
import { procedures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rovSystemId = parseInt(id, 10);

    if (isNaN(rovSystemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, description, version } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await db
      .insert(procedures)
      .values({
        name,
        category,
        description,
        version: version || "1.0",
        rovSystemId,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to add procedure:", error);
    return Response.json(
      { error: "Failed to add procedure" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { procedureId } = body;

    if (!procedureId) {
      return Response.json(
        { error: "procedureId is required" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(procedures)
      .where(eq(procedures.id, procedureId))
      .returning();

    if (result.length === 0) {
      return Response.json(
        { error: "Procedure not found" },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Procedure removed",
      procedure: result[0],
    });
  } catch (error) {
    console.error("Failed to remove procedure:", error);
    return Response.json(
      { error: "Failed to remove procedure" },
      { status: 500 }
    );
  }
}
