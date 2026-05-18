"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Expense } from "@/lib/types";

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ description: "", amount: 0, date: new Date().toISOString().slice(0, 10) });
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const load = async () => { const res = await api.pengeluaran.list(); if (res.success) setExpenses(res.data as Expense[]); };
  useEffect(() => { load(); }, []);

  const filtered = expenses.filter((e) => e.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = async () => {
    if (!form.description.trim() || form.amount <= 0) return;
    await api.pengeluaran.create(form);
    setForm({ description: "", amount: 0, date: new Date().toISOString().slice(0, 10) });
    setShowAdd(false); toast.success("Pengeluaran ditambahkan!"); load();
  };

  const handleDelete = async (id: string) => { await api.pengeluaran.delete(id); setShowDelete(null); toast.success("Pengeluaran dihapus!"); load(); };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold">Pengeluaran</h1><p className="text-[#737373] mt-1">Catat semua pengeluaran untuk hitung laba rugi</p></div>
        <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg flex items-center gap-2 hover:scale-[1.02] transition-all"><Plus className="w-5 h-5" />Tambah Pengeluaran</button>
      </div>
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3"><div className="p-3 bg-white/20 rounded-xl"><Wallet className="w-6 h-6" /></div><div><p className="text-sm opacity-80">Total Pengeluaran</p><p className="text-3xl font-bold">Rp {totalExpenses.toLocaleString("id-ID")}</p></div></div>
      </div>
      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" /><input type="text" placeholder="Cari pengeluaran..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/20" /></div>
      <div className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-[#e5e5e5]/50"><tr><th className="px-6 py-4 text-left text-sm font-semibold">Tanggal</th><th className="px-6 py-4 text-left text-sm font-semibold">Keterangan</th><th className="px-6 py-4 text-left text-sm font-semibold">Jumlah</th><th className="px-6 py-4 text-left text-sm font-semibold">Aksi</th></tr></thead>
          <tbody className="divide-y divide-[#e5e5e5]">{filtered.map((exp) => (
            <tr key={exp.id} className="hover:bg-[#e5e5e5]/30 transition-colors"><td className="px-6 py-4 text-sm">{exp.date}</td><td className="px-6 py-4 font-medium">{exp.description}</td><td className="px-6 py-4 font-semibold text-red-500">- Rp {exp.amount.toLocaleString("id-ID")}</td><td className="px-6 py-4"><button onClick={() => setShowDelete(exp.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button></td></tr>
          ))}</tbody></table></div>
        {filtered.length === 0 && <div className="text-center py-12 text-[#737373]"><p className="text-4xl mb-2">💰</p><p>Belum ada pengeluaran</p></div>}
      </div>

      {showAdd && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleIn">
        <h3 className="text-xl font-bold mb-6">Tambah Pengeluaran</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-2">Tanggal</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" /></div>
          <div><label className="block text-sm font-medium mb-2">Keterangan</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Beli bahan baku tahu..." className="w-full px-4 py-3 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" /></div>
          <div><label className="block text-sm font-medium mb-2">Jumlah (Rp)</label><input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="50000" className="w-full px-4 py-3 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" /></div>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-[#e5e5e5] font-semibold rounded-xl">Batal</button><button onClick={handleAdd} disabled={!form.description.trim() || form.amount <= 0} className="flex-1 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl disabled:opacity-50">Simpan</button></div>
      </div></div>)}

      {showDelete && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-scaleIn">
        <p className="text-5xl mb-4">⚠️</p><h3 className="text-xl font-bold mb-2">Hapus Pengeluaran?</h3>
        <div className="flex gap-3 mt-6"><button onClick={() => setShowDelete(null)} className="flex-1 py-3 bg-[#e5e5e5] font-semibold rounded-xl">Batal</button><button onClick={() => handleDelete(showDelete)} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl">Hapus</button></div>
      </div></div>)}
    </div>
  );
}
