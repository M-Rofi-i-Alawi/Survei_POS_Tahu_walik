import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/produk/[id] - Get single product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Produk tidak ditemukan";
    return NextResponse.json(
      { success: false, error: message },
      { status: 404 }
    );
  }
}

// PUT /api/produk/[id] - Update product (harga, stok, name, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("produk")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Produk berhasil diupdate",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH /api/produk/[id] - Partial update (kurangi stok, set stok harian)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Action-based patch
    if (body.action === "kurangi_stok") {
      // Kurangi stok (saat transaksi)
      const { data: product } = await supabase
        .from("produk")
        .select("stok_terjual")
        .eq("id", id)
        .single();

      if (!product) throw new Error("Produk tidak ditemukan");

      const { data, error } = await supabase
        .from("produk")
        .update({
          stok_terjual: product.stok_terjual + (body.quantity || 1),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (body.action === "restore_stok") {
      // Kembalikan stok (saat hapus transaksi)
      const { data: product } = await supabase
        .from("produk")
        .select("stok_terjual")
        .eq("id", id)
        .single();

      if (!product) throw new Error("Produk tidak ditemukan");

      const { data, error } = await supabase
        .from("produk")
        .update({
          stok_terjual: Math.max(0, product.stok_terjual - (body.quantity || 1)),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (body.action === "set_stok_harian") {
      const { data, error } = await supabase
        .from("produk")
        .update({ stok_harian: body.stok_harian, stok_terjual: 0 })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (body.action === "reset_stok") {
      const { data, error } = await supabase
        .from("produk")
        .update({ stok_terjual: 0 })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // Default: partial update
    const { data, error } = await supabase
      .from("produk")
      .update(body)
      .eq("id", id)
      .select()
      .single();

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

// DELETE /api/produk/[id] - Delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase.from("produk").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
