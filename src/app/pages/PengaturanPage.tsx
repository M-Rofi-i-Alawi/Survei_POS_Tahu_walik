import { useState, useRef } from "react";
import { Store, QrCode, Upload, Save, Check } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function PengaturanPage() {
  const { storeConfig, updateStore, qrisConfig, updateQris } = useApp();
  const [store, setStore] = useState(storeConfig);
  const [qris, setQris] = useState(qrisConfig);
  const [savedStore, setSavedStore] = useState(false);
  const [savedQris, setSavedQris] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveStore = () => {
    updateStore(store);
    setSavedStore(true);
    setTimeout(() => setSavedStore(false), 2000);
  };

  const handleSaveQris = () => {
    updateQris(qris);
    setSavedQris(true);
    setTimeout(() => setSavedQris(false), 2000);
  };

  const handleUploadQR = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setQris({ ...qris, imageData: data });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">Kelola pengaturan toko dan QRIS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Settings */}
        <div className="bg-white rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#FBAA31]/10 rounded-xl"><Store className="w-6 h-6 text-[#FBAA31]" /></div>
            <div><h3 className="font-bold text-lg">Informasi Toko</h3><p className="text-sm text-muted-foreground">Data toko Anda</p></div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Toko</label>
              <input type="text" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} className="w-full px-4 py-3 bg-muted/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pemilik</label>
              <input type="text" value={store.ownerName} onChange={(e) => setStore({ ...store, ownerName: e.target.value })} className="w-full px-4 py-3 bg-muted/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Alamat</label>
              <input type="text" value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} className="w-full px-4 py-3 bg-muted/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telepon</label>
              <input type="tel" value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} className="w-full px-4 py-3 bg-muted/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
            </div>
          </div>
          <button onClick={handleSaveStore} className="w-full mt-6 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            {savedStore ? <><Check className="w-5 h-5" />Tersimpan!</> : <><Save className="w-5 h-5" />Simpan</>}
          </button>
        </div>

        {/* QRIS Settings */}
        <div className="bg-white rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#FBAA31]/10 rounded-xl"><QrCode className="w-6 h-6 text-[#FBAA31]" /></div>
            <div><h3 className="font-bold text-lg">Kelola QRIS</h3><p className="text-sm text-muted-foreground">Upload gambar QR Code QRIS</p></div>
          </div>

          {/* QR Preview */}
          <div className="bg-muted/30 rounded-2xl p-6 mb-4 text-center">
            {qris.imageData ? (
              <img src={qris.imageData} alt="QRIS QR Code" className="w-48 h-48 mx-auto rounded-xl object-contain mb-3" />
            ) : (
              <div className="w-48 h-48 mx-auto bg-muted rounded-xl flex items-center justify-center mb-3">
                <div className="text-center"><QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">Belum ada QR Code</p></div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadQR} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="px-6 py-2 bg-[#FBAA31]/10 text-[#E87428] font-medium rounded-xl hover:bg-[#FBAA31]/20 transition-all flex items-center justify-center gap-2 mx-auto">
              <Upload className="w-4 h-4" />{qris.imageData ? "Ganti QR Code" : "Upload QR Code"}
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nama Akun QRIS</label>
            <input type="text" value={qris.accountName} onChange={(e) => setQris({ ...qris, accountName: e.target.value })} placeholder="Cemil.in - Ishaq" className="w-full px-4 py-3 bg-muted/50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
          </div>

          <button onClick={handleSaveQris} className="w-full py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            {savedQris ? <><Check className="w-5 h-5" />Tersimpan!</> : <><Save className="w-5 h-5" />Simpan QRIS</>}
          </button>
        </div>
      </div>
    </div>
  );
}
