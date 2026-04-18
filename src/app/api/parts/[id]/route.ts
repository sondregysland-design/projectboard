import { db } from "@/lib/db";
import { parts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const partId = parseInt(id, 10);

    if (isNaN(partId)) {
      return Response.json({ error: "Invalid part ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, sku, description, category, quantity, minStock, maxStock, unit, unitPrice, supplier, location } = body;

    const result = await db
      .update(parts)
      .set({
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(quantity !== undefined && { quantity }),
        ...(minStock !== undefined && { minStock }),
        ...(maxStock !== undefined && { maxStock }),
        ...(unit !== undefined && { unit }),
        ...(unitPrice !== undefined && { unitPrice }),
        ...(supplier !== undefined && { supplier }),
        ...(location !== undefined && { location }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(parts.id, partId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Part not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    return handleApiError(error, "Failed to update part");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const partId = parseInt(id, 10);

    if (isNaN(partId)) {
      return Response.json({ error: "Invalid part ID" }, { status: 400 });
    }

    const result = await db
      .delete(parts)
      .where(eq(parts.id, partId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Part not found" }, { status: 404 });
    }

    return Response.json({ message: "Part deleted", part: result[0] });
  } catch (error) {
    return handleApiError(error, "Failed to delete part");
  }
}
