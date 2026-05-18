"use client";
import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Download, FileText, FileSpreadsheet } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useUser } from "../layout";
import { exportToPDF, exportToExcel } from "@/lib/export";
import type { Transaction, Expense } from "@/lib/types";

export default function LaporanPage() {
  const { storeConfig } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState("daily");
  const [exporting, setExporting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      const [trxRes, expRes] = await Promise.all([api.transaksi.list(), api.pengeluaran.list()]);
      if (trxRes.success) setTransactions(trxRes.data as Transaction[]);
      if (expRes.success) setExpenses(expRes.data as Expense[]);
    };
    load();
  }, []);

  const todayTrx = useMemo(() => transactions.filter((t) => t.date === today && t.status === "lunas"), [transactions, today]);
  const todayTunai = todayTrx.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0);
  const todayQris = todayTrx.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0);
  const todayTotal = todayTunai + todayQris;
  const todayExpenses = useMemo(() => expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0), [expenses, today]);
  const todayProfit = todayTotal - todayExpenses;

  const allTotalIncome = transactions.filter((t) => t.status === "lunas").reduce((s, t) => s + t.total, 0);
  const allTotalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const allProfit = allTotalIncome - allTotalExpense;

  const paymentBreakdown = [
    { name: "Tunai", value: todayTunai, color: "#22c55e" },
    { name: "QRIS", value: todayQris, color: "#FBAA31" },
  ];

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTotal = transactions.filter((t) => t.date === dateStr && t.status === "lunas").reduce((s, t) => s + t.total, 0);
      days.push({ date: d.toLocaleDateString("id-ID", { weekday: "short" }), total: dayTotal });
    }
    return days;
  }, [transactions]);

  const currentTotal = period === "daily" ? todayTotal : allTotalIncome;
  const currentExpense = period === "daily" ? todayExpenses : allTotalExpense;
  const currentProfit = period === "daily" ? todayProfit : allProfit;

  const handleExport = async (format: "pdf" | "excel") => {
    setExporting(true);
    try {
      const lunasTrx = period === "daily"
        ? transactions.filter((t) => t.date === today && t.status === "lunas")
        : transactions.filter((t) => t.status === "lunas");
      const filteredExp = period === "daily"
        ? expenses.filter((e) => e.date === today)
        : expenses;
      const allTunai = lunasTrx.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0);
      const allQris = lunasTrx.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0);

      const exportData = {
        storeName: storeConfig?.name || "Cemil.in",
        period: period === "daily" ? "Harian" : period === "weekly" ? "Mingguan" : "Semua",
        dateRange: period === "daily" ? today : "Semua Waktu",
        summary: {
          total_pemasukan: currentTotal,
          total_pengeluaran: currentExpense,
          laba_rugi: currentProfit,
          total_transaksi: lunasTrx.length,
          tunai: allTunai,
          qris: allQris,
        },
        transactions: lunasTrx,
        expenses: filteredExp,
      };

      if (format === "pdf") exportToPDF(exportData);
      else exportToExcel(exportData);

      toast.success(`Berhasil ekspor ke ${format.toUpperCase()}!`);
    } catch {
      toast.error("Gagal mengekspor");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold">Laporan Penjualan</h1><p className="text-[#737373] mt-1">Rekap penjualan & laba rugi</p></div>
        <div className="flex gap-2 flex-wrap">
          {["daily", "weekly", "all"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${period === p ? "bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white shadow-lg" : "bg-white border border-[#e5e5e5] hover:border-[#FBAA31]"}`}>
              {p === "daily" ? "Hari Ini" : p === "weekly" ? "7 Hari" : "Semua"}
            </button>
          ))}
          <div className="flex gap-1 ml-2">
            <button onClick={() => handleExport("pdf")} disabled={exporting} className="px-4 py-2 bg-red-500 text-white font-medium rounded-xl flex items-center gap-2 text-sm hover:bg-red-600 transition-all disabled:opacity-50">
              <FileText className="w-4 h-4" />PDF
            </button>
            <button onClick={() => handleExport("excel")} disabled={exporting} className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl flex items-center gap-2 text-sm hover:bg-green-700 transition-all disabled:opacity-50">
              <FileSpreadsheet className="w-4 h-4" />Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#FBAA31] to-[#E87428] rounded-2xl p-5 text-white"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 opacity-80" /><span className="text-sm opacity-80">Total Pemasukan</span></div><p className="text-2xl font-bold">Rp {currentTotal.toLocaleString("id-ID")}</p></div>
        <div className="bg-white rounded-2xl p-5 border border-[#e5e5e5]"><div className="flex items-center gap-2 mb-2"><span className="text-sm text-[#737373]">💵 Tunai</span></div><p className="text-2xl font-bold text-green-600">Rp {todayTunai.toLocaleString("id-ID")}</p></div>
        <div className="bg-white rounded-2xl p-5 border border-[#e5e5e5]"><div className="flex items-center gap-2 mb-2"><span className="text-sm text-[#737373]">📱 QRIS</span></div><p className="text-2xl font-bold text-[#E87428]">Rp {todayQris.toLocaleString("id-ID")}</p></div>
        <div className={`rounded-2xl p-5 ${currentProfit >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-2 mb-2">{currentProfit >= 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-500" />}<span className="text-sm text-[#737373]">Laba/Rugi</span></div>
          <p className={`text-2xl font-bold ${currentProfit >= 0 ? "text-green-600" : "text-red-500"}`}>Rp {Math.abs(currentProfit).toLocaleString("id-ID")}</p>
          <p className="text-xs text-[#737373] mt-1">Pengeluaran: Rp {currentExpense.toLocaleString("id-ID")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
          <h3 className="font-bold text-lg mb-4">Penjualan 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" stroke="#999" style={{ fontSize: "12px" }} /><YAxis stroke="#999" style={{ fontSize: "12px" }} tickFormatter={(v) => v > 0 ? `${v / 1000}k` : "0"} /><Tooltip formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`} contentStyle={{ borderRadius: "12px" }} /><Bar dataKey="total" fill="#FBAA31" radius={[8, 8, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
          <h3 className="font-bold text-lg mb-4">Breakdown Tunai vs QRIS</h3>
          {todayTotal > 0 ? (
            <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={paymentBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{paymentBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`} /><Legend /></PieChart></ResponsiveContainer>
          ) : (<div className="h-[250px] flex items-center justify-center text-[#737373]"><p className="text-sm">Belum ada transaksi</p></div>)}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">📊 Perhitungan Laba Rugi</h3>
          <button onClick={() => handleExport("pdf")} className="px-3 py-1.5 bg-[#FBAA31]/10 text-[#E87428] rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-[#FBAA31]/20"><Download className="w-3.5 h-3.5" />Ekspor</button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between p-3 bg-green-50 rounded-xl"><span className="font-medium text-green-700">Total Pemasukan</span><span className="font-bold text-green-700">+ Rp {currentTotal.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between p-3 bg-red-50 rounded-xl"><span className="font-medium text-red-600">Total Pengeluaran</span><span className="font-bold text-red-600">- Rp {currentExpense.toLocaleString("id-ID")}</span></div>
          <div className={`flex justify-between p-4 rounded-xl font-bold text-lg ${currentProfit >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}><span>{currentProfit >= 0 ? "🟢 LABA" : "🔴 RUGI"}</span><span>Rp {Math.abs(currentProfit).toLocaleString("id-ID")}</span></div>
        </div>
      </div>
    </div>
  );
}
