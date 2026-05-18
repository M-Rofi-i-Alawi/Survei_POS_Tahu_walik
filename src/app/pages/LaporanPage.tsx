import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Calendar, Download } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useApp } from "../context/AppContext";

export default function LaporanPage() {
  const { transactions, expenses } = useApp();
  const [period, setPeriod] = useState("daily");

  const today = new Date().toISOString().slice(0, 10);

  const todayTrx = useMemo(() => transactions.filter((t) => t.date === today && t.status === "lunas"), [transactions, today]);
  const todayTunai = todayTrx.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0);
  const todayQris = todayTrx.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0);
  const todayTotal = todayTunai + todayQris;
  const todayExpenses = useMemo(() => expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0), [expenses, today]);
  const todayProfit = todayTotal - todayExpenses;

  const allTotalIncome = transactions.filter((t) => t.status === "lunas").reduce((s, t) => s + t.total, 0);
  const allTotalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const allProfit = allTotalIncome - allTotalExpense;

  // Chart data: Tunai vs QRIS breakdown
  const paymentBreakdown = [
    { name: "Tunai", value: todayTunai, color: "#22c55e" },
    { name: "QRIS", value: todayQris, color: "#FBAA31" },
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
        <div className="flex gap-2">
          {["daily", "weekly", "all"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${period === p ? "bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white shadow-lg" : "bg-white border border-border hover:border-[#FBAA31]"}`}>
              {p === "daily" ? "Hari Ini" : p === "weekly" ? "7 Hari" : "Semua"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#FBAA31] to-[#E87428] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 opacity-80" /><span className="text-sm opacity-80">Total Pemasukan</span></div>
          <p className="text-2xl font-bold">Rp {(period === "daily" ? todayTotal : allTotalIncome).toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm text-muted-foreground">💵 Tunai</span></div>
          <p className="text-2xl font-bold text-green-600">Rp {todayTunai.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm text-muted-foreground">📱 QRIS</span></div>
          <p className="text-2xl font-bold text-[#E87428]">Rp {todayQris.toLocaleString("id-ID")}</p>
        </div>
        <div className={`rounded-2xl p-5 ${(period === "daily" ? todayProfit : allProfit) >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-2 mb-2">
            {(period === "daily" ? todayProfit : allProfit) >= 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            <span className="text-sm text-muted-foreground">Laba/Rugi</span>
          </div>
          <p className={`text-2xl font-bold ${(period === "daily" ? todayProfit : allProfit) >= 0 ? "text-green-600" : "text-red-500"}`}>
            Rp {Math.abs(period === "daily" ? todayProfit : allProfit).toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Pengeluaran: Rp {(period === "daily" ? todayExpenses : allTotalExpense).toLocaleString("id-ID")}</p>
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
          <h3 className="font-bold text-lg mb-4">Breakdown Tunai vs QRIS (Hari Ini)</h3>
          {todayTotal > 0 ? (
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
              <p className="text-sm">Belum ada transaksi hari ini</p>
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
            <span className="font-bold text-green-700">+ Rp {(period === "daily" ? todayTotal : allTotalIncome).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between p-3 bg-red-50 rounded-xl">
            <span className="font-medium text-red-600">Total Pengeluaran</span>
            <span className="font-bold text-red-600">- Rp {(period === "daily" ? todayExpenses : allTotalExpense).toLocaleString("id-ID")}</span>
          </div>
          <div className={`flex justify-between p-4 rounded-xl font-bold text-lg ${(period === "daily" ? todayProfit : allProfit) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            <span>{(period === "daily" ? todayProfit : allProfit) >= 0 ? "🟢 LABA" : "🔴 RUGI"}</span>
            <span>Rp {Math.abs(period === "daily" ? todayProfit : allProfit).toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
