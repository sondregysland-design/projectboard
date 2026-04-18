import { db } from "@/lib/db";
import { procedures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    await requireApiAuth();
    const { searchParams } = new URL(request.url);
    const rovSystemId = searchParams.get("rovSystemId");

    let result;
    if (rovSystemId) {
      result = await db
        .select()
        .from(procedures)
        .where(eq(procedures.rovSystemId, parseInt(rovSystemId, 10)));
    } else {
      result = await db.select().from(procedures);
    }

    return Response.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to fetch procedures");
  }
}

export async function POST(request: Request) {
  try {
    await requireApiAuth();
    const body = await request.json();
    const { name, description, rovSystemId, category, content, version, fileUrl } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await db
      .insert(procedures)
      .values({
        name,
        description,
        rovSystemId,
        category,
        content,
        version,
        fileUrl,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create procedure");
  }
}
