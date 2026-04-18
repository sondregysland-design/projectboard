import { db } from "@/lib/db";
import { workshopLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    await requireApiAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    let result;
    if (projectId) {
      result = await db
        .select()
        .from(workshopLogs)
        .where(eq(workshopLogs.projectId, parseInt(projectId, 10)))
        .orderBy(desc(workshopLogs.createdAt));
    } else {
      result = await db
        .select()
        .from(workshopLogs)
        .orderBy(desc(workshopLogs.createdAt));
    }

    return Response.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to fetch workshop logs");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = await request.json();
    const { projectId, message, logType, createdBy } = body;

    if (!projectId || !message) {
      return Response.json(
        { error: "projectId and message are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(workshopLogs)
      .values({
        projectId,
        message,
        logType,
        createdBy,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create workshop log");
  }
}
