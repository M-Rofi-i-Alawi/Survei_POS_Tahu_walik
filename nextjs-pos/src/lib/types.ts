// ============ DATABASE TYPES ============

export interface Product {
  id: string;
  name: string;
  price: number;
  stok_harian: number;
  stok_terjual: number;
  image: string;
  photo_url: string;
  created_at: string;
}

export interface TransactionItem {
  id?: string;
  transaction_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  buyer_name: string;
  items?: TransactionItem[];
  total: number;
  method: "tunai" | "qris";
  status: "lunas" | "pending";
  date: string;
  time: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  password?: string;
  created_at?: string;
}

export interface QrisConfig {
  id?: string;
  image_data: string;
  account_name: string;
}

export interface StoreConfig {
  id?: string;
  name: string;
  address: string;
  phone: string;
  owner_name: string;
}

export interface Notification {
  id: string;
  type: "stok_habis" | "info" | "success";
  message: string;
  product_id?: string;
  timestamp: string;
  read: boolean;
  user_id?: string;
}

// ============ API RESPONSE TYPES ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LaporanHarian {
  date: string;
  total_pemasukan: number;
  total_pengeluaran: number;
  laba_rugi: number;
  total_transaksi: number;
  tunai: number;
  qris: number;
}

export interface LaporanPeriode {
  periode: string;
  data: LaporanHarian[];
  summary: {
    total_pemasukan: number;
    total_pengeluaran: number;
    laba_rugi: number;
    total_transaksi: number;
  };
}
