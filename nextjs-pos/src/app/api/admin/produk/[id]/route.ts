import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/produk/[id] - Get single product (admin)
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

// PUT /api/admin/produk/[id] - Full update product (admin)
// Admin bisa update: name, price, stok_harian, stok_terjual, image, photo_url
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.price !== undefined) updates.price = body.price;
    if (body.stok_harian !== undefined) updates.stok_harian = body.stok_harian;
    if (body.stok_terjual !== undefined) updates.stok_terjual = body.stok_terjual;
    if (body.image !== undefined) updates.image = body.image;
    if (body.photo_url !== undefined) updates.photo_url = body.photo_url;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada data yang diupdate" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("produk")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Produk berhasil diupdate oleh admin",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/produk/[id] - Delete product (admin)
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
      message: "Produk berhasil dihapus oleh admin",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
