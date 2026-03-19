import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .select("*")
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const procedures = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    url: row.url ?? "",
    storagePath: row.storage_path ?? "",
    size: row.size ?? 0,
    uploadedAt: row.uploaded_at ?? "",
  }));

  return NextResponse.json(procedures);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = await createClient();

  const { error } = await supabase.from("procedures").upsert({
    id: body.id,
    name: body.name ?? "",
    description: body.description ?? "",
    url: body.url ?? "",
    storage_path: body.storagePath ?? "",
    size: body.size ?? 0,
    uploaded_at: body.uploadedAt || new Date().toISOString().split("T")[0],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("procedures").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
