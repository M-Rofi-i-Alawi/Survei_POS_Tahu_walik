import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/transaksi - List transactions with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const method = searchParams.get("method");

    const supabase = await createClient();

    let query = supabase
      .from("transaksi")
      .select("*")
      .order("created_at", { ascending: false });

    if (date) query = query.eq("date", date);
    if (status && status !== "all") query = query.eq("status", status);
    if (method && method !== "all") query = query.eq("method", method);

    const { data: transactions, error } = await query;
    if (error) throw error;

    // Fetch items for each transaction
    const transactionIds = transactions?.map((t) => t.id) || [];

    const { data: items } = await supabase
      .from("detail_transaksi")
      .select("*")
      .in("transaction_id", transactionIds.length > 0 ? transactionIds : ["none"]);

    // Merge items into transactions
    const result = transactions?.map((t) => ({
      ...t,
      items: items?.filter((i) => i.transaction_id === t.id) || [],
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/transaksi - Create transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, method, buyer_name, status_override } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Items tidak boleh kosong" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const total = items.reduce(
      (sum: number, item: { subtotal: number }) => sum + item.subtotal,
      0
    );
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Use status_override if provided, otherwise default logic
    const status = status_override || (method === "tunai" ? "lunas" : "pending");

    // Create transaction
    const { data: trx, error: trxError } = await supabase
      .from("transaksi")
      .insert({
        buyer_name: buyer_name || "Umum",
        total,
        method,
        status,
        date,
        time,
      })
      .select()
      .single();

    if (trxError) throw trxError;

    // Create detail items
    const detailItems = items.map(
      (item: {
        product_id: string;
        product_name: string;
        quantity: number;
        price: number;
        subtotal: number;
      }) => ({
        transaction_id: trx.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })
    );

    const { error: detailError } = await supabase
      .from("detail_transaksi")
      .insert(detailItems);

    if (detailError) throw detailError;

    // Reduce stock for all items
    for (const item of items) {
      const { data: product } = await supabase
        .from("produk")
        .select("stok_terjual")
        .eq("id", item.product_id)
        .single();

      if (product) {
        await supabase
          .from("produk")
          .update({ stok_terjual: product.stok_terjual + item.quantity })
          .eq("id", item.product_id);
      }
    }

    // Check for stock notifications
    for (const item of items) {
      const { data: product } = await supabase
        .from("produk")
        .select("*")
        .eq("id", item.product_id)
        .single();

      if (product) {
        const sisa = product.stok_harian - product.stok_terjual;
        if (sisa <= 0 && product.stok_harian > 0) {
          // Check if notification already exists today
          const { data: existing } = await supabase
            .from("notifikasi")
            .select("id")
            .eq("product_id", item.product_id)
            .eq("type", "stok_habis")
            .gte("timestamp", `${date}T00:00:00`)
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from("notifikasi").insert({
              type: "stok_habis",
              message: `Stok ${product.name} Habis! Jualan hari ini selesai 🎉`,
              product_id: item.product_id,
              read: false,
            });
          }
        }
      }
    }

    // Return transaction with items
    const result = { ...trx, items: detailItems };

    return NextResponse.json(
      { success: true, data: result, message: "Transaksi berhasil" },
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
