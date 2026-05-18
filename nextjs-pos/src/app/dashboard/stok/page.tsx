"use client";
import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showSuccess, setShowSuccess] = useState("");

  const load = async () => { const res = await api.produk.list(); if (res.success) setProducts(res.data as Product[]); };
  useEffect(() => { load(); }, []);

  const handleSetStok = async (productId: string) => {
    await api.produk.patch(productId, { action: "set_stok_harian", stok_harian: Number(editValue) || 0 });
    setEditingId(null); setShowSuccess(productId); toast.success("Stok diupdate!");
    setTimeout(() => setShowSuccess(""), 2000); load();
  };

  const handleReset = async (productId: string) => {
    await api.produk.patch(productId, { action: "reset_stok" });
    toast.success("Stok terjual direset!"); load();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold">Stok Harian</h1><p className="text-[#737373] mt-1">Set stok jualan hari ini untuk setiap produk.</p></div>
      <div className="bg-[#FBAA31]/10 border border-[#FBAA31]/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 bg-[#FBAA31]/20 rounded-lg mt-0.5"><AlertTriangle className="w-4 h-4 text-[#E87428]" /></div>
        <div><p className="font-medium text-sm text-[#E87428]">Cara Kerja Stok Harian</p><p className="text-xs text-[#737373] mt-1">Setiap pagi, set jumlah stok yang akan dijual hari ini. Stok akan berkurang otomatis setiap kali ada transaksi berhasil.</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const sisa = product.stok_harian - product.stok_terjual;
          const percentage = product.stok_harian > 0 ? (sisa / product.stok_harian) * 100 : 0;
          const isEditing = editingId === product.id;
          return (
            <div key={product.id} className={`bg-white rounded-2xl p-6 border transition-all ${sisa <= 0 && product.stok_harian > 0 ? "border-red-200 bg-red-50/30" : "border-[#e5e5e5]"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{product.image}</div>
                <div><h3 className="font-bold">{product.name}</h3><p className="text-sm text-[#E87428] font-semibold">Rp {product.price.toLocaleString("id-ID")}/pcs</p></div>
                {showSuccess === product.id && <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium"><Check className="w-3 h-3" />Tersimpan</div>}
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm"><span className="text-[#737373]">Stok Hari Ini</span><span className="font-bold">{product.stok_harian} pcs</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#737373]">Terjual</span><span className="font-bold text-[#E87428]">{product.stok_terjual} pcs</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#737373]">Sisa</span><span className={`font-bold ${sisa <= 0 ? "text-red-500" : sisa <= 5 ? "text-yellow-600" : "text-green-600"}`}>{sisa} pcs</span></div>
                <div className="w-full bg-[#e5e5e5] rounded-full h-3"><div className={`h-3 rounded-full transition-all ${sisa <= 0 ? "bg-red-500" : sisa <= 5 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} /></div>
                {sisa <= 0 && product.stok_harian > 0 && <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs font-semibold text-red-600">Stok Habis! 🎉</span></div>}
              </div>
              {isEditing ? (
                <div className="space-y-2"><label className="block text-sm font-medium">Set Stok Baru (pcs)</label>
                  <div className="flex gap-2"><input type="text" inputMode="numeric" value={editValue} onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ""))} className="flex-1 px-4 py-2 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" autoFocus placeholder="0" />
                    <button onClick={() => handleSetStok(product.id)} className="px-4 py-2 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-medium rounded-xl"><Check className="w-5 h-5" /></button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-[#e5e5e5] rounded-xl">Batal</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(product.id); setEditValue(String(product.stok_harian)); }} className="flex-1 py-2 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-medium rounded-xl text-sm">Set Stok Hari Ini</button>
                  <button onClick={() => handleReset(product.id)} className="py-2 px-3 bg-[#e5e5e5] rounded-xl" title="Reset Terjual"><RefreshCw className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {products.length === 0 && <div className="text-center py-16 text-[#737373]"><p className="text-6xl mb-4">📦</p><p>Belum ada produk</p></div>}
    </div>
  );
}
