import { createBrowserRouter } from "react-router";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import DashboardPage from "./pages/DashboardPage";
import KasirPage from "./pages/KasirPage";
import ProdukPage from "./pages/ProdukPage";
import TransaksiPage from "./pages/TransaksiPage";
import StokPage from "./pages/StokPage";
import PengeluaranPage from "./pages/PengeluaranPage";
import LaporanPage from "./pages/LaporanPage";
import PenggunaPage from "./pages/PenggunaPage";
import PengaturanPage from "./pages/PengaturanPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: LoginPage },
    ],
  },
  {
    // Hidden admin login route
    path: "/admin-login",
    Component: AuthLayout,
    children: [
      { index: true, Component: AdminLoginPage },
    ],
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "kasir", Component: KasirPage },
      { path: "produk", Component: ProdukPage },
      { path: "transaksi", Component: TransaksiPage },
      { path: "stok", Component: StokPage },
      { path: "pengeluaran", Component: PengeluaranPage },
      { path: "laporan", Component: LaporanPage },
      { path: "pengguna", Component: PenggunaPage },
      { path: "pengaturan", Component: PengaturanPage },
    ],
  },
]);
