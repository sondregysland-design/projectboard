import { db } from "@/lib/db";
import { drawings } from "@/lib/db/schema";
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
    const { name, description, fileUrl, fileType, version } = body;

    if (!name || !fileUrl || !fileType) {
      return Response.json(
        { error: "name, fileUrl, and fileType are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(drawings)
      .values({
        name,
        description,
        fileUrl,
        fileType,
        version: version || "1.0",
        rovSystemId,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to add drawing:", error);
    return Response.json(
      { error: "Failed to add drawing" },
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
    const { drawingId } = body;

    if (!drawingId) {
      return Response.json(
        { error: "drawingId is required" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(drawings)
      .where(eq(drawings.id, drawingId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Drawing not found" }, { status: 404 });
    }

    return Response.json({ message: "Drawing removed", drawing: result[0] });
  } catch (error) {
    console.error("Failed to remove drawing:", error);
    return Response.json(
      { error: "Failed to remove drawing" },
      { status: 500 }
    );
  }
}
