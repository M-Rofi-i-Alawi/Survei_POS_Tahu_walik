import type { ApiResponse } from "@/lib/types";

const BASE = "";

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

// ============ AUTH ============
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    adminLogin: (email: string, password: string) =>
      request("/api/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request("/api/auth/logout", { method: "POST" }),
    me: () => request("/api/auth/me"),
  },

  // ============ PRODUK ============
  produk: {
    list: () => request("/api/produk"),
    get: (id: string) => request(`/api/produk/${id}`),
    create: (data: Record<string, unknown>) =>
      request("/api/produk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/api/produk/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    patch: (id: string, data: Record<string, unknown>) =>
      request(`/api/produk/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/api/produk/${id}`, { method: "DELETE" }),
  },

  // ============ TRANSAKSI ============
  transaksi: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return request(`/api/transaksi${query}`);
    },
    get: (id: string) => request(`/api/transaksi/${id}`),
    create: (data: Record<string, unknown>) =>
      request("/api/transaksi", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/api/transaksi/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/api/transaksi/${id}`, { method: "DELETE" }),
  },

  // ============ PENGELUARAN ============
  pengeluaran: {
    list: () => request("/api/pengeluaran"),
    create: (data: Record<string, unknown>) =>
      request("/api/pengeluaran", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/api/pengeluaran/${id}`, { method: "DELETE" }),
  },

  // ============ LAPORAN ============
  laporan: {
    get: (period: string) => request(`/api/laporan?period=${period}`),
    harian: (date?: string) =>
      request(`/api/laporan/harian${date ? `?date=${date}` : ""}`),
    mingguan: (params?: { from?: string; to?: string }) => {
      const query = params
        ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
        : "";
      return request(`/api/laporan/mingguan${query}`);
    },
    bulanan: (month?: string) =>
      request(`/api/laporan/bulanan${month ? `?month=${month}` : ""}`),
    labaRugi: (params?: { period?: string; from?: string; to?: string }) => {
      const query = params
        ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
        : "";
      return request(`/api/laporan/laba-rugi${query}`);
    },
    ekspor: (params?: { period?: string; from?: string; to?: string }) => {
      const query = params
        ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
        : "";
      return request(`/api/laporan/ekspor${query}`);
    },
  },

  // ============ QRIS ============
  qris: {
    get: () => request("/api/qris"),
    upload: (imageData: string, accountName?: string) =>
      request("/api/qris", {
        method: "POST",
        body: JSON.stringify({
          image_data: imageData,
          account_name: accountName,
        }),
      }),
    update: (data: { image_data?: string; account_name?: string }) =>
      request("/api/qris", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // ============ CONFIG ============
  config: {
    get: () => request("/api/config"),
    update: (data: Record<string, unknown>) =>
      request("/api/config", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // ============ NOTIFIKASI ============
  notifikasi: {
    list: () => request("/api/notifikasi"),
    markRead: (id: string) =>
      request("/api/notifikasi", {
        method: "PATCH",
        body: JSON.stringify({ action: "mark_read", id }),
      }),
    clearAll: () =>
      request("/api/notifikasi", {
        method: "PATCH",
        body: JSON.stringify({ action: "clear_all" }),
      }),
  },

  // ============ ADMIN ============
  admin: {
    users: {
      list: () => request("/api/admin/users"),
      create: (data: Record<string, unknown>) =>
        request("/api/admin/users", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: Record<string, unknown>) =>
        request(`/api/admin/users/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      resetPassword: (id: string, password: string) =>
        request(`/api/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ password }),
        }),
      delete: (id: string) =>
        request(`/api/admin/users/${id}`, { method: "DELETE" }),
    },
    produk: {
      get: (id: string) => request(`/api/admin/produk/${id}`),
      update: (id: string, data: Record<string, unknown>) =>
        request(`/api/admin/produk/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request(`/api/admin/produk/${id}`, { method: "DELETE" }),
    },
  },
};
