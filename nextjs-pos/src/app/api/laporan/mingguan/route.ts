import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/laporan/mingguan - Laporan 7 hari terakhir
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (opsional, default 7 hari terakhir)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const today = new Date();
    const dateTo = searchParams.get("to") || today.toISOString().slice(0, 10);
    const fromDefault = new Date(today);
    fromDefault.setDate(fromDefault.getDate() - 6);
    const dateFrom = searchParams.get("from") || fromDefault.toISOString().slice(0, 10);

    const supabase = await createClient();

    const { data: transactions } = await supabase
      .from("transaksi")
      .select("*")
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .eq("status", "lunas")
      .order("date", { ascending: true });

    const { data: expenses } = await supabase
      .from("pengeluaran")
      .select("*")
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: true });

    const trxIds = transactions?.map((t) => t.id) || [];
    const { data: items } = await supabase
      .from("detail_transaksi")
      .select("*")
      .in("transaction_id", trxIds.length > 0 ? trxIds : ["none"]);

    const totalPemasukan = transactions?.reduce((s, t) => s + t.total, 0) || 0;
    const totalPengeluaran = expenses?.reduce((s, e) => s + e.amount, 0) || 0;
    const tunai = transactions?.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0) || 0;
    const qris = transactions?.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0) || 0;

    // Group by date
    const dailyMap = new Map<string, { date: string; pemasukan: number; pengeluaran: number; tunai: number; qris: number; trx_count: number }>();
    transactions?.forEach((t) => {
      const d = dailyMap.get(t.date) || { date: t.date, pemasukan: 0, pengeluaran: 0, tunai: 0, qris: 0, trx_count: 0 };
      d.pemasukan += t.total;
      d.trx_count += 1;
      if (t.method === "tunai") d.tunai += t.total;
      else d.qris += t.total;
      dailyMap.set(t.date, d);
    });
    expenses?.forEach((e) => {
      const d = dailyMap.get(e.date) || { date: e.date, pemasukan: 0, pengeluaran: 0, tunai: 0, qris: 0, trx_count: 0 };
      d.pengeluaran += e.amount;
      dailyMap.set(e.date, d);
    });
    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        period: "weekly",
        dateFrom,
        dateTo,
        summary: {
          total_pemasukan: totalPemasukan,
          total_pengeluaran: totalPengeluaran,
          laba_rugi: totalPemasukan - totalPengeluaran,
          total_transaksi: transactions?.length || 0,
          tunai,
          qris,
        },
        daily,
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
