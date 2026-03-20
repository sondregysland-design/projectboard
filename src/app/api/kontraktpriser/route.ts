import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/kontraktpriser?type=customers|equipment|prices&customer_id=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "customers";
  const supabase = await createClient();

  if (type === "customers") {
    const { data, error } = await supabase
      .from("pb_customers")
      .select("*")
      .order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (type === "equipment") {
    const { data, error } = await supabase
      .from("pb_equipment")
      .select("*")
      .order("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const mapped = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      standardPrice: Number(r.standard_price) || 0,
      priceType: r.price_type || "daily",
    }));
    return NextResponse.json(mapped);
  }

  if (type === "prices") {
    const customerId = searchParams.get("customer_id");
    let query = supabase.from("pb_contract_prices").select("*");
    if (customerId) query = query.eq("customer_id", customerId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const mapped = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      customerId: r.customer_id,
      equipmentId: r.equipment_id,
      price: Number(r.price) || 0,
      priceType: r.price_type || "daily",
    }));
    return NextResponse.json(mapped);
  }

  // Lookup: get price for specific customer + equipment name
  if (type === "lookup") {
    const customerId = searchParams.get("customer_id");
    const equipmentName = searchParams.get("equipment_name");
    if (!equipmentName) return NextResponse.json({ price: null });

    // Find equipment by name
    const { data: eqData } = await supabase
      .from("pb_equipment")
      .select("id, standard_price, price_type")
      .ilike("name", equipmentName)
      .limit(1)
      .single();

    if (!eqData) return NextResponse.json({ price: null });

    // Check customer-specific price
    if (customerId) {
      const { data: cpData } = await supabase
        .from("pb_contract_prices")
        .select("price, price_type")
        .eq("customer_id", customerId)
        .eq("equipment_id", eqData.id)
        .limit(1)
        .single();

      if (cpData) {
        return NextResponse.json({
          price: Number(cpData.price),
          priceType: cpData.price_type,
          source: "contract",
        });
      }
    }

    // Fallback to standard price
    return NextResponse.json({
      price: Number(eqData.standard_price),
      priceType: eqData.price_type,
      source: "standard",
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

// POST /api/kontraktpriser — create customer, equipment, or price
export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = await createClient();
  const { type, ...data } = body;

  if (type === "customer") {
    const { error } = await supabase.from("pb_customers").insert({
      id: data.id,
      name: data.name || "",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 201 });
  }

  if (type === "equipment") {
    const { error } = await supabase.from("pb_equipment").upsert({
      id: data.id,
      name: data.name || "",
      standard_price: data.standardPrice || 0,
      price_type: data.priceType || "daily",
    }, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 201 });
  }

  if (type === "price") {
    const { error } = await supabase.from("pb_contract_prices").upsert({
      id: data.id,
      customer_id: data.customerId,
      equipment_id: data.equipmentId,
      price: data.price || 0,
      price_type: data.priceType || "daily",
    }, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

// DELETE /api/kontraktpriser?type=customer|equipment|price&id=xxx
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!type || !id) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const supabase = await createClient();
  const table = type === "customer" ? "pb_customers" : type === "equipment" ? "pb_equipment" : "pb_contract_prices";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
