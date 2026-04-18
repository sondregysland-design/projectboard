import { db } from "@/lib/db";
import { projectAttachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET(
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

    const result = await db
      .select({
        id: projectAttachments.id,
        projectId: projectAttachments.projectId,
        name: projectAttachments.name,
        fileType: projectAttachments.fileType,
        fileSize: projectAttachments.fileSize,
        category: projectAttachments.category,
        createdAt: projectAttachments.createdAt,
      })
      .from(projectAttachments)
      .where(eq(projectAttachments.projectId, projectId));

    return Response.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to fetch attachments");
  }
}

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
    const { name, fileType, fileData, fileSize, category } = body;

    if (!name || !fileType || !fileData || !fileSize) {
      return Response.json(
        { error: "name, fileType, fileData, and fileSize are required" },
        { status: 400 }
      );
    }

    if (fileSize > 5 * 1024 * 1024) {
      return Response.json(
        { error: "File size must be under 5MB" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(projectAttachments)
      .values({
        projectId,
        name,
        fileType,
        fileData,
        fileSize,
        category: category || "general",
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to upload attachment");
  }
}
