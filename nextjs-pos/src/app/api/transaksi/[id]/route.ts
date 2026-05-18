import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/transaksi/[id] - Get single transaction with items
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: trx, error } = await supabase
      .from("transaksi")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const { data: items } = await supabase
      .from("detail_transaksi")
      .select("*")
      .eq("transaction_id", id);

    return NextResponse.json({
      success: true,
      data: { ...trx, items: items || [] },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transaksi tidak ditemukan";
    return NextResponse.json(
      { success: false, error: message },
      { status: 404 }
    );
  }
}

// PATCH /api/transaksi/[id] - Update transaction (edit buyer, status, method)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const updates: Record<string, unknown> = {};
    if (body.buyer_name !== undefined) updates.buyer_name = body.buyer_name;
    if (body.status !== undefined) updates.status = body.status;
    if (body.method !== undefined) updates.method = body.method;

    const { data, error } = await supabase
      .from("transaksi")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Transaksi berhasil diupdate",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/transaksi/[id] - Delete transaction and restore stock
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get transaction items first to restore stock
    const { data: items } = await supabase
      .from("detail_transaksi")
      .select("product_id, quantity")
      .eq("transaction_id", id);

    // Restore stock for each item
    if (items) {
      for (const item of items) {
        const { data: product } = await supabase
          .from("produk")
          .select("stok_terjual")
          .eq("id", item.product_id)
          .single();

        if (product) {
          await supabase
            .from("produk")
            .update({
              stok_terjual: Math.max(0, product.stok_terjual - item.quantity),
            })
            .eq("id", item.product_id);
        }
      }
    }

    // Delete transaction (cascade deletes detail_transaksi)
    const { error } = await supabase.from("transaksi").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dihapus, stok dikembalikan",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
