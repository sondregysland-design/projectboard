import { db } from "@/lib/db";
import { purchaseOrders, parts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return Response.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status, expectedDelivery } = body;

    // Fetch the current order to check what's changing
    const currentOrder = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, orderId));

    if (currentOrder.length === 0) {
      return Response.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const order = currentOrder[0];
    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
    }
    if (expectedDelivery) {
      updateData.expectedDelivery = expectedDelivery;
    }

    // If marking as "received", update receivedAt and add quantity back to parts
    if (status === "received") {
      updateData.receivedAt = new Date().toISOString();

      // Get the current part quantity
      const part = await db
        .select()
        .from(parts)
        .where(eq(parts.id, order.partId));

      if (part.length > 0) {
        const newQuantity = part[0].quantity + order.quantityOrdered;
        await db
          .update(parts)
          .set({
            quantity: newQuantity,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(parts.id, order.partId));
      }
    }

    const result = await db
      .update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, orderId))
      .returning();

    return Response.json(result[0]);
  } catch (error) {
    return handleApiError(error, "Failed to update purchase order");
  }
}
