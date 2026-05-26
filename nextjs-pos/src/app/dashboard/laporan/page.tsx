"use client";
import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Download, FileText, FileSpreadsheet, Trash2, Edit, Save, X, Check, Eye, User } from "lucide-react";
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
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ buyerName: "", status: "" as "lunas" | "pending", method: "" as "tunai" | "qris" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    const [trxRes, expRes] = await Promise.all([api.transaksi.list(), api.pengeluaran.list()]);
    if (trxRes.success) setTransactions(trxRes.data as Transaction[]);
    if (expRes.success) setExpenses(expRes.data as Expense[]);
  };

  useEffect(() => { load(); }, []);

  // Filter transactions based on period
  const filteredTrx = useMemo(() => {
    if (period === "daily") return transactions.filter((t) => t.date === today);
    if (period === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);
      return transactions.filter((t) => t.date >= weekAgoStr);
    }
    return transactions;
  }, [transactions, period, today]);

  const lunasTrx = useMemo(() => filteredTrx.filter((t) => t.status === "lunas"), [filteredTrx]);
  const todayTunai = lunasTrx.filter((t) => t.method === "tunai").reduce((s, t) => s + t.total, 0);
  const todayQris = lunasTrx.filter((t) => t.method === "qris").reduce((s, t) => s + t.total, 0);
  const currentTotal = todayTunai + todayQris;

  const filteredExpenses = useMemo(() => {
    if (period === "daily") return expenses.filter((e) => e.date === today);
    if (period === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);
      return expenses.filter((e) => e.date >= weekAgoStr);
    }
    return expenses;
  }, [expenses, period, today]);

  const currentExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const currentProfit = currentTotal - currentExpense;

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

  const handleExport = async (format: "pdf" | "excel") => {
    setExporting(true);
    try {
      const exportData = {
        storeName: storeConfig?.name || "Cemil.in",
        period: period === "daily" ? "Harian" : period === "weekly" ? "Mingguan" : "Semua",
        dateRange: period === "daily" ? today : "Semua Waktu",
        summary: {
          total_pemasukan: currentTotal,
          total_pengeluaran: currentExpense,
          laba_rugi: currentProfit,
          total_transaksi: lunasTrx.length,
          tunai: todayTunai,
          qris: todayQris,
        },
        transactions: lunasTrx,
        expenses: filteredExpenses,
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

  // Edit transaction
  const openEdit = (id: string) => {
    const trx = transactions.find((t) => t.id === id);
    if (trx) {
      setEditId(id);
      setEditForm({ buyerName: trx.buyer_name || "", status: trx.status, method: trx.method });
    }
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    const res = await api.transaksi.update(editId, {
      buyer_name: editForm.buyerName || "Umum",
      status: editForm.status,
      method: editForm.method,
    });
    if (res.success) {
      setEditId(null);
      toast.success("Transaksi berhasil diupdate!");
      load();
    } else {
      toast.error("Gagal mengupdate transaksi");
    }
  };

  // Delete transaction
  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await api.transaksi.delete(deleteId);
    if (res.success) {
      setDeleteId(null);
      toast.success("Transaksi dihapus, stok dikembalikan!");
      load();
    } else {
      toast.error("Gagal menghapus transaksi");
    }
  };

  const detailTrx = detailId ? transactions.find((t) => t.id === detailId) : null;

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
          {currentTotal > 0 ? (
            <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={paymentBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{paymentBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`} /><Legend /></PieChart></ResponsiveContainer>
          ) : (<div className="h-[250px] flex items-center justify-center text-[#737373]"><p className="text-sm">Belum ada transaksi</p></div>)}
        </div>
      </div>

      {/* Daftar Transaksi - Editable */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#e5e5e5] bg-[#e5e5e5]/30">
          <h3 className="font-bold text-lg">📋 Detail Transaksi ({filteredTrx.length})</h3>
          <p className="text-xs text-[#737373]">Klik edit/hapus untuk mengelola data laporan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#e5e5e5]/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Pembeli</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Metode</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {filteredTrx.map((t) => (
                <tr key={t.id} className={`hover:bg-[#e5e5e5]/30 transition-colors ${t.status === "pending" ? "bg-yellow-50/30" : ""}`}>
                  <td className="px-4 py-3"><p className="font-medium text-sm">{t.date}</p><p className="text-xs text-[#737373]">{t.time}</p></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#737373]" /><span className="text-sm font-medium">{t.buyer_name || "Umum"}</span></div></td>
                  <td className="px-4 py-3 text-sm text-[#737373] max-w-[200px] truncate">{t.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${t.method === "tunai" ? "bg-green-50 text-green-600" : "bg-[#FBAA31]/10 text-[#E87428]"}`}>{t.method === "tunai" ? "💵 Tunai" : "📱 QRIS"}</span></td>
                  <td className="px-4 py-3 font-semibold text-sm text-[#E87428]">Rp {t.total.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${t.status === "lunas" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>{t.status === "lunas" ? "✅ Lunas" : "⏳ Pending"}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailId(t.id)} className="p-1.5 hover:bg-[#FBAA31]/10 rounded-lg" title="Detail"><Eye className="w-4 h-4 text-[#FBAA31]" /></button>
                      <button onClick={() => openEdit(t.id)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Edit"><Edit className="w-4 h-4 text-blue-500" /></button>
                      <button onClick={() => setDeleteId(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTrx.length === 0 && <div className="text-center py-12 text-[#737373]"><p className="text-4xl mb-2">📋</p><p>Belum ada transaksi</p></div>}
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

      {/* Modal Detail */}
      {detailTrx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailId(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold">Detail Transaksi</h3><button onClick={() => setDetailId(null)} className="p-2 hover:bg-[#e5e5e5] rounded-lg"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm"><span className="text-[#737373]">ID</span><span className="font-mono font-medium">{detailTrx.id.slice(0, 12)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#737373]">Tanggal</span><span>{detailTrx.date} {detailTrx.time}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#737373]">Pembeli</span><span className="font-medium">{detailTrx.buyer_name || "Umum"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#737373]">Metode</span><span className="font-medium">{detailTrx.method === "tunai" ? "💵 Tunai" : "📱 QRIS"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#737373]">Status</span><span className={`font-medium ${detailTrx.status === "lunas" ? "text-green-600" : "text-yellow-600"}`}>{detailTrx.status === "lunas" ? "✅ Lunas" : "⏳ Pending"}</span></div>
            </div>
            <div className="border-t pt-4 space-y-2"><p className="font-semibold text-sm mb-2">Item:</p>
              {detailTrx.items?.map((item, i) => <div key={i} className="flex justify-between text-sm p-2 bg-[#e5e5e5]/30 rounded-lg"><span>{item.quantity}x {item.product_name}</span><span className="font-medium">Rp {item.subtotal.toLocaleString("id-ID")}</span></div>)}
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span className="text-[#E87428]">Rp {detailTrx.total.toLocaleString("id-ID")}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditId(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold">Edit Transaksi</h3><button onClick={() => setEditId(null)} className="p-2 hover:bg-[#e5e5e5] rounded-lg"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Nama Pembeli</label><input type="text" value={editForm.buyerName} onChange={(e) => setEditForm({ ...editForm, buyerName: e.target.value })} className="w-full px-4 py-3 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" /></div>
              <div><label className="block text-sm font-medium mb-2">Status</label><div className="grid grid-cols-2 gap-2">
                <button onClick={() => setEditForm({ ...editForm, status: "lunas" })} className={`py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 ${editForm.status === "lunas" ? "bg-green-500 text-white shadow-lg" : "bg-[#e5e5e5]"}`}><Check className="w-4 h-4" />Lunas</button>
                <button onClick={() => setEditForm({ ...editForm, status: "pending" })} className={`py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 ${editForm.status === "pending" ? "bg-yellow-500 text-white shadow-lg" : "bg-[#e5e5e5]"}`}>⏳ Pending</button>
              </div></div>
              <div><label className="block text-sm font-medium mb-2">Metode</label><div className="grid grid-cols-2 gap-2">
                <button onClick={() => setEditForm({ ...editForm, method: "tunai" })} className={`py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 ${editForm.method === "tunai" ? "bg-green-500 text-white shadow-lg" : "bg-[#e5e5e5]"}`}>💵 Tunai</button>
                <button onClick={() => setEditForm({ ...editForm, method: "qris" })} className={`py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 ${editForm.method === "qris" ? "bg-[#FBAA31] text-white shadow-lg" : "bg-[#e5e5e5]"}`}>📱 QRIS</button>
              </div></div>
            </div>
            <button onClick={handleSaveEdit} className="w-full mt-6 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2"><Save className="w-5 h-5" />Simpan</button>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <p className="text-5xl mb-4">⚠️</p>
            <h3 className="text-xl font-bold mb-2">Hapus dari Laporan?</h3>
            <p className="text-sm text-[#737373] mb-1">Transaksi ini akan dihapus dari laporan dan <strong>stok dikembalikan</strong>.</p>
            <p className="text-sm text-[#737373] mb-1">Total laporan akan otomatis terupdate.</p>
            <p className="text-xs text-red-500 mt-2 mb-4">⚠️ Tidak bisa dibatalkan!</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-[#e5e5e5] font-semibold rounded-xl">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
