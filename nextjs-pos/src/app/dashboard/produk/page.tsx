"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Search, X, Save, Upload, Image, Package } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStok, setFormStok] = useState("");
  const [formImage, setFormImage] = useState("🥟");
  const [formPhoto, setFormPhoto] = useState("");
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await api.produk.list();
    if (res.success) setProducts(res.data as Product[]);
  };
  useEffect(() => { load(); }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdd = () => {
    setEditId(null);
    setFormName(""); setFormPrice("1000"); setFormStok("30");
    setFormImage("🥟"); setFormPhoto("");
    setShowModal(true);
  };

  const openEdit = (id: string) => {
    const p = products.find((pr) => pr.id === id);
    if (p) {
      setEditId(id);
      setFormName(p.name); setFormPrice(String(p.price));
      setFormStok(String(p.stok_harian)); setFormImage(p.image);
      setFormPhoto(p.photo_url || "");
      setShowModal(true);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    const data = {
      name: formName, price: Number(formPrice) || 0,
      stok_harian: Number(formStok) || 0, image: formImage, photo_url: formPhoto
    };
    if (editId) { await api.produk.update(editId, data); toast.success("Produk diupdate!"); }
    else { await api.produk.create(data); toast.success("Produk ditambahkan!"); }
    setShowModal(false); load();
  };

  const handleDelete = async (id: string) => {
    await api.produk.delete(id);
    setShowDelete(null);
    toast.success("Produk dihapus!");
    load();
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produk</h1>
          <p className="text-sm text-[#737373] mt-0.5">Kelola menu & stok harian</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-2xl shadow-md active:scale-95 transition-all text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30 focus:border-[#FBAA31]"
        />
      </div>

      {/* Stats bar */}
      {products.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex-shrink-0 bg-white border border-[#e5e5e5] rounded-2xl px-4 py-3 flex items-center gap-2.5 min-w-[120px]">
            <div className="w-8 h-8 rounded-xl bg-[#FBAA31]/15 flex items-center justify-center">
              <Package className="w-4 h-4 text-[#E87428]" />
            </div>
            <div>
              <p className="text-xs text-[#737373]">Total Produk</p>
              <p className="text-base font-bold">{products.length}</p>
            </div>
          </div>
          <div className="flex-shrink-0 bg-white border border-[#e5e5e5] rounded-2xl px-4 py-3 flex items-center gap-2.5 min-w-[120px]">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
              <span className="text-base">✅</span>
            </div>
            <div>
              <p className="text-xs text-[#737373]">Ada Stok</p>
              <p className="text-base font-bold text-green-600">
                {products.filter(p => (p.stok_harian - p.stok_terjual) > 0).length}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 bg-white border border-[#e5e5e5] rounded-2xl px-4 py-3 flex items-center gap-2.5 min-w-[120px]">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <span className="text-base">🔴</span>
            </div>
            <div>
              <p className="text-xs text-[#737373]">Habis</p>
              <p className="text-base font-bold text-red-500">
                {products.filter(p => (p.stok_harian - p.stok_terjual) <= 0).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product List — single column on mobile, 2-col on md+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProducts.map((product) => {
          const sisa = product.stok_harian - product.stok_terjual;
          const pct = product.stok_harian > 0 ? Math.min(100, (sisa / product.stok_harian) * 100) : 0;
          const statusColor = sisa <= 0 ? "text-red-500" : sisa <= 5 ? "text-yellow-600" : "text-green-600";
          const barColor = sisa <= 0 ? "bg-red-400" : sisa <= 5 ? "bg-yellow-400" : "bg-green-400";
          const badge = sisa <= 0
            ? { label: "Habis", cls: "bg-red-50 text-red-500 border border-red-100" }
            : sisa <= 5
            ? { label: "Hampir Habis", cls: "bg-yellow-50 text-yellow-600 border border-yellow-100" }
            : { label: "Tersedia", cls: "bg-green-50 text-green-600 border border-green-100" };

          return (
            <div key={product.id} className="bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden active:scale-[0.99] transition-all">
              {/* Top: image + info */}
              <div className="flex items-center gap-3 p-4">
                {/* Image */}
                <div className="flex-shrink-0">
                  {product.photo_url
                    ? <img src={product.photo_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
                    : <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FDE77A]/40 to-[#FBAA31]/30 flex items-center justify-center text-3xl">{product.image}</div>
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[15px] leading-tight truncate">{product.name}</h3>
                    <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[#E87428] mt-0.5">
                    Rp {product.price.toLocaleString("id-ID")}
                    <span className="text-xs font-normal text-[#a3a3a3]">/pcs</span>
                  </p>
                </div>
              </div>

              {/* Stok section */}
              <div className="px-4 pb-3">
                <div className="bg-[#fafafa] rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#737373]">Stok harian</span>
                    <span className="font-semibold">{product.stok_harian} pcs</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#737373]">Terjual</span>
                    <span className="font-semibold text-[#E87428]">{product.stok_terjual} pcs</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#737373]">Sisa</span>
                    <span className={`font-bold ${statusColor}`}>{sisa} pcs</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#e5e5e5] rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-[#f0f0f0]">
                <button
                  onClick={() => openEdit(product.id)}
                  className="flex-1 py-3 flex items-center justify-center gap-1.5 text-[#E87428] text-sm font-semibold hover:bg-[#FBAA31]/8 active:bg-[#FBAA31]/15 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <div className="w-px bg-[#f0f0f0]" />
                <button
                  onClick={() => setShowDelete(product.id)}
                  className="py-3 px-5 flex items-center justify-center text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-[#a3a3a3]">
          <div className="text-6xl mb-3">📦</div>
          <p className="text-base font-semibold text-[#525252]">Belum ada produk</p>
          <p className="text-sm mt-1">Tap "Tambah" untuk mulai menambahkan produk</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Handle bar (mobile) */}
            <div className="w-10 h-1 bg-[#e5e5e5] rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editId ? "Edit Produk" : "Tambah Produk"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#f5f5f5] rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Foto Produk <span className="text-[#a3a3a3] font-normal">(opsional)</span></label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#e5e5e5] flex items-center justify-center overflow-hidden bg-[#fafafa] flex-shrink-0">
                    {formPhoto
                      ? <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                      : <Image className="w-7 h-7 text-[#c5c5c5]" />
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full px-4 py-2.5 bg-[#FBAA31]/10 text-[#E87428] font-medium rounded-xl flex items-center justify-center gap-2 text-sm active:bg-[#FBAA31]/20"
                    >
                      <Upload className="w-4 h-4" />
                      {formPhoto ? "Ganti Foto" : "Upload Foto"}
                    </button>
                    {formPhoto && (
                      <button onClick={() => setFormPhoto("")} className="w-full py-1.5 text-xs text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Emoji picker */}
              {!formPhoto && (
                <div>
                  <label className="block text-sm font-medium mb-2">Icon Produk</label>
                  <div className="flex flex-wrap gap-2">
                    {["🥟","🍜","🍢","🥡","🍲","🍛","🌮","🥙","🧆","🍘","🍥","🥘"].map((e) => (
                      <button
                        key={e}
                        onClick={() => setFormImage(e)}
                        className={`w-11 h-11 text-2xl rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 ${
                          formImage === e ? "border-[#FBAA31] bg-[#FBAA31]/10 scale-110" : "border-[#e5e5e5] hover:border-[#FBAA31]/50"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Produk</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Tahu Walik Original"
                  className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30 focus:bg-white border border-transparent focus:border-[#FBAA31]/40"
                />
              </div>

              {/* Price & Stok — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Harga (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30 focus:bg-white border border-transparent focus:border-[#FBAA31]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stok Harian</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formStok}
                    onChange={(e) => setFormStok(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30 focus:bg-white border border-transparent focus:border-[#FBAA31]/40"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!formName.trim()}
              className="w-full mt-5 py-3.5 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-bold rounded-2xl shadow-lg disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Save className="w-5 h-5" />
              {editId ? "Simpan Perubahan" : "Tambah Produk"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-sm shadow-2xl text-center">
            <div className="w-10 h-1 bg-[#e5e5e5] rounded-full mx-auto mb-5 sm:hidden" />
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Hapus Produk?</h3>
            <p className="text-sm text-[#737373] mb-6">
              <span className="font-medium text-[#404040]">
                {products.find(p => p.id === showDelete)?.name}
              </span>
              {" "}akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(null)}
                className="flex-1 py-3.5 bg-[#f5f5f5] font-semibold rounded-2xl text-sm active:bg-[#e5e5e5]"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(showDelete)}
                className="flex-1 py-3.5 bg-red-500 text-white font-semibold rounded-2xl text-sm active:bg-red-600"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}