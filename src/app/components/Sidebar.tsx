import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Warehouse,
  BarChart3,
  UserCog,
  Settings,
  X,
  LogOut,
  Wallet,
} from "lucide-react";
import { useApp } from "../context/AppContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();

  const isOwner = currentUser?.role === "owner";

  // Menu items based on role
  const menuItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", show: true },
    { path: "/dashboard/kasir", icon: ShoppingCart, label: "Kasir", show: true },
    { path: "/dashboard/produk", icon: Package, label: "Produk", show: true },
    { path: "/dashboard/stok", icon: Warehouse, label: "Stok Harian", show: true },
    { path: "/dashboard/transaksi", icon: Receipt, label: "Transaksi", show: true },
    { path: "/dashboard/pengeluaran", icon: Wallet, label: "Pengeluaran", show: isOwner },
    { path: "/dashboard/laporan", icon: BarChart3, label: "Laporan", show: isOwner },
    { path: "/dashboard/pengguna", icon: UserCog, label: "Pengguna", show: true },
    { path: "/dashboard/pengaturan", icon: Settings, label: "Pengaturan", show: true },
  ].filter((item) => item.show);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0B0E11] text-white flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Cemil.in" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold text-lg">Cemil.in</span>
          </div>
          <button onClick={onToggle} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-6 py-3 border-b border-white/10">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isOwner
              ? "bg-[#FBAA31]/20 text-[#FBAA31]"
              : "bg-purple-500/20 text-purple-400"
          }`}>
            {isOwner ? "👑 Owner" : "🔧 Admin"}
          </span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 ${
                  isActive
                    ? "bg-[#FBAA31] text-white shadow-lg shadow-[#FBAA31]/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Info */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FBAA31] to-[#E87428] flex items-center justify-center">
              <span className="font-bold text-sm">
                {currentUser?.name?.charAt(0) || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {currentUser?.name || "Guest"}
              </p>
              <p className="text-xs text-white/50 truncate">
                {currentUser?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
