import { useState } from "react";
import { RefreshCw, AlertTriangle, Check, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function StokPage() {
  const { products, setDailyStock, resetDailyStock } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showSuccess, setShowSuccess] = useState("");

  const editingProduct = products.find((p) => p.id === editingId);

  const handleSetStok = () => {
    if (!editingId) return;
    setDailyStock(editingId, Number(editValue) || 0);
    setEditingId(null);
    setShowSuccess(editingId);
    setTimeout(() => setShowSuccess(""), 2000);
  };

  const openEdit = (productId: string, currentStok: number) => {
    setEditValue(String(currentStok));
    setEditingId(productId);
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stok Harian</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Set stok jualan hari ini untuk setiap produk. Stok berkurang otomatis setiap ada transaksi.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-[#FBAA31]/10 border border-[#FBAA31]/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 bg-[#FBAA31]/20 rounded-lg mt-0.5 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-[#E87428]" />
        </div>
        <div>
          <p className="font-semibold text-sm text-[#E87428]">Cara Kerja Stok Harian</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Setiap pagi, set jumlah stok yang akan dijual hari ini. Stok akan berkurang otomatis
            setiap kali ada transaksi berhasil. Ketika stok habis, notifikasi akan muncul otomatis.
          </p>
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((product) => {
          const sisa = product.stokHarian - product.stokTerjual;
          const percentage = product.stokHarian > 0 ? (sisa / product.stokHarian) * 100 : 0;
          const isHabis = sisa <= 0 && product.stokHarian > 0;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                isHabis ? "border-red-200 bg-red-50/20" : "border-[#e5e5e5]"
              }`}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 p-4 pb-3">
                {product.photoUrl ? (
                  <img src={product.photoUrl} alt={product.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FDE77A]/40 to-[#FBAA31]/30 flex items-center justify-center text-3xl flex-shrink-0">
                    {product.image}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[15px] truncate">{product.name}</h3>
                  <p className="text-sm text-[#E87428] font-semibold">
                    Rp {product.price.toLocaleString("id-ID")}/pcs
                  </p>
                </div>
                {showSuccess === product.id && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium flex-shrink-0">
                    <Check className="w-3 h-3" />Tersimpan
                  </div>
                )}
              </div>

              {/* Stok info */}
              <div className="px-4 pb-3">
                <div className="bg-[#fafafa] rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Stok Hari Ini</span>
                    <span className="font-bold">{product.stokHarian} pcs</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Terjual</span>
                    <span className="font-bold text-[#E87428]">{product.stokTerjual} pcs</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Sisa</span>
                    <span className={`font-bold ${sisa <= 0 ? "text-red-500" : sisa <= 5 ? "text-yellow-600" : "text-green-600"}`}>
                      {sisa} pcs
                    </span>
                  </div>
                  <div className="w-full bg-[#e5e5e5] rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        sisa <= 0 ? "bg-red-400" : sisa <= 5 ? "bg-yellow-400" : "bg-green-400"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                    />
                  </div>
                </div>

                {isHabis && (
                  <div className="flex items-center gap-2 mt-2 p-2.5 bg-red-50 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-red-500">Stok Habis! Jualan hari ini selesai 🎉</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex border-t border-[#f0f0f0]">
                <button
                  onClick={() => openEdit(product.id, product.stokHarian)}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#FBAA31] to-[#E87428] active:opacity-90 transition-all"
                >
                  Set Stok Hari Ini
                </button>
                <div className="w-px bg-[#f0f0f0]" />
                <button
                  onClick={() => resetDailyStock(product.id)}
                  className="py-3 px-4 text-muted-foreground hover:bg-[#f5f5f5] active:bg-[#eeeeee] transition-colors"
                  title="Reset Terjual"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-6xl mb-3">📦</p>
          <p className="text-base font-semibold text-[#525252]">Belum ada produk</p>
          <p className="text-sm mt-1">Tambahkan produk terlebih dahulu di menu Produk</p>
        </div>
      )}

      {/* ─── Bottom Sheet Modal ─── */}
      {editingId && editingProduct && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setEditingId(null)}
          />

          {/* Sheet — sits above keyboard via padding-bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl p-6"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[#e5e5e5] rounded-full mx-auto mb-5" />

            {/* Product info */}
            <div className="flex items-center gap-3 mb-5">
              {editingProduct.photoUrl ? (
                <img src={editingProduct.photoUrl} alt={editingProduct.name} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FDE77A]/40 to-[#FBAA31]/30 flex items-center justify-center text-2xl">
                  {editingProduct.image}
                </div>
              )}
              <div>
                <p className="font-bold">{editingProduct.name}</p>
                <p className="text-xs text-muted-foreground">
                  Stok saat ini: <span className="font-semibold text-[#E87428]">{editingProduct.stokHarian} pcs</span>
                </p>
              </div>
              <button
                onClick={() => setEditingId(null)}
                className="ml-auto p-2 hover:bg-[#f5f5f5] rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Input */}
            <label className="block text-sm font-medium mb-2">Jumlah Stok Baru (pcs)</label>
            <input
              type="text"
              inputMode="numeric"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full px-4 py-3.5 bg-[#f5f5f5] rounded-2xl text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/40 focus:bg-white border border-transparent focus:border-[#FBAA31]/40 mb-4"
              autoFocus
              placeholder="0"
            />

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 py-3.5 bg-[#f5f5f5] font-semibold rounded-2xl text-sm active:bg-[#e5e5e5] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSetStok}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 active:opacity-90 transition-all shadow-md"
              >
                <Check className="w-5 h-5" />
                Simpan
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}