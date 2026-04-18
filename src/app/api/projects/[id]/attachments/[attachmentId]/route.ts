import { db } from "@/lib/db";
import { projectAttachments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await requireApiAuth();
    const { attachmentId } = await params;
    const attId = parseInt(attachmentId, 10);

    if (isNaN(attId)) {
      return Response.json({ error: "Invalid attachment ID" }, { status: 400 });
    }

    const result = await db
      .select()
      .from(projectAttachments)
      .where(eq(projectAttachments.id, attId));

    if (result.length === 0) {
      return Response.json({ error: "Attachment not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    return handleApiError(error, "Failed to fetch attachment");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    await requireApiAuth();
    const { id, attachmentId } = await params;
    const projectId = parseInt(id, 10);
    const attId = parseInt(attachmentId, 10);

    if (isNaN(projectId) || isNaN(attId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const result = await db
      .delete(projectAttachments)
      .where(
        and(
          eq(projectAttachments.id, attId),
          eq(projectAttachments.projectId, projectId)
        )
      )
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Attachment not found" }, { status: 404 });
    }

    return Response.json({ message: "Attachment deleted" });
  } catch (error) {
    return handleApiError(error, "Failed to delete attachment");
  }
}
