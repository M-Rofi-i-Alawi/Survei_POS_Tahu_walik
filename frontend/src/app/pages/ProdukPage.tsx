import { useState, useRef } from "react";
import { Plus, Edit, Trash2, Search, X, Save, Upload, Image } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function ProdukPage() {
  const { products, addProduct, editProduct, deleteProduct } = useApp();
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

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const openAdd = () => {
    setEditId(null);
    setFormName("");
    setFormPrice("1000");
    setFormStok("30");
    setFormImage("🥟");
    setFormPhoto("");
    setShowModal(true);
  };

  const openEdit = (id: string) => {
    const p = products.find((pr) => pr.id === id);
    if (p) {
      setEditId(id);
      setFormName(p.name);
      setFormPrice(String(p.price));
      setFormStok(String(p.stokHarian));
      setFormImage(p.image);
      setFormPhoto(p.photoUrl || "");
      setShowModal(true);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    const price = Number(formPrice) || 0;
    const stok = Number(formStok) || 0;
    if (editId) {
      editProduct(editId, { name: formName, price, stokHarian: stok, image: formImage, photoUrl: formPhoto });
    } else {
      addProduct({ name: formName, price, stokHarian: stok, image: formImage, photoUrl: formPhoto });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => { deleteProduct(id); setShowDelete(null); };

  // Helper to render product image (photo or emoji fallback)
  const renderProductImage = (product: typeof products[0], size: "sm" | "lg") => {
    const sizeClass = size === "lg" ? "w-20 h-20" : "w-12 h-12";
    if (product.photoUrl) {
      return <img src={product.photoUrl} alt={product.name} className={`${sizeClass} rounded-xl object-cover`} />;
    }
    return <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-[#FDE77A]/30 to-[#FBAA31]/30 flex items-center justify-center ${size === "lg" ? "text-5xl" : "text-2xl"}`}>{product.image}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Produk</h1>
          <p className="text-muted-foreground mt-1">Tambah, edit, atau hapus produk</p>
        </div>
        <button onClick={openAdd} className="px-6 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg shadow-[#FBAA31]/20 flex items-center gap-2 transform hover:scale-[1.02] transition-all">
          <Plus className="w-5 h-5" />Tambah Produk
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const sisa = product.stokHarian - product.stokTerjual;
          return (
            <div key={product.id} className="bg-white rounded-2xl p-6 border border-border hover:shadow-lg transition-all">
              <div className="text-center mb-4">
                <div className="flex justify-center mb-3">{renderProductImage(product, "lg")}</div>
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-2xl font-bold text-[#E87428] mt-1">Rp {product.price.toLocaleString("id-ID")}</p>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stok Harian</span>
                  <span className="font-semibold">{product.stokHarian} pcs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terjual</span>
                  <span className="font-semibold text-[#E87428]">{product.stokTerjual} pcs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sisa</span>
                  <span className={`font-semibold ${sisa <= 0 ? "text-red-500" : sisa <= 5 ? "text-yellow-600" : "text-green-600"}`}>{sisa} pcs</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className={`h-2 rounded-full transition-all ${sisa <= 0 ? "bg-red-500" : sisa <= 5 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${product.stokHarian > 0 ? Math.min(100, (sisa / product.stokHarian) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(product.id)} className="flex-1 py-2 bg-[#FBAA31]/10 text-[#E87428] font-medium rounded-xl hover:bg-[#FBAA31]/20 transition-all flex items-center justify-center gap-1 text-sm"><Edit className="w-4 h-4" />Edit</button>
                <button onClick={() => setShowDelete(product.id)} className="py-2 px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-6xl mb-4">📦</p>
          <p className="text-lg font-medium">Belum ada produk</p>
          <p className="text-sm">Klik "Tambah Produk" untuk memulai</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editId ? "Edit Produk" : "Tambah Produk"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Foto Produk (opsional)</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                    {formPhoto ? (
                      <img src={formPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <button onClick={() => fileRef.current?.click()} className="w-full px-4 py-2 bg-[#FBAA31]/10 text-[#E87428] font-medium rounded-xl hover:bg-[#FBAA31]/20 transition-all flex items-center justify-center gap-2 text-sm">
                      <Upload className="w-4 h-4" />{formPhoto ? "Ganti Foto" : "Upload Foto"}
                    </button>
                    {formPhoto && (
                      <button onClick={() => setFormPhoto("")} className="w-full px-4 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-all">Hapus Foto</button>
                    )}
                  </div>
                </div>
                {!formPhoto && <p className="text-xs text-muted-foreground mt-2">Jika tidak upload foto, icon emoji di bawah akan dipakai</p>}
              </div>

              {/* Emoji fallback (only shown if no photo) */}
              {!formPhoto && (
                <div>
                  <label className="block text-sm font-medium mb-2">Icon Produk</label>
                  <div className="flex flex-wrap gap-2">
                    {["🥟", "🍜", "🍢", "🥡", "🍲", "🍛", "🌮", "🥙", "🧆", "🍘", "🍥", "🥘"].map((e) => (
                      <button key={e} onClick={() => setFormImage(e)} className={`w-10 h-10 text-xl rounded-xl border-2 flex items-center justify-center transition-all ${formImage === e ? "border-[#FBAA31] bg-[#FBAA31]/10 scale-110" : "border-border hover:border-[#FBAA31]/50"}`}>{e}</button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Nama Produk</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Tahu Walik Original" className="w-full px-4 py-3 bg-muted/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Harga (Rp)</label>
                <input type="text" inputMode="numeric" value={formPrice} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setFormPrice(v); }} placeholder="1000" className="w-full px-4 py-3 bg-muted/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stok Harian (pcs)</label>
                <input type="text" inputMode="numeric" value={formStok} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setFormStok(v); }} placeholder="30" className="w-full px-4 py-3 bg-muted/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
              </div>
            </div>
            <button onClick={handleSave} disabled={!formName.trim()} className="w-full mt-6 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />{editId ? "Simpan Perubahan" : "Tambah Produk"}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">Hapus Produk?</h3>
            <p className="text-muted-foreground mb-6">Produk yang dihapus tidak bisa dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/70 transition-all">Batal</button>
              <button onClick={() => handleDelete(showDelete)} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
