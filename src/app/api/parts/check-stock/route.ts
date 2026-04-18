import { db } from "@/lib/db";
import { parts, purchaseOrders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function POST() {
  try {
    await requireApiAuth();
    // Find all parts where quantity < minStock
    const lowStockParts = await db
      .select()
      .from(parts)
      .where(sql`${parts.quantity} < ${parts.minStock}`);

    const newOrders = [];

    for (const part of lowStockParts) {
      // Check if a pending purchase order already exists for this part
      const existingOrders = await db
        .select()
        .from(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.partId, part.id),
            eq(purchaseOrders.status, "pending")
          )
        );

      if (existingOrders.length === 0) {
        const quantityToOrder = part.maxStock - part.quantity;
        const order = await db
          .insert(purchaseOrders)
          .values({
            partId: part.id,
            quantityOrdered: quantityToOrder,
            supplier: part.supplier,
            triggeredBy: "auto",
          })
          .returning();

        newOrders.push({
          ...order[0],
          partName: part.name,
          partSku: part.sku,
        });
      }
    }

    return Response.json({ lowStockParts, newOrders });
  } catch (error) {
    return handleApiError(error, "Failed to check stock levels");
  }
}
