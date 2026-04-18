import { db } from "@/lib/db";
import { parts } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireApiAuth();
    const result = await db
      .select()
      .from(parts)
      .orderBy(asc(parts.name));

    return Response.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to fetch parts");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = await request.json();
    const {
      name,
      sku,
      description,
      category,
      quantity,
      minStock,
      maxStock,
      unit,
      unitPrice,
      supplier,
      location,
    } = body;

    if (!name || !sku) {
      return Response.json(
        { error: "Name and SKU are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(parts)
      .values({
        name,
        sku,
        description,
        category,
        quantity,
        minStock,
        maxStock,
        unit,
        unitPrice,
        supplier,
        location,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create part");
  }
}
