import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pb_todos")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const todos = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    task: row.task ?? "",
    category: row.category ?? "",
    status: row.status ?? "pending",
    dueDate: row.due_date ?? "",
  }));

  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = await createClient();

  const { error } = await supabase.from("pb_todos").insert({
    id: body.id,
    task: body.task ?? "",
    category: body.category ?? "",
    status: body.status ?? "pending",
    due_date: body.dueDate || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (fields.task !== undefined) updateData.task = fields.task;
  if (fields.category !== undefined) updateData.category = fields.category;
  if (fields.status !== undefined) updateData.status = fields.status;
  if (fields.dueDate !== undefined) updateData.due_date = fields.dueDate || null;

  const { error } = await supabase.from("pb_todos").update(updateData).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pb_todos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
