import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/laporan/laba-rugi - Laporan laba rugi
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&period=daily|weekly|monthly|all
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly";
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    let dateFrom: string;
    let dateTo = todayStr;

    // Support explicit date range
    if (searchParams.get("from") && searchParams.get("to")) {
      dateFrom = searchParams.get("from")!;
      dateTo = searchParams.get("to")!;
    } else if (period === "daily") {
      dateFrom = todayStr;
    } else if (period === "weekly") {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      dateFrom = d.toISOString().slice(0, 10);
    } else if (period === "all") {
      dateFrom = "2020-01-01";
      dateTo = "2099-12-31";
    } else {
      // monthly (default)
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      dateFrom = d.toISOString().slice(0, 10);
    }

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

    const totalPemasukan = transactions?.reduce((s, t) => s + t.total, 0) || 0;
    const totalPengeluaran = expenses?.reduce((s, e) => s + e.amount, 0) || 0;
    const labaRugi = totalPemasukan - totalPengeluaran;
    const tunai = transactions?.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0) || 0;
    const qris = transactions?.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0) || 0;

    // Group expenses by description/category for detail breakdown
    const expenseByCategory = new Map<string, number>();
    expenses?.forEach((e) => {
      expenseByCategory.set(e.description, (expenseByCategory.get(e.description) || 0) + e.amount);
    });

    // Daily profit/loss breakdown
    const dailyMap = new Map<string, { date: string; pemasukan: number; pengeluaran: number; laba_rugi: number }>();
    transactions?.forEach((t) => {
      const d = dailyMap.get(t.date) || { date: t.date, pemasukan: 0, pengeluaran: 0, laba_rugi: 0 };
      d.pemasukan += t.total;
      d.laba_rugi += t.total;
      dailyMap.set(t.date, d);
    });
    expenses?.forEach((e) => {
      const d = dailyMap.get(e.date) || { date: e.date, pemasukan: 0, pengeluaran: 0, laba_rugi: 0 };
      d.pengeluaran += e.amount;
      d.laba_rugi -= e.amount;
      dailyMap.set(e.date, d);
    });
    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateFrom,
        dateTo,
        is_profit: labaRugi >= 0,
        summary: {
          total_pemasukan: totalPemasukan,
          total_pengeluaran: totalPengeluaran,
          laba_rugi: labaRugi,
          total_transaksi: transactions?.length || 0,
          tunai,
          qris,
        },
        expense_breakdown: Array.from(expenseByCategory.entries()).map(([desc, amount]) => ({
          description: desc,
          amount,
        })),
        daily,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
