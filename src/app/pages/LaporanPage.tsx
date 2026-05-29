import { useState, useMemo, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, Download, FileSpreadsheet, ChevronDown, X, Check } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as XLSX from "xlsx";
import { useApp } from "../context/AppContext";

export default function LaporanPage() {
  const { transactions, expenses, storeConfig } = useApp();
  const [period, setPeriod] = useState("daily");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-hide success toast
  useEffect(() => {
    if (exportSuccess) {
      const timer = setTimeout(() => setExportSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccess]);

  const todayTrx = useMemo(() => transactions.filter((t) => t.date === today && t.status === "lunas"), [transactions, today]);
  const todayTunai = todayTrx.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0);
  const todayQris = todayTrx.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0);
  const todayTotal = todayTunai + todayQris;
  const todayExpenses = useMemo(() => expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0), [expenses, today]);
  const todayProfit = todayTotal - todayExpenses;

  const allLunas = transactions.filter((t) => t.status === "lunas");
  const allTotalIncome = allLunas.reduce((s, t) => s + t.total, 0);
  const allTunai = allLunas.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0);
  const allQris = allLunas.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0);
  const allTotalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const allProfit = allTotalIncome - allTotalExpense;

  // Weekly (7 days) calculations
  const weeklyData = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().slice(0, 10);
    const weeklyTrx = allLunas.filter((t) => t.date >= startDate);
    const weeklyTunai = weeklyTrx.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0);
    const weeklyQris = weeklyTrx.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0);
    const weeklyTotal = weeklyTunai + weeklyQris;
    const weeklyExpenses = expenses.filter((e) => e.date >= startDate).reduce((s, e) => s + e.amount, 0);
    const weeklyProfit = weeklyTotal - weeklyExpenses;
    return { weeklyTunai, weeklyQris, weeklyTotal, weeklyExpenses, weeklyProfit, startDate };
  }, [allLunas, expenses]);

  // Period-aware values
  const displayTunai = period === "daily" ? todayTunai : period === "weekly" ? weeklyData.weeklyTunai : allTunai;
  const displayQris = period === "daily" ? todayQris : period === "weekly" ? weeklyData.weeklyQris : allQris;
  const displayTotal = period === "daily" ? todayTotal : period === "weekly" ? weeklyData.weeklyTotal : allTotalIncome;
  const displayExpenses = period === "daily" ? todayExpenses : period === "weekly" ? weeklyData.weeklyExpenses : allTotalExpense;
  const displayProfit = period === "daily" ? todayProfit : period === "weekly" ? weeklyData.weeklyProfit : allProfit;

  // Get filtered transactions/expenses based on period
  const getFilteredTransactions = () => {
    const lunas = transactions.filter((t) => t.status === "lunas");
    if (period === "daily") return lunas.filter((t) => t.date === today);
    if (period === "weekly") return lunas.filter((t) => t.date >= weeklyData.startDate);
    return lunas;
  };

  const getFilteredExpenses = () => {
    if (period === "daily") return expenses.filter((e) => e.date === today);
    if (period === "weekly") return expenses.filter((e) => e.date >= weeklyData.startDate);
    return expenses;
  };

  const getPeriodLabel = () => {
    if (period === "daily") return `Hari Ini (${today})`;
    if (period === "weekly") return `7 Hari Terakhir (${weeklyData.startDate} s/d ${today})`;
    return "Semua Waktu";
  };

  // ============ EXPORT FUNCTIONS ============

  const downloadWorkbook = (wb: XLSX.WorkBook, filename: string) => {
    XLSX.writeFile(wb, filename);
    setExportSuccess(filename);
    setShowExportMenu(false);
  };

  const exportRekapPenjualan = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Rekap Summary
    const summaryData = [
      [`LAPORAN REKAP PENJUALAN - ${storeConfig.name || "Cemil.in"}`],
      [`Periode: ${getPeriodLabel()}`],
      [`Dicetak: ${new Date().toLocaleString("id-ID")}`],
      [],
      ["KATEGORI", "JUMLAH (Rp)"],
      ["Pemasukan Tunai", displayTunai],
      ["Pemasukan QRIS", displayQris],
      ["Total Pemasukan", displayTotal],
      [],
      ["Total Pengeluaran", displayExpenses],
      [],
      [displayProfit >= 0 ? "LABA BERSIH" : "RUGI BERSIH", Math.abs(displayProfit)],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths
    ws1["!cols"] = [{ wch: 25 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws1, "Rekap Penjualan");

    // Sheet 2: Penjualan per hari
    const filteredTrx = getFilteredTransactions();
    const dailySales: Record<string, { tunai: number; qris: number; total: number; count: number }> = {};
    filteredTrx.forEach((t) => {
      if (!dailySales[t.date]) dailySales[t.date] = { tunai: 0, qris: 0, total: 0, count: 0 };
      dailySales[t.date].total += t.total;
      dailySales[t.date].count += 1;
      if (t.method === "tunai") dailySales[t.date].tunai += t.total;
      else dailySales[t.date].qris += t.total;
    });

    const dailyData = [
      ["PENJUALAN PER HARI"],
      [],
      ["Tanggal", "Jumlah Transaksi", "Tunai (Rp)", "QRIS (Rp)", "Total (Rp)"],
      ...Object.entries(dailySales)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => [date, data.count, data.tunai, data.qris, data.total]),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(dailyData);
    ws2["!cols"] = [{ wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Per Hari");

    const dateStr = today.replace(/-/g, "");
    downloadWorkbook(wb, `Rekap_Penjualan_${dateStr}.xlsx`);
  };

  const exportDaftarTransaksi = () => {
    const wb = XLSX.utils.book_new();
    const filteredTrx = getFilteredTransactions();

    const trxData = [
      [`DAFTAR TRANSAKSI - ${storeConfig.name || "Cemil.in"}`],
      [`Periode: ${getPeriodLabel()}`],
      [`Dicetak: ${new Date().toLocaleString("id-ID")}`],
      [`Total: ${filteredTrx.length} transaksi`],
      [],
      ["No", "ID Transaksi", "Tanggal", "Jam", "Pembeli", "Item", "Qty", "Metode", "Status", "Total (Rp)"],
      ...filteredTrx.map((t, i) => [
        i + 1,
        t.id.slice(0, 12),
        t.date,
        t.time,
        t.buyerName || "Umum",
        t.items.map((item) => item.productName).join(", "),
        t.items.reduce((sum, item) => sum + item.quantity, 0),
        t.method === "tunai" ? "Tunai" : "QRIS",
        t.status === "lunas" ? "Lunas" : "Pending",
        t.total,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(trxData);
    ws["!cols"] = [
      { wch: 5 },  // No
      { wch: 16 }, // ID
      { wch: 12 }, // Tanggal
      { wch: 8 },  // Jam
      { wch: 18 }, // Pembeli
      { wch: 30 }, // Item
      { wch: 6 },  // Qty
      { wch: 8 },  // Metode
      { wch: 10 }, // Status
      { wch: 15 }, // Total
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Daftar Transaksi");

    // Sheet 2: Detail per item
    const itemData = [
      ["DETAIL ITEM TRANSAKSI"],
      [],
      ["ID Transaksi", "Tanggal", "Produk", "Harga Satuan (Rp)", "Qty", "Subtotal (Rp)"],
      ...filteredTrx.flatMap((t) =>
        t.items.map((item) => [
          t.id.slice(0, 12),
          t.date,
          item.productName,
          item.price,
          item.quantity,
          item.subtotal,
        ])
      ),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(itemData);
    ws2["!cols"] = [
      { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 6 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "Detail Item");

    const dateStr = today.replace(/-/g, "");
    downloadWorkbook(wb, `Daftar_Transaksi_${dateStr}.xlsx`);
  };

  const exportDaftarPengeluaran = () => {
    const wb = XLSX.utils.book_new();
    const filteredExp = getFilteredExpenses();

    const expData = [
      [`DAFTAR PENGELUARAN - ${storeConfig.name || "Cemil.in"}`],
      [`Periode: ${getPeriodLabel()}`],
      [`Dicetak: ${new Date().toLocaleString("id-ID")}`],
      [`Total: ${filteredExp.length} pengeluaran`],
      [],
      ["No", "Tanggal", "Keterangan", "Jumlah (Rp)"],
      ...filteredExp.map((e, i) => [
        i + 1,
        e.date,
        e.description,
        e.amount,
      ]),
      [],
      ["", "", "TOTAL PENGELUARAN", filteredExp.reduce((s, e) => s + e.amount, 0)],
    ];

    const ws = XLSX.utils.aoa_to_sheet(expData);
    ws["!cols"] = [
      { wch: 5 },  // No
      { wch: 12 }, // Tanggal
      { wch: 35 }, // Keterangan
      { wch: 18 }, // Jumlah
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Daftar Pengeluaran");

    const dateStr = today.replace(/-/g, "");
    downloadWorkbook(wb, `Daftar_Pengeluaran_${dateStr}.xlsx`);
  };

  const exportLaporanLengkap = () => {
    const wb = XLSX.utils.book_new();
    const filteredTrx = getFilteredTransactions();
    const filteredExp = getFilteredExpenses();

    // Sheet 1: Rekap
    const summaryData = [
      [`LAPORAN LENGKAP - ${storeConfig.name || "Cemil.in"}`],
      [`Alamat: ${storeConfig.address || "-"}`],
      [`Telp: ${storeConfig.phone || "-"}`],
      [`Periode: ${getPeriodLabel()}`],
      [`Dicetak: ${new Date().toLocaleString("id-ID")}`],
      [],
      ["═══════ RINGKASAN PENJUALAN ═══════"],
      [],
      ["Kategori", "Jumlah (Rp)"],
      ["Pemasukan Tunai", displayTunai],
      ["Pemasukan QRIS", displayQris],
      ["Total Pemasukan", displayTotal],
      [],
      ["Total Pengeluaran", displayExpenses],
      [],
      [displayProfit >= 0 ? "✅ LABA BERSIH" : "❌ RUGI BERSIH", Math.abs(displayProfit)],
      [],
      ["═══════ STATISTIK ═══════"],
      [],
      ["Total Transaksi Lunas", filteredTrx.length],
      ["Transaksi Tunai", filteredTrx.filter((t) => t.method === "tunai").length],
      ["Transaksi QRIS", filteredTrx.filter((t) => t.method === "qris").length],
      ["Rata-rata per Transaksi", filteredTrx.length > 0 ? Math.round(displayTotal / filteredTrx.length) : 0],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan");

    // Sheet 2: Transaksi
    const trxData = [
      ["DAFTAR TRANSAKSI"],
      [],
      ["No", "ID", "Tanggal", "Jam", "Pembeli", "Item", "Metode", "Total (Rp)"],
      ...filteredTrx.map((t, i) => [
        i + 1,
        t.id.slice(0, 12),
        t.date,
        t.time,
        t.buyerName || "Umum",
        t.items.map((item) => `${item.quantity}x ${item.productName}`).join(", "),
        t.method === "tunai" ? "Tunai" : "QRIS",
        t.total,
      ]),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(trxData);
    ws2["!cols"] = [{ wch: 5 }, { wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 35 }, { wch: 8 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Transaksi");

    // Sheet 3: Pengeluaran
    const expData = [
      ["DAFTAR PENGELUARAN"],
      [],
      ["No", "Tanggal", "Keterangan", "Jumlah (Rp)"],
      ...filteredExp.map((e, i) => [i + 1, e.date, e.description, e.amount]),
      [],
      ["", "", "TOTAL", filteredExp.reduce((s, e) => s + e.amount, 0)],
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(expData);
    ws3["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 35 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Pengeluaran");

    // Sheet 4: Laba Rugi
    const labaData = [
      ["PERHITUNGAN LABA RUGI"],
      [],
      ["Keterangan", "Jumlah (Rp)"],
      ["(+) Pemasukan Tunai", displayTunai],
      ["(+) Pemasukan QRIS", displayQris],
      ["Total Pemasukan", displayTotal],
      [],
      ["(-) Total Pengeluaran", displayExpenses],
      ...filteredExp.map((e) => [`    - ${e.description} (${e.date})`, e.amount]),
      [],
      [displayProfit >= 0 ? "LABA BERSIH" : "RUGI BERSIH", displayProfit],
    ];

    const ws4 = XLSX.utils.aoa_to_sheet(labaData);
    ws4["!cols"] = [{ wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws4, "Laba Rugi");

    const dateStr = today.replace(/-/g, "");
    downloadWorkbook(wb, `Laporan_Lengkap_${storeConfig.name || "POS"}_${dateStr}.xlsx`);
  };

  // Chart data: Tunai vs QRIS breakdown (period-aware)
  const paymentBreakdown = [
    { name: "Tunai", value: displayTunai, color: "#22c55e" },
    { name: "QRIS", value: displayQris, color: "#FBAA31" },
  ];

  // Last 7 days data
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTrx = transactions.filter((t) => t.date === dateStr && t.status === "lunas");
      const dayTotal = dayTrx.reduce((s, t) => s + t.total, 0);
      days.push({ date: d.toLocaleDateString("id-ID", { weekday: "short" }), total: dayTotal });
    }
    return days;
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Laporan Penjualan</h1>
          <p className="text-muted-foreground mt-1">Rekap penjualan & laba rugi</p>
        </div>
        <div className="flex gap-2 items-center">
          {["daily", "weekly", "all"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${period === p ? "bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white shadow-lg" : "bg-white border border-border hover:border-[#FBAA31]"}`}>
              {p === "daily" ? "Hari Ini" : p === "weekly" ? "7 Hari" : "Semua"}
            </button>
          ))}

          {/* Export/Download Button */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 rounded-xl font-medium text-sm transition-all bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-border">
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export ke Excel (.xlsx)
                  </p>
                  <p className="text-[10px] text-emerald-600/70 mt-0.5">Periode: {getPeriodLabel()}</p>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={exportLaporanLengkap}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                        <FileSpreadsheet className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-emerald-700 transition-colors">📊 Laporan Lengkap</p>
                        <p className="text-[11px] text-muted-foreground">Ringkasan, transaksi, pengeluaran & laba rugi</p>
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-border mx-2 my-0.5" />

                  <button
                    onClick={exportRekapPenjualan}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FBAA31] to-[#E87428] flex items-center justify-center text-white shrink-0">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-[#E87428] transition-colors">📈 Rekap Penjualan</p>
                        <p className="text-[11px] text-muted-foreground">Ringkasan pemasukan & penjualan per hari</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={exportDaftarTransaksi}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                        <Download className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-blue-600 transition-colors">📋 Daftar Transaksi</p>
                        <p className="text-[11px] text-muted-foreground">Semua transaksi + detail item per transaksi</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={exportDaftarPengeluaran}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shrink-0">
                        <TrendingDown className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-red-600 transition-colors">💰 Daftar Pengeluaran</p>
                        <p className="text-[11px] text-muted-foreground">Semua pengeluaran dengan total</p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="px-4 py-2.5 bg-muted/30 border-t border-border">
                  <p className="text-[10px] text-muted-foreground text-center">💡 File .xlsx bisa dibuka di Excel, Google Sheets, atau LibreOffice</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Success Toast */}
      {exportSuccess && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-3 fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-emerald-700">Download Berhasil!</p>
              <p className="text-xs text-muted-foreground truncate">{exportSuccess}</p>
            </div>
            <button onClick={() => setExportSuccess(null)} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#FBAA31] to-[#E87428] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 opacity-80" /><span className="text-sm opacity-80">Total Pemasukan</span></div>
          <p className="text-2xl font-bold">Rp {displayTotal.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm text-muted-foreground">💵 Tunai</span></div>
          <p className="text-2xl font-bold text-green-600">Rp {displayTunai.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm text-muted-foreground">📱 QRIS</span></div>
          <p className="text-2xl font-bold text-[#E87428]">Rp {displayQris.toLocaleString("id-ID")}</p>
        </div>
        <div className={`rounded-2xl p-5 ${displayProfit >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-2 mb-2">
            {displayProfit >= 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            <span className="text-sm text-muted-foreground">Laba/Rugi</span>
          </div>
          <p className={`text-2xl font-bold ${displayProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
            Rp {Math.abs(displayProfit).toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Pengeluaran: Rp {displayExpenses.toLocaleString("id-ID")}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7 Days Chart */}
        <div className="bg-white rounded-2xl p-6 border border-border">
          <h3 className="font-bold text-lg mb-4">Penjualan 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#999" style={{ fontSize: "12px" }} />
              <YAxis stroke="#999" style={{ fontSize: "12px" }} tickFormatter={(v) => v > 0 ? `${v / 1000}k` : "0"} />
              <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`} contentStyle={{ borderRadius: "12px" }} />
              <Bar dataKey="total" fill="#FBAA31" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-border">
          <h3 className="font-bold text-lg mb-4">Breakdown Tunai vs QRIS ({period === "daily" ? "Hari Ini" : period === "weekly" ? "7 Hari" : "Semua"})</h3>
          {(displayTunai + displayQris) > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={paymentBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {paymentBreakdown.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm">{period === "daily" ? "Belum ada transaksi hari ini" : "Belum ada data transaksi"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Laba Rugi Detail */}
      <div className="bg-white rounded-2xl p-6 border border-border">
        <h3 className="font-bold text-lg mb-4">📊 Perhitungan Laba Rugi</h3>
        <div className="space-y-3">
          <div className="flex justify-between p-3 bg-green-50 rounded-xl">
            <span className="font-medium text-green-700">Total Pemasukan</span>
            <span className="font-bold text-green-700">+ Rp {displayTotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between p-3 bg-red-50 rounded-xl">
            <span className="font-medium text-red-600">Total Pengeluaran</span>
            <span className="font-bold text-red-600">- Rp {displayExpenses.toLocaleString("id-ID")}</span>
          </div>
          <div className={`flex justify-between p-4 rounded-xl font-bold text-lg ${displayProfit >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            <span>{displayProfit >= 0 ? "🟢 LABA" : "🔴 RUGI"}</span>
            <span>Rp {Math.abs(displayProfit).toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
