import { db } from "@/lib/db";
import { purchaseOrders, parts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireApiAuth();
    const result = await db
      .select({
        id: purchaseOrders.id,
        partId: purchaseOrders.partId,
        partName: parts.name,
        partSku: parts.sku,
        quantityOrdered: purchaseOrders.quantityOrdered,
        status: purchaseOrders.status,
        triggeredBy: purchaseOrders.triggeredBy,
        supplier: purchaseOrders.supplier,
        orderDate: purchaseOrders.orderDate,
        expectedDelivery: purchaseOrders.expectedDelivery,
        receivedAt: purchaseOrders.receivedAt,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .leftJoin(parts, eq(purchaseOrders.partId, parts.id))
      .orderBy(desc(purchaseOrders.createdAt));

    return Response.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to fetch purchase orders");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = await request.json();
    const { partId, quantityOrdered, supplier } = body;

    if (!partId || !quantityOrdered) {
      return Response.json(
        { error: "partId and quantityOrdered are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(purchaseOrders)
      .values({
        partId,
        quantityOrdered,
        supplier,
        triggeredBy: "manual",
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create purchase order");
  }
}
