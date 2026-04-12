import { db } from "@/lib/db";
import {
  rovSystems,
  rovSystemParts,
  parts,
  procedures,
  drawings,
  projects,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const systemId = parseInt(id, 10);

    if (isNaN(systemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const system = await db
      .select()
      .from(rovSystems)
      .where(eq(rovSystems.id, systemId));

    if (system.length === 0) {
      return Response.json({ error: "ROV system not found" }, { status: 404 });
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
          partMinStock: parts.minStock,
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

    const linkedProjects = await db
      .select({ id: projects.id, status: projects.status })
      .from(projects)
      .where(eq(projects.rovSystemId, systemId));

    return Response.json({
      ...system[0],
      parts: bom,
      procedures: systemProcedures,
      drawings: systemDrawings,
      linkedProjects,
    });
  } catch (error) {
    console.error("Failed to fetch ROV system:", error);
    return Response.json(
      { error: "Failed to fetch ROV system" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const systemId = parseInt(id, 10);

    if (isNaN(systemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    const result = await db
      .update(rovSystems)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(rovSystems.id, systemId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "ROV system not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Failed to update ROV system:", error);
    return Response.json(
      { error: "Failed to update ROV system" },
      { status: 500 }
    );
  }
}

const ACTIVE_PROJECT_STATUSES = ["planning", "workshop", "offshore", "invoicing"];

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const systemId = parseInt(id, 10);

    if (isNaN(systemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const linkedProjects = await db
      .select({ id: projects.id, status: projects.status })
      .from(projects)
      .where(eq(projects.rovSystemId, systemId));

    const hasActiveProjects = linkedProjects.some((p) =>
      ACTIVE_PROJECT_STATUSES.includes(p.status)
    );

    if (hasActiveProjects) {
      return Response.json(
        {
          error:
            "Kan ikke slette — systemet er tilordnet aktive prosjekter. Sett som utgått i stedet.",
        },
        { status: 409 }
      );
    }

    if (linkedProjects.length > 0) {
      const result = await db
        .update(rovSystems)
        .set({ status: "retired", updatedAt: new Date().toISOString() })
        .where(eq(rovSystems.id, systemId))
        .returning();

      return Response.json({
        message: "ROV system set to retired (linked to completed projects)",
        system: result[0],
        softDelete: true,
      });
    }

    await Promise.all([
      db.delete(rovSystemParts).where(eq(rovSystemParts.rovSystemId, systemId)),
      db.delete(procedures).where(eq(procedures.rovSystemId, systemId)),
      db.delete(drawings).where(eq(drawings.rovSystemId, systemId)),
    ]);

    const result = await db
      .delete(rovSystems)
      .where(eq(rovSystems.id, systemId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "ROV system not found" }, { status: 404 });
    }

    return Response.json({
      message: "ROV system deleted",
      system: result[0],
      softDelete: false,
    });
  } catch (error) {
    console.error("Failed to delete ROV system:", error);
    return Response.json(
      { error: "Failed to delete ROV system" },
      { status: 500 }
    );
  }
}
