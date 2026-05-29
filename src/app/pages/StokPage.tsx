import { useState } from "react";
import { RefreshCw, AlertTriangle, Check } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function StokPage() {
  const { products, setDailyStock, resetDailyStock } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showSuccess, setShowSuccess] = useState("");

  const handleSetStok = (productId: string) => {
    setDailyStock(productId, Number(editValue) || 0);
    setEditingId(null);
    setShowSuccess(productId);
    setTimeout(() => setShowSuccess(""), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stok Harian</h1>
        <p className="text-muted-foreground mt-1">Set stok jualan hari ini untuk setiap produk. Stok berkurang otomatis setiap ada transaksi.</p>
      </div>

      {/* Info Banner */}
      <div className="bg-[#FBAA31]/10 border border-[#FBAA31]/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 bg-[#FBAA31]/20 rounded-lg mt-0.5"><AlertTriangle className="w-4 h-4 text-[#E87428]" /></div>
        <div>
          <p className="font-medium text-sm text-[#E87428]">Cara Kerja Stok Harian</p>
          <p className="text-xs text-muted-foreground mt-1">Setiap pagi, set jumlah stok yang akan dijual hari ini. Stok akan berkurang otomatis setiap kali ada transaksi berhasil. Ketika stok habis, notifikasi akan muncul otomatis.</p>
        </div>
      </div>

      {/* Products Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const sisa = product.stokHarian - product.stokTerjual;
          const percentage = product.stokHarian > 0 ? (sisa / product.stokHarian) * 100 : 0;
          const isEditing = editingId === product.id;

          return (
            <div key={product.id} className={`bg-white rounded-2xl p-6 border transition-all ${sisa <= 0 && product.stokHarian > 0 ? "border-red-200 bg-red-50/30" : "border-border"}`}>
              <div className="flex items-center gap-3 mb-4">
                {product.photoUrl ? (
                  <img src={product.photoUrl} alt={product.name} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="text-4xl">{product.image}</div>
                )}
                <div>
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-sm text-[#E87428] font-semibold">Rp {product.price.toLocaleString("id-ID")}/pcs</p>
                </div>
                {showSuccess === product.id && (
                  <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium"><Check className="w-3 h-3" />Tersimpan</div>
                )}
              </div>

              {/* Stock Progress */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stok Hari Ini</span>
                  <span className="font-bold">{product.stokHarian} pcs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terjual</span>
                  <span className="font-bold text-[#E87428]">{product.stokTerjual} pcs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sisa</span>
                  <span className={`font-bold ${sisa <= 0 ? "text-red-500" : sisa <= 5 ? "text-yellow-600" : "text-green-600"}`}>{sisa} pcs</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${sisa <= 0 ? "bg-red-500" : sisa <= 5 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
                </div>
                {sisa <= 0 && product.stokHarian > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-600">Stok Habis! Jualan hari ini selesai 🎉</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isEditing ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Set Stok Baru (pcs)</label>
                  <div className="flex gap-2">
                    <input type="text" inputMode="numeric" value={editValue} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setEditValue(v); }} className="flex-1 px-4 py-2 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" autoFocus placeholder="0" />
                    <button onClick={() => handleSetStok(product.id)} className="px-4 py-2 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-medium rounded-xl hover:shadow-lg transition-all"><Check className="w-5 h-5" /></button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-muted rounded-xl hover:bg-muted/70 transition-all">Batal</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(product.id); setEditValue(String(product.stokHarian)); }} className="flex-1 py-2 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-medium rounded-xl hover:shadow-lg transition-all text-sm">Set Stok Hari Ini</button>
                  <button onClick={() => resetDailyStock(product.id)} className="py-2 px-3 bg-muted rounded-xl hover:bg-muted/70 transition-all" title="Reset Terjual"><RefreshCw className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-6xl mb-4">📦</p>
          <p className="text-lg font-medium">Belum ada produk</p>
          <p className="text-sm">Tambahkan produk terlebih dahulu di menu Produk</p>
        </div>
      )}
    </div>
  );
}
