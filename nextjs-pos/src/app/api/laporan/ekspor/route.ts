import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/laporan/ekspor - Get raw data for client-side PDF/Excel export
// Query: ?period=daily|weekly|monthly|all&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly";
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    let dateFrom: string;
    let dateTo = todayStr;

    // Support explicit date range override
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
      // monthly
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      dateFrom = d.toISOString().slice(0, 10);
    }

    const supabase = await createClient();

    // Fetch store config for export header
    const { data: storeConfig } = await supabase
      .from("store_config")
      .select("name")
      .limit(1)
      .single();

    const storeName = storeConfig?.name || "Cemil.in";

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

    const periodLabel: Record<string, string> = {
      daily: "Harian",
      weekly: "Mingguan",
      monthly: "Bulanan",
      all: "Semua Periode",
    };

    return NextResponse.json({
      success: true,
      data: {
        // Metadata for export header
        storeName,
        period: periodLabel[period] || period,
        dateRange:
          dateFrom === dateTo
            ? new Date(dateFrom).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
            : `${new Date(dateFrom).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} - ${new Date(dateTo).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
        exportedAt: new Date().toISOString(),

        // Summary
        summary: {
          total_pemasukan: totalPemasukan,
          total_pengeluaran: totalPengeluaran,
          laba_rugi: totalPemasukan - totalPengeluaran,
          total_transaksi: transactions?.length || 0,
          tunai,
          qris,
        },

        // Full data for PDF/Excel rendering on client
        transactions: transactions?.map((t) => ({
          ...t,
          items: items?.filter((i) => i.transaction_id === t.id) || [],
        })) || [],
        expenses: expenses || [],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
