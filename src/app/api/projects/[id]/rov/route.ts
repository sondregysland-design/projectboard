import { db } from "@/lib/db";
import {
  projects,
  rovSystems,
  rovSystemParts,
  parts,
  projectPartsUsage,
  procedures,
  drawings,
  purchaseOrders,
} from "@/lib/db/schema";
import { eq, and, lt, ne } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function POST(
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
    const { rovSystemId } = body;

    if (!rovSystemId) {
      return Response.json(
        { error: "rovSystemId is required" },
        { status: 400 }
      );
    }

    // Verify the ROV system exists
    const rovSystem = await db
      .select()
      .from(rovSystems)
      .where(eq(rovSystems.id, rovSystemId));

    if (rovSystem.length === 0) {
      return Response.json(
        { error: "ROV system not found" },
        { status: 404 }
      );
    }

    // Step 1: Update project's rovSystemId
    await db
      .update(projects)
      .set({
        rovSystemId,
        status: "workshop",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, projectId));

    // Step 2: Fetch the bill of materials for this ROV system
    const bom = await db
      .select({
        id: rovSystemParts.id,
        partId: rovSystemParts.partId,
        quantityRequired: rovSystemParts.quantityRequired,
        notes: rovSystemParts.notes,
        partName: parts.name,
        partSku: parts.sku,
        currentQuantity: parts.quantity,
        minStock: parts.minStock,
        maxStock: parts.maxStock,
        supplier: parts.supplier,
      })
      .from(rovSystemParts)
      .leftJoin(parts, eq(rovSystemParts.partId, parts.id))
      .where(eq(rovSystemParts.rovSystemId, rovSystemId));

    // Step 3: Deduct quantities and create usage records
    const partsUsed = [];
    for (const item of bom) {
      // Deduct quantity from parts table
      const newQuantity = (item.currentQuantity ?? 0) - item.quantityRequired;
      if (newQuantity < 0) {
        return Response.json(
          { error: `Utilstrekkelig lager for ${item.partName} (${item.partSku}). Tilgjengelig: ${item.currentQuantity ?? 0}, Krever: ${item.quantityRequired}` },
          { status: 400 }
        );
      }
      await db
        .update(parts)
        .set({
          quantity: newQuantity,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(parts.id, item.partId));

      // Create projectPartsUsage record
      const usageRecord = await db
        .insert(projectPartsUsage)
        .values({
          projectId,
          partId: item.partId,
          quantityUsed: item.quantityRequired,
        })
        .returning();

      partsUsed.push({
        ...usageRecord[0],
        partName: item.partName,
        partSku: item.partSku,
        previousQuantity: item.currentQuantity,
        newQuantity,
      });
    }

    // Step 4: Fetch procedures linked to the ROV system
    const rovProcedures = await db
      .select()
      .from(procedures)
      .where(eq(procedures.rovSystemId, rovSystemId));

    // Step 5: Fetch drawings linked to the ROV system
    const rovDrawings = await db
      .select()
      .from(drawings)
      .where(eq(drawings.rovSystemId, rovSystemId));

    // Step 6: Check stock levels and auto-create purchase orders
    const stockWarnings = [];
    const ordersCreated = [];

    for (const item of bom) {
      const newQuantity = (item.currentQuantity ?? 0) - item.quantityRequired;

      if (newQuantity < (item.minStock ?? 5)) {
        stockWarnings.push({
          partId: item.partId,
          partName: item.partName,
          partSku: item.partSku,
          currentQuantity: newQuantity,
          minStock: item.minStock,
        });

        // Check if a pending purchase order already exists for this part
        const existingOrders = await db
          .select()
          .from(purchaseOrders)
          .where(
            and(
              eq(purchaseOrders.partId, item.partId),
              eq(purchaseOrders.status, "pending")
            )
          );

        if (existingOrders.length === 0) {
          const quantityToOrder = (item.maxStock ?? 50) - newQuantity;
          const newOrder = await db
            .insert(purchaseOrders)
            .values({
              partId: item.partId,
              quantityOrdered: quantityToOrder,
              supplier: item.supplier,
              triggeredBy: "auto",
            })
            .returning();

          ordersCreated.push({
            ...newOrder[0],
            partName: item.partName,
            partSku: item.partSku,
          });
        }
      }
    }

    // Step 7: Fetch updated project
    const updatedProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    // Step 8: Return comprehensive result
    return Response.json({
      project: updatedProject[0],
      procedures: rovProcedures,
      drawings: rovDrawings,
      partsUsed,
      stockWarnings,
      ordersCreated,
    });
  } catch (error) {
    return handleApiError(error, "Failed to assign ROV system to project");
  }
}
