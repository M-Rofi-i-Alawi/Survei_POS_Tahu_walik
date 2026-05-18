import { useState } from "react";
import { Search, Eye, Check, X, Trash2, Edit, User, Save } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function TransaksiPage() {
  const { transactions, confirmQris, editTransaction, deleteTransaction } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Full edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ buyerName: "", status: "" as "lunas" | "pending", method: "" as "tunai" | "qris" });

  const filtered = transactions.filter((t) => {
    const matchSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) || t.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase())) || (t.buyerName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchMethod = filterMethod === "all" || t.method === filterMethod;
    return matchSearch && matchStatus && matchMethod;
  });

  const detailTrx = detailId ? transactions.find((t) => t.id === detailId) : null;
  const todayStr = new Date().toISOString().slice(0, 10);

  const openEdit = (id: string) => {
    const trx = transactions.find((t) => t.id === id);
    if (trx) {
      setEditId(id);
      setEditForm({ buyerName: trx.buyerName || "", status: trx.status, method: trx.method });
    }
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    const trx = transactions.find((t) => t.id === editId);
    if (!trx) return;

    // Jika status berubah dari pending ke lunas = konfirmasi
    // Jika status berubah dari lunas ke pending = batalkan (untuk kasus seperti Rofi belum bayar)
    editTransaction(editId, {
      buyerName: editForm.buyerName || "Umum",
      status: editForm.status,
      method: editForm.method,
    });

    setEditId(null);
  };

  const handleDelete = () => {
    if (deleteId) { deleteTransaction(deleteId); setDeleteId(null); }
  };

  // Counts
  const totalTrx = transactions.length;
  const lunasCount = transactions.filter((t) => t.status === "lunas").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const totalIncome = transactions.filter((t) => t.status === "lunas").reduce((s, t) => s + t.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
        <p className="text-muted-foreground mt-1">Lihat, edit, atau hapus transaksi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Total Transaksi</p>
          <p className="text-2xl font-bold">{totalTrx}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Lunas</p>
          <p className="text-2xl font-bold text-green-600">{lunasCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Pending QRIS</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-gradient-to-br from-[#FBAA31] to-[#E87428] rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80">Total Pemasukan (Lunas)</p>
          <p className="text-2xl font-bold">Rp {totalIncome.toLocaleString("id-ID")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Cari ID, produk, atau nama pembeli..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 bg-white border border-border rounded-xl">
          <option value="all">Semua Status</option>
          <option value="lunas">Lunas</option>
          <option value="pending">Pending</option>
        </select>
        <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="px-4 py-3 bg-white border border-border rounded-xl">
          <option value="all">Semua Metode</option>
          <option value="tunai">Tunai</option>
          <option value="qris">QRIS</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Pembeli</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Metode</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className={`hover:bg-muted/30 transition-colors ${t.status === "pending" ? "bg-yellow-50/30" : ""}`}>
                  <td className="px-4 py-3"><span className="font-mono font-semibold text-xs">{t.id.slice(0, 10)}</span></td>
                  <td className="px-4 py-3"><p className="font-medium text-sm">{t.date}</p><p className="text-xs text-muted-foreground">{t.time}</p></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{t.buyerName || "Umum"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{t.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${t.method === "tunai" ? "bg-green-50 text-green-600" : "bg-[#FBAA31]/10 text-[#E87428]"}`}>{t.method === "tunai" ? "💵 Tunai" : "📱 QRIS"}</span></td>
                  <td className="px-4 py-3 font-semibold text-sm text-[#E87428]">Rp {t.total.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${t.status === "lunas" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>{t.status === "lunas" ? "✅ Lunas" : "⏳ Pending"}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailId(t.id)} className="p-1.5 hover:bg-[#FBAA31]/10 rounded-lg transition-colors" title="Detail"><Eye className="w-4 h-4 text-[#FBAA31]" /></button>
                      {t.status === "pending" && (
                        <button onClick={() => confirmQris(t.id)} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="Konfirmasi Lunas"><Check className="w-4 h-4 text-green-600" /></button>
                      )}
                      <button onClick={() => openEdit(t.id)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Transaksi"><Edit className="w-4 h-4 text-blue-500" /></button>
                      {t.date === todayStr && (
                        <button onClick={() => setDeleteId(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Transaksi"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground"><p className="text-4xl mb-2">📋</p><p>Belum ada transaksi</p></div>
        )}
      </div>

      {/* Detail Modal */}
      {detailTrx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailId(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Detail Transaksi</h3>
              <button onClick={() => setDetailId(null)} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">ID</span><span className="font-mono font-medium">{detailTrx.id.slice(0, 12)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tanggal</span><span>{detailTrx.date} {detailTrx.time}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pembeli</span><span className="font-medium">{detailTrx.buyerName || "Umum"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Metode</span><span className="font-medium">{detailTrx.method === "tunai" ? "💵 Tunai" : "📱 QRIS"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><span className={`font-medium ${detailTrx.status === "lunas" ? "text-green-600" : "text-yellow-600"}`}>{detailTrx.status === "lunas" ? "✅ Lunas" : "⏳ Pending"}</span></div>
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <p className="font-semibold text-sm mb-2">Item:</p>
              {detailTrx.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-muted/30 rounded-lg">
                  <span>{item.quantity}x {item.productName}</span>
                  <span className="font-medium">Rp {item.subtotal.toLocaleString("id-ID")}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-[#E87428]">Rp {detailTrx.total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditId(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Edit Transaksi</h3>
              <button onClick={() => setEditId(null)} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Info Transaksi */}
            <div className="bg-muted/30 rounded-xl p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-1">ID: {editId.slice(0, 12)}</p>
              <p className="text-sm font-medium">
                {transactions.find((t) => t.id === editId)?.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
              </p>
              <p className="text-lg font-bold text-[#E87428] mt-1">
                Rp {transactions.find((t) => t.id === editId)?.total.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="space-y-4">
              {/* Nama Pembeli */}
              <div>
                <label className="block text-sm font-medium mb-2">Nama Pembeli</label>
                <input type="text" value={editForm.buyerName} onChange={(e) => setEditForm({ ...editForm, buyerName: e.target.value })} placeholder="Nama pembeli" className="w-full px-4 py-3 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setEditForm({ ...editForm, status: "lunas" })} className={`py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${editForm.status === "lunas" ? "bg-green-500 text-white shadow-lg" : "bg-muted hover:bg-green-50 text-muted-foreground"}`}>
                    <Check className="w-4 h-4" />Lunas
                  </button>
                  <button onClick={() => setEditForm({ ...editForm, status: "pending" })} className={`py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${editForm.status === "pending" ? "bg-yellow-500 text-white shadow-lg" : "bg-muted hover:bg-yellow-50 text-muted-foreground"}`}>
                    ⏳ Pending
                  </button>
                </div>
                {editForm.status === "pending" && (
                  <p className="text-xs text-yellow-600 mt-2">⚠️ Status pending = uang belum masuk, tidak dihitung di Laporan Pemasukan</p>
                )}
              </div>

              {/* Metode */}
              <div>
                <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setEditForm({ ...editForm, method: "tunai" })} className={`py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${editForm.method === "tunai" ? "bg-green-500 text-white shadow-lg" : "bg-muted hover:bg-green-50 text-muted-foreground"}`}>
                    💵 Tunai
                  </button>
                  <button onClick={() => setEditForm({ ...editForm, method: "qris" })} className={`py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${editForm.method === "qris" ? "bg-[#FBAA31] text-white shadow-lg" : "bg-muted hover:bg-[#FBAA31]/10 text-muted-foreground"}`}>
                    📱 QRIS
                  </button>
                </div>
              </div>
            </div>

            <button onClick={handleSaveEdit} className="w-full mt-6 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-5xl mb-4">⚠️</p>
            <h3 className="text-xl font-bold mb-2">Hapus Transaksi?</h3>
            <p className="text-sm text-muted-foreground mb-1">Transaksi ini akan dihapus dan <strong>stok akan dikembalikan</strong>.</p>
            <p className="text-sm text-muted-foreground mb-1">Laporan pemasukan akan berkurang sesuai total transaksi.</p>
            <p className="text-xs text-red-500 mt-2 mb-4">⚠️ Tindakan ini tidak bisa dibatalkan!</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/70 transition-all">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
