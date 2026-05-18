import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/laporan - Get report data
// Query params: period=daily|weekly|monthly|all, date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily";

    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    let dateFrom = today;
    let dateTo = today;

    if (period === "weekly") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      dateFrom = d.toISOString().slice(0, 10);
    } else if (period === "monthly") {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      dateFrom = d.toISOString().slice(0, 10);
    } else if (period === "all") {
      dateFrom = "2020-01-01";
      dateTo = "2099-12-31";
    }

    // Get transactions in range
    const { data: transactions } = await supabase
      .from("transaksi")
      .select("*")
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .eq("status", "lunas")
      .order("date", { ascending: true });

    // Get expenses in range
    const { data: expenses } = await supabase
      .from("pengeluaran")
      .select("*")
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: true });

    // Get all transaction items
    const trxIds = transactions?.map((t) => t.id) || [];
    const { data: items } = await supabase
      .from("detail_transaksi")
      .select("*")
      .in("transaction_id", trxIds.length > 0 ? trxIds : ["none"]);

    // Calculate totals
    const totalPemasukan = transactions?.reduce((s, t) => s + t.total, 0) || 0;
    const totalPengeluaran = expenses?.reduce((s, e) => s + e.amount, 0) || 0;
    const tunai =
      transactions
        ?.filter((t) => t.method === "tunai")
        .reduce((s, t) => s + t.total, 0) || 0;
    const qris =
      transactions
        ?.filter((t) => t.method === "qris")
        .reduce((s, t) => s + t.total, 0) || 0;

    // Group by date for daily breakdown
    const dailyMap = new Map<
      string,
      {
        date: string;
        pemasukan: number;
        pengeluaran: number;
        tunai: number;
        qris: number;
        trx_count: number;
      }
    >();

    transactions?.forEach((t) => {
      const existing = dailyMap.get(t.date) || {
        date: t.date,
        pemasukan: 0,
        pengeluaran: 0,
        tunai: 0,
        qris: 0,
        trx_count: 0,
      };
      existing.pemasukan += t.total;
      existing.trx_count += 1;
      if (t.method === "tunai") existing.tunai += t.total;
      else existing.qris += t.total;
      dailyMap.set(t.date, existing);
    });

    expenses?.forEach((e) => {
      const existing = dailyMap.get(e.date) || {
        date: e.date,
        pemasukan: 0,
        pengeluaran: 0,
        tunai: 0,
        qris: 0,
        trx_count: 0,
      };
      existing.pengeluaran += e.amount;
      dailyMap.set(e.date, existing);
    });

    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      success: true,
      data: {
        period,
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
        daily: dailyBreakdown,
        transactions: transactions?.map((t) => ({
          ...t,
          items: items?.filter((i) => i.transaction_id === t.id) || [],
        })),
        expenses,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
