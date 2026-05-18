import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/laporan/harian - Laporan harian
// Query: ?date=YYYY-MM-DD (default: hari ini)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const today = new Date().toISOString().slice(0, 10);
    const date = searchParams.get("date") || today;

    const supabase = await createClient();

    const { data: transactions } = await supabase
      .from("transaksi")
      .select("*")
      .eq("date", date)
      .eq("status", "lunas")
      .order("created_at", { ascending: false });

    const { data: expenses } = await supabase
      .from("pengeluaran")
      .select("*")
      .eq("date", date)
      .order("created_at", { ascending: false });

    const trxIds = transactions?.map((t) => t.id) || [];
    const { data: items } = await supabase
      .from("detail_transaksi")
      .select("*")
      .in("transaction_id", trxIds.length > 0 ? trxIds : ["none"]);

    const totalPemasukan = transactions?.reduce((s, t) => s + t.total, 0) || 0;
    const totalPengeluaran = expenses?.reduce((s, e) => s + e.amount, 0) || 0;
    const tunai = transactions?.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0) || 0;
    const qris = transactions?.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        period: "daily",
        date,
        summary: {
          total_pemasukan: totalPemasukan,
          total_pengeluaran: totalPengeluaran,
          laba_rugi: totalPemasukan - totalPengeluaran,
          total_transaksi: transactions?.length || 0,
          tunai,
          qris,
        },
        transactions: transactions?.map((t) => ({
          ...t,
          items: items?.filter((i) => i.transaction_id === t.id) || [],
        })),
        expenses,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
