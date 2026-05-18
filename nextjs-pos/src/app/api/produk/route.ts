import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/produk - List all products
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/produk - Create new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("produk")
      .insert({
        name: body.name,
        price: body.price || 1000,
        stok_harian: body.stok_harian || 0,
        stok_terjual: 0,
        image: body.image || "🥟",
        photo_url: body.photo_url || "",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data, message: "Produk berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
