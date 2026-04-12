import { db } from "@/lib/db";
import {
  rovSystems,
  rovSystemParts,
  parts,
  procedures,
  drawings,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const systemId = parseInt(id, 10);

      if (isNaN(systemId)) {
        return Response.json(
          { error: "Invalid ROV system ID" },
          { status: 400 }
        );
      }

      // Fetch single ROV system with its BOM, procedures, and drawings
      const system = await db
        .select()
        .from(rovSystems)
        .where(eq(rovSystems.id, systemId));

      if (system.length === 0) {
        return Response.json(
          { error: "ROV system not found" },
          { status: 404 }
        );
      }

      const [bom, systemProcedures, systemDrawings] = await Promise.all([
        db
          .select({
            id: rovSystemParts.id,
            partId: rovSystemParts.partId,
            quantityRequired: rovSystemParts.quantityRequired,
            notes: rovSystemParts.notes,
            partName: parts.name,
            partSku: parts.sku,
            partCategory: parts.category,
            partQuantity: parts.quantity,
            partUnit: parts.unit,
          })
          .from(rovSystemParts)
          .leftJoin(parts, eq(rovSystemParts.partId, parts.id))
          .where(eq(rovSystemParts.rovSystemId, systemId)),
        db
          .select()
          .from(procedures)
          .where(eq(procedures.rovSystemId, systemId)),
        db
          .select()
          .from(drawings)
          .where(eq(drawings.rovSystemId, systemId)),
      ]);

      return Response.json({
        ...system[0],
        parts: bom,
        procedures: systemProcedures,
        drawings: systemDrawings,
      });
    }

    // List all ROV systems
    const result = await db.select().from(rovSystems);
    return Response.json(result);
  } catch (error) {
    console.error("Failed to fetch ROV systems:", error);
    return Response.json(
      { error: "Failed to fetch ROV systems" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, model, description } = body;

    if (!name || !model) {
      return Response.json(
        { error: "Name and model are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(rovSystems)
      .values({ name, model, description })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create ROV system:", error);
    return Response.json(
      { error: "Failed to create ROV system" },
      { status: 500 }
    );
  }
}
