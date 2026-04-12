import { db } from "@/lib/db";
import { rovSystemParts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
    const { partId, quantityRequired, notes } = body;

    if (!partId || !quantityRequired) {
      return Response.json(
        { error: "partId and quantityRequired are required" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(rovSystemParts)
      .where(
        and(
          eq(rovSystemParts.rovSystemId, rovSystemId),
          eq(rovSystemParts.partId, partId)
        )
      );

    if (existing.length > 0) {
      return Response.json(
        { error: "Denne delen er allerede i stykklisten" },
        { status: 409 }
      );
    }

    const result = await db
      .insert(rovSystemParts)
      .values({ rovSystemId, partId, quantityRequired, notes })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to add BOM part:", error);
    return Response.json(
      { error: "Failed to add BOM part" },
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
    const { bomId } = body;

    if (!bomId) {
      return Response.json({ error: "bomId is required" }, { status: 400 });
    }

    const result = await db
      .delete(rovSystemParts)
      .where(eq(rovSystemParts.id, bomId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "BOM entry not found" }, { status: 404 });
    }

    return Response.json({ message: "BOM entry removed", entry: result[0] });
  } catch (error) {
    console.error("Failed to remove BOM part:", error);
    return Response.json(
      { error: "Failed to remove BOM part" },
      { status: 500 }
    );
  }
}
