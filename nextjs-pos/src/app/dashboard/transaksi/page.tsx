"use client";
import { useState, useEffect } from "react";
import { Search, Eye, Check, X, Trash2, Edit, User, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Transaction } from "@/lib/types";

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ buyerName: "", status: "" as "lunas" | "pending", method: "" as "tunai" | "qris" });

  const load = async () => { const res = await api.transaksi.list(); if (res.success) setTransactions(res.data as Transaction[]); };
  useEffect(() => { load(); }, []);

  const filtered = transactions.filter((t) => {
    const matchSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) || t.items?.some((i) => i.product_name.toLowerCase().includes(searchQuery.toLowerCase())) || (t.buyer_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchMethod = filterMethod === "all" || t.method === filterMethod;
    return matchSearch && matchStatus && matchMethod;
  });

  const detailTrx = detailId ? transactions.find((t) => t.id === detailId) : null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalTrx = transactions.length;
  const lunasCount = transactions.filter((t) => t.status === "lunas").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const totalIncome = transactions.filter((t) => t.status === "lunas").reduce((s, t) => s + t.total, 0);

  const openEdit = (id: string) => { const trx = transactions.find((t) => t.id === id); if (trx) { setEditId(id); setEditForm({ buyerName: trx.buyer_name || "", status: trx.status, method: trx.method }); } };
  const handleSaveEdit = async () => { if (!editId) return; await api.transaksi.update(editId, { buyer_name: editForm.buyerName || "Umum", status: editForm.status, method: editForm.method }); setEditId(null); toast.success("Transaksi diupdate!"); load(); };
  const handleDelete = async () => { if (deleteId) { await api.transaksi.delete(deleteId); setDeleteId(null); toast.success("Transaksi dihapus, stok dikembalikan!"); load(); } };
  const handleConfirmQris = async (id: string) => { await api.transaksi.update(id, { status: "lunas" }); toast.success("QRIS dikonfirmasi!"); load(); };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold">Riwayat Transaksi</h1><p className="text-[#737373] mt-1">Lihat, edit, atau hapus transaksi</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#e5e5e5]"><p className="text-xs text-[#737373]">Total Transaksi</p><p className="text-2xl font-bold">{totalTrx}</p></div>
        <div className="bg-white rounded-2xl p-4 border border-[#e5e5e5]"><p className="text-xs text-[#737373]">Lunas</p><p className="text-2xl font-bold text-green-600">{lunasCount}</p></div>
        <div className="bg-white rounded-2xl p-4 border border-[#e5e5e5]"><p className="text-xs text-[#737373]">Pending QRIS</p><p className="text-2xl font-bold text-yellow-600">{pendingCount}</p></div>
        <div className="bg-gradient-to-br from-[#FBAA31] to-[#E87428] rounded-2xl p-4 text-white"><p className="text-xs opacity-80">Total Pemasukan</p><p className="text-2xl font-bold">Rp {totalIncome.toLocaleString("id-ID")}</p></div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" /><input type="text" placeholder="Cari ID, produk, atau nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/20" /></div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl"><option value="all">Semua Status</option><option value="lunas">Lunas</option><option value="pending">Pending</option></select>
        <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl"><option value="all">Semua Metode</option><option value="tunai">Tunai</option><option value="qris">QRIS</option></select>
      </div>
      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-[#e5e5e5]/50"><tr><th className="px-4 py-3 text-left text-sm font-semibold">ID</th><th className="px-4 py-3 text-left text-sm font-semibold">Tanggal</th><th className="px-4 py-3 text-left text-sm font-semibold">Pembeli</th><th className="px-4 py-3 text-left text-sm font-semibold">Item</th><th className="px-4 py-3 text-left text-sm font-semibold">Metode</th><th className="px-4 py-3 text-left text-sm font-semibold">Total</th><th className="px-4 py-3 text-left text-sm font-semibold">Status</th><th className="px-4 py-3 text-left text-sm font-semibold">Aksi</th></tr></thead>
          <tbody className="divide-y divide-[#e5e5e5]">{filtered.map((t) => (
            <tr key={t.id} className={`hover:bg-[#e5e5e5]/30 transition-colors ${t.status === "pending" ? "bg-yellow-50/30" : ""}`}>
              <td className="px-4 py-3"><span className="font-mono font-semibold text-xs">{t.id.slice(0, 8)}</span></td>
              <td className="px-4 py-3"><p className="font-medium text-sm">{t.date}</p><p className="text-xs text-[#737373]">{t.time}</p></td>
              <td className="px-4 py-3"><div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#737373]" /><span className="text-sm font-medium">{t.buyer_name || "Umum"}</span></div></td>
              <td className="px-4 py-3 text-sm text-[#737373] max-w-[200px] truncate">{t.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")}</td>
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${t.method === "tunai" ? "bg-green-50 text-green-600" : "bg-[#FBAA31]/10 text-[#E87428]"}`}>{t.method === "tunai" ? "💵 Tunai" : "📱 QRIS"}</span></td>
              <td className="px-4 py-3 font-semibold text-sm text-[#E87428]">Rp {t.total.toLocaleString("id-ID")}</td>
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${t.status === "lunas" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>{t.status === "lunas" ? "✅ Lunas" : "⏳ Pending"}</span></td>
              <td className="px-4 py-3"><div className="flex items-center gap-1">
                <button onClick={() => setDetailId(t.id)} className="p-1.5 hover:bg-[#FBAA31]/10 rounded-lg" title="Detail"><Eye className="w-4 h-4 text-[#FBAA31]" /></button>
                {t.status === "pending" && <button onClick={() => handleConfirmQris(t.id)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Konfirmasi"><Check className="w-4 h-4 text-green-600" /></button>}
                <button onClick={() => openEdit(t.id)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Edit"><Edit className="w-4 h-4 text-blue-500" /></button>
                {t.date === todayStr && <button onClick={() => setDeleteId(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4 text-red-500" /></button>}
              </div></td>
            </tr>
          ))}</tbody></table></div>
        {filtered.length === 0 && <div className="text-center py-12 text-[#737373]"><p className="text-4xl mb-2">📋</p><p>Belum ada transaksi</p></div>}
      </div>

      {detailTrx && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailId(null)}><div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold">Detail Transaksi</h3><button onClick={() => setDetailId(null)} className="p-2 hover:bg-[#e5e5e5] rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm"><span className="text-[#737373]">ID</span><span className="font-mono font-medium">{detailTrx.id.slice(0, 12)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#737373]">Tanggal</span><span>{detailTrx.date} {detailTrx.time}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#737373]">Pembeli</span><span className="font-medium">{detailTrx.buyer_name || "Umum"}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#737373]">Status</span><span className={`font-medium ${detailTrx.status === "lunas" ? "text-green-600" : "text-yellow-600"}`}>{detailTrx.status === "lunas" ? "✅ Lunas" : "⏳ Pending"}</span></div>
        </div>
        <div className="border-t pt-4 space-y-2"><p className="font-semibold text-sm mb-2">Item:</p>
          {detailTrx.items?.map((item, i) => <div key={i} className="flex justify-between text-sm p-2 bg-[#e5e5e5]/30 rounded-lg"><span>{item.quantity}x {item.product_name}</span><span className="font-medium">Rp {item.subtotal.toLocaleString("id-ID")}</span></div>)}
          <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span className="text-[#E87428]">Rp {detailTrx.total.toLocaleString("id-ID")}</span></div>
        </div>
      </div></div>)}

      {editId && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditId(null)}><div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
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
      </div></div>)}

      {deleteId && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteId(null)}><div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <p className="text-5xl mb-4">⚠️</p><h3 className="text-xl font-bold mb-2">Hapus Transaksi?</h3>
        <p className="text-sm text-[#737373] mb-1">Transaksi akan dihapus dan <strong>stok dikembalikan</strong>.</p>
        <p className="text-xs text-red-500 mt-2 mb-4">⚠️ Tidak bisa dibatalkan!</p>
        <div className="flex gap-3"><button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-[#e5e5e5] font-semibold rounded-xl">Batal</button><button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl">Hapus</button></div>
      </div></div>)}
    </div>
  );
}
