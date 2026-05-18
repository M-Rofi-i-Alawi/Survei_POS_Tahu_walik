"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, ShoppingCart, Package, DollarSign, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { useUser } from "./layout";
import type { Product, Transaction } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [todayExpenses, setTodayExpenses] = useState(0);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      const [prodRes, trxRes, expRes] = await Promise.all([
        api.produk.list(),
        api.transaksi.list(),
        api.pengeluaran.list(),
      ]);
      if (prodRes.success) setProducts(prodRes.data as Product[]);
      if (trxRes.success) setTransactions(trxRes.data as Transaction[]);
      if (expRes.success) {
        const exps = expRes.data as { date: string; amount: number }[];
        setTodayExpenses(exps.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0));
      }
    };
    load();
  }, [today]);

  const todayTrx = useMemo(() => transactions.filter((t) => t.date === today && t.status === "lunas"), [transactions, today]);
  const todayTotal = todayTrx.reduce((s, t) => s + t.total, 0);
  const todayProfit = todayTotal - todayExpenses;
  const totalSold = todayTrx.reduce((s, t) => s + (t.items?.reduce((si, i) => si + i.quantity, 0) || 0), 0);

  const stokHabis = products.filter((p) => (p.stok_harian - p.stok_terjual) <= 0 && p.stok_harian > 0);
  const stokRendah = products.filter((p) => { const sisa = p.stok_harian - p.stok_terjual; return sisa > 0 && sisa <= 5 && p.stok_harian > 0; });

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayTotal = transactions.filter((t) => t.date === dateStr && t.status === "lunas").reduce((s, t) => s + t.total, 0);
      days.push({ day: d.toLocaleDateString("id-ID", { weekday: "short" }), sales: dayTotal });
    }
    return days;
  }, [transactions]);

  const recentTrx = todayTrx.slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-[#737373] mt-1">Selamat datang, {user?.name}! Berikut ringkasan hari ini.</p>
      </div>

      {stokHabis.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-500" /><span className="font-bold text-red-700">Stok Habis!</span></div>
          {stokHabis.map((p) => (<p key={p.id} className="text-sm text-red-600 ml-7">🎉 {p.name} — Jualan hari ini selesai!</p>))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-[#FBAA31] to-[#E87428] rounded-2xl p-6 text-white shadow-lg shadow-[#FBAA31]/20">
          <div className="flex items-start justify-between mb-4"><div className="p-3 bg-white/20 rounded-xl"><DollarSign className="w-6 h-6" /></div></div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Penjualan Hari Ini</h3>
          <p className="text-2xl font-bold">Rp {todayTotal.toLocaleString("id-ID")}</p>
          <p className="text-xs opacity-75 mt-2">{todayTrx.length} transaksi</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-sm">
          <div className="flex items-start justify-between mb-4"><div className="p-3 bg-[#FDE77A]/20 rounded-xl"><ShoppingCart className="w-6 h-6 text-[#E87428]" /></div></div>
          <h3 className="text-sm font-medium text-[#737373] mb-1">Terjual Hari Ini</h3>
          <p className="text-2xl font-bold">{totalSold} pcs</p>
          <p className="text-xs text-[#737373] mt-2">dari {products.length} produk</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-sm">
          <div className="flex items-start justify-between mb-4"><div className="p-3 bg-[#FDE77A]/20 rounded-xl"><Package className="w-6 h-6 text-[#E87428]" /></div></div>
          <h3 className="text-sm font-medium text-[#737373] mb-1">Total Produk</h3>
          <p className="text-2xl font-bold">{products.length}</p>
          <p className="text-xs text-[#737373] mt-2">{stokRendah.length} stok rendah</p>
        </div>

        <div className={`rounded-2xl p-6 border shadow-sm ${todayProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-start justify-between mb-4"><div className={`p-3 rounded-xl ${todayProfit >= 0 ? "bg-green-100" : "bg-red-100"}`}><TrendingUp className={`w-6 h-6 ${todayProfit >= 0 ? "text-green-600" : "text-red-500"}`} /></div></div>
          <h3 className="text-sm font-medium text-[#737373] mb-1">Laba Hari Ini</h3>
          <p className={`text-2xl font-bold ${todayProfit >= 0 ? "text-green-600" : "text-red-500"}`}>Rp {Math.abs(todayProfit).toLocaleString("id-ID")}</p>
          <p className="text-xs text-[#737373] mt-2">Pengeluaran: Rp {todayExpenses.toLocaleString("id-ID")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-sm">
          <h3 className="font-bold text-lg mb-4">Penjualan 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={last7Days}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBAA31" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FBAA31" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#999" style={{ fontSize: "12px" }} />
              <YAxis stroke="#999" style={{ fontSize: "12px" }} tickFormatter={(v) => v > 0 ? `${v / 1000}k` : "0"} />
              <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`} contentStyle={{ borderRadius: "12px" }} />
              <Area type="monotone" dataKey="sales" stroke="#FBAA31" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-sm">
          <h3 className="font-bold text-lg mb-4">Transaksi Terbaru</h3>
          <div className="space-y-3">
            {recentTrx.length === 0 ? (
              <p className="text-center text-[#737373] py-8 text-sm">Belum ada transaksi hari ini</p>
            ) : (
              recentTrx.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-[#e5e5e5]/30 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{t.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")}</p>
                    <p className="text-xs text-[#737373]">{t.method === "tunai" ? "💵 Tunai" : "📱 QRIS"} • {t.time}</p>
                  </div>
                  <p className="font-semibold text-sm text-[#E87428]">Rp {t.total.toLocaleString("id-ID")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
