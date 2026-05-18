import { useState } from "react";
import { Plus, Trash2, Search, Wallet } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function PengeluaranPage() {
  const { expenses, addExpense, deleteExpense } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ description: "", amount: 0, date: new Date().toISOString().slice(0, 10) });
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const filtered = expenses.filter((e) => e.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    if (!form.description.trim() || form.amount <= 0) return;
    addExpense(form.description, form.amount, form.date);
    setForm({ description: "", amount: 0, date: new Date().toISOString().slice(0, 10) });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pengeluaran</h1>
          <p className="text-muted-foreground mt-1">Catat semua pengeluaran untuk hitung laba rugi</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg flex items-center gap-2 transform hover:scale-[1.02] transition-all">
          <Plus className="w-5 h-5" />Tambah Pengeluaran
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl"><Wallet className="w-6 h-6" /></div>
          <div>
            <p className="text-sm opacity-80">Total Pengeluaran</p>
            <p className="text-3xl font-bold">Rp {totalExpenses.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="Cari pengeluaran..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Keterangan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Jumlah</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm">{exp.date}</td>
                  <td className="px-6 py-4 font-medium">{exp.description}</td>
                  <td className="px-6 py-4 font-semibold text-red-500">- Rp {exp.amount.toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setShowDelete(exp.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground"><p className="text-4xl mb-2">💰</p><p>Belum ada pengeluaran</p></div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Tambah Pengeluaran</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tanggal</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Keterangan</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Beli bahan baku tahu..." className="w-full px-4 py-3 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Jumlah (Rp)</label>
                <input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="50000" className="w-full px-4 py-3 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/70 transition-all">Batal</button>
              <button onClick={handleAdd} disabled={!form.description.trim() || form.amount <= 0} className="flex-1 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <p className="text-5xl mb-4">⚠️</p>
            <h3 className="text-xl font-bold mb-2">Hapus Pengeluaran?</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDelete(null)} className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-xl">Batal</button>
              <button onClick={() => { deleteExpense(showDelete); setShowDelete(null); }} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
