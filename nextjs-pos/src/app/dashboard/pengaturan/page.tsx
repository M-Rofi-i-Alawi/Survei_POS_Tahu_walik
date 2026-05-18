"use client";
import { useState, useEffect, useRef } from "react";
import { Store, QrCode, Upload, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useUser } from "../layout";
import type { StoreConfig, QrisConfig } from "@/lib/types";

export default function PengaturanPage() {
  const { refreshConfig } = useUser();
  const [store, setStore] = useState<StoreConfig>({ name: "", address: "", phone: "", owner_name: "" });
  const [qris, setQris] = useState<QrisConfig>({ image_data: "", account_name: "" });
  const [savedStore, setSavedStore] = useState(false);
  const [savedQris, setSavedQris] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const res = await api.config.get();
      if (res.success) {
        const d = res.data as { store: StoreConfig; qris: QrisConfig };
        if (d.store) setStore(d.store);
        if (d.qris) setQris(d.qris);
      }
    };
    load();
  }, []);

  const handleSaveStore = async () => {
    await api.config.update({ store }); setSavedStore(true); refreshConfig();
    toast.success("Info toko tersimpan!"); setTimeout(() => setSavedStore(false), 2000);
  };

  const handleSaveQris = async () => {
    await api.config.update({ qris }); setSavedQris(true); refreshConfig();
    toast.success("QRIS tersimpan!"); setTimeout(() => setSavedQris(false), 2000);
  };

  const handleUploadQR = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setQris({ ...qris, image_data: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div><h1 className="text-3xl font-bold">Pengaturan</h1><p className="text-[#737373] mt-1">Kelola pengaturan toko dan QRIS</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-[#FBAA31]/10 rounded-xl"><Store className="w-6 h-6 text-[#FBAA31]" /></div><div><h3 className="font-bold text-lg">Informasi Toko</h3><p className="text-sm text-[#737373]">Data toko Anda</p></div></div>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-2">Nama Toko</label><input type="text" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} className="w-full px-4 py-3 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" /></div>
            <div><label className="block text-sm font-medium mb-2">Pemilik</label><input type="text" value={store.owner_name} onChange={(e) => setStore({ ...store, owner_name: e.target.value })} className="w-full px-4 py-3 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" /></div>
            <div><label className="block text-sm font-medium mb-2">Alamat</label><input type="text" value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} className="w-full px-4 py-3 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" /></div>
            <div><label className="block text-sm font-medium mb-2">Telepon</label><input type="tel" value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} className="w-full px-4 py-3 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" /></div>
          </div>
          <button onClick={handleSaveStore} className="w-full mt-6 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            {savedStore ? <><Check className="w-5 h-5" />Tersimpan!</> : <><Save className="w-5 h-5" />Simpan</>}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5]">
          <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-[#FBAA31]/10 rounded-xl"><QrCode className="w-6 h-6 text-[#FBAA31]" /></div><div><h3 className="font-bold text-lg">Kelola QRIS</h3><p className="text-sm text-[#737373]">Upload gambar QR Code QRIS</p></div></div>
          <div className="bg-[#e5e5e5]/30 rounded-2xl p-6 mb-4 text-center">
            {qris.image_data ? <img src={qris.image_data} alt="QRIS" className="w-48 h-48 mx-auto rounded-xl object-contain mb-3" /> : <div className="w-48 h-48 mx-auto bg-[#e5e5e5] rounded-xl flex items-center justify-center mb-3"><div className="text-center"><QrCode className="w-12 h-12 text-[#737373] mx-auto mb-2" /><p className="text-xs text-[#737373]">Belum ada QR Code</p></div></div>}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadQR} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="px-6 py-2 bg-[#FBAA31]/10 text-[#E87428] font-medium rounded-xl hover:bg-[#FBAA31]/20 flex items-center justify-center gap-2 mx-auto"><Upload className="w-4 h-4" />{qris.image_data ? "Ganti QR" : "Upload QR"}</button>
          </div>
          <div className="mb-4"><label className="block text-sm font-medium mb-2">Nama Akun QRIS</label><input type="text" value={qris.account_name} onChange={(e) => setQris({ ...qris, account_name: e.target.value })} className="w-full px-4 py-3 bg-[#e5e5e5]/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" /></div>
          <button onClick={handleSaveQris} className="w-full py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            {savedQris ? <><Check className="w-5 h-5" />Tersimpan!</> : <><Save className="w-5 h-5" />Simpan QRIS</>}
          </button>
        </div>
      </div>
    </div>
  );
}
