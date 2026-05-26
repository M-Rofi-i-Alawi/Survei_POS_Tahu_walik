"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, ShoppingCart, Package, Receipt, Warehouse,
  BarChart3, UserCog, Settings, X, LogOut, Wallet, Menu,
  Bell, AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import type { AppUser, Notification, StoreConfig } from "@/lib/types";

// ============ USER CONTEXT ============
interface UserContextType {
  user: AppUser | null;
  storeConfig: StoreConfig | null;
  notifications: Notification[];
  refreshNotifications: () => void;
  refreshConfig: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  storeConfig: null,
  notifications: [],
  refreshNotifications: () => {},
  refreshConfig: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

// ============ DASHBOARD LAYOUT ============
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch current user with localStorage fallback
  useEffect(() => {
    const fetchUser = async () => {
      const res = await api.auth.me();
      if (res.success) {
        setUser(res.data as AppUser);
        // Keep localStorage in sync
        try { localStorage.setItem("pos_user", JSON.stringify(res.data)); } catch {}
      } else {
        // Cookie lost — try to restore from localStorage
        try {
          const stored = localStorage.getItem("pos_user");
          if (stored) {
            const parsed = JSON.parse(stored) as AppUser;
            const restoreRes = await api.auth.restore(parsed.id);
            if (restoreRes.success) {
              setUser(restoreRes.data as AppUser);
              setLoading(false);
              return;
            }
          }
        } catch {}
        // Both failed — go to login
        localStorage.removeItem("pos_user");
        router.push("/");
      }
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  // Fetch config
  const refreshConfig = useCallback(async () => {
    const res = await api.config.get();
    if (res.success) {
      const d = res.data as { store: StoreConfig };
      setStoreConfig(d.store);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    const res = await api.notifikasi.list();
    if (res.success) setNotifications(res.data as Notification[]);
  }, []);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const handleLogout = async () => {
    await api.auth.logout();
    try { localStorage.removeItem("pos_user"); } catch {}
    router.push("/");
  };

  const handleMarkRead = async (id: string) => {
    await api.notifikasi.markRead(id);
    refreshNotifications();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F5F7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FBAA31] to-[#E87428] flex items-center justify-center animate-pulse">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-[#737373]">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isOwner = user.role === "owner";
  const unreadCount = notifications.filter((n) => !n.read).length;

  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", show: true },
    { path: "/dashboard/kasir", icon: ShoppingCart, label: "Kasir", show: true },
    { path: "/dashboard/produk", icon: Package, label: "Produk", show: true },
    { path: "/dashboard/stok", icon: Warehouse, label: "Stok Harian", show: true },
    { path: "/dashboard/transaksi", icon: Receipt, label: "Transaksi", show: true },
    { path: "/dashboard/pengeluaran", icon: Wallet, label: "Pengeluaran", show: isOwner },
    { path: "/dashboard/laporan", icon: BarChart3, label: "Laporan", show: isOwner },
    { path: "/dashboard/pengguna", icon: UserCog, label: "Pengguna", show: !isOwner },
    { path: "/dashboard/pengaturan", icon: Settings, label: "Pengaturan", show: true },
  ].filter((item) => item.show);

  return (
    <UserContext.Provider value={{ user, storeConfig, notifications, refreshNotifications, refreshConfig }}>
      <div className="flex h-screen bg-[#F5F5F7]">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0B0E11] text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FBAA31] to-[#E87428] flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Cemil.in</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-3 border-b border-white/10">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isOwner ? "bg-[#FBAA31]/20 text-[#FBAA31]" : "bg-purple-500/20 text-purple-400"}`}>
              {isOwner ? "👑 Owner" : "🔧 Admin"}
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 ${isActive ? "bg-[#FBAA31] text-white shadow-lg shadow-[#FBAA31]/20" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FBAA31] to-[#E87428] flex items-center justify-center">
                <span className="font-bold text-sm">{user.name?.charAt(0) || "?"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
              <LogOut className="w-4 h-4" />Keluar
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navbar */}
          <header className="h-16 bg-white border-b border-[#e5e5e5] flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#e5e5e5] rounded-lg lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-bold text-lg">{storeConfig?.name || "Cemil.in"}</h2>
                <p className="text-xs text-[#737373]">Pos Tahu Walik</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stok Habis Alert */}
              {notifications.filter((n) => n.type === "stok_habis" && !n.read).length > 0 && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-600">
                    {notifications.find((n) => n.type === "stok_habis" && !n.read)?.message}
                  </span>
                </div>
              )}

              {/* Notification Bell */}
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 hover:bg-[#e5e5e5] rounded-lg relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#e5e5e5] overflow-hidden z-50 animate-scaleIn">
                    <div className="p-4 border-b border-[#e5e5e5] bg-[#e5e5e5]/30">
                      <h3 className="font-bold text-sm">Notifikasi</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-sm text-[#737373]">Tidak ada notifikasi</p>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleMarkRead(notif.id)}
                            className={`w-full text-left p-4 border-b border-[#e5e5e5]/50 hover:bg-[#e5e5e5]/30 transition-colors ${!notif.read ? "bg-[#FBAA31]/5" : ""}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-lg ${notif.type === "stok_habis" ? "bg-red-50" : "bg-[#FBAA31]/10"}`}>
                                <AlertTriangle className={`w-3.5 h-3.5 ${notif.type === "stok_habis" ? "text-red-500" : "text-[#FBAA31]"}`} />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{notif.message}</p>
                                <p className="text-xs text-[#737373] mt-1">
                                  {new Date(notif.timestamp).toLocaleString("id-ID")}
                                </p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-[#FBAA31] ml-auto mt-1.5 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </UserContext.Provider>
  );
}
