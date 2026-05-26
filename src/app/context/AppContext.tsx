import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ============ TYPES ============
export interface Product {
  id: string;
  name: string;
  price: number;
  stokHarian: number;
  stokTerjual: number;
  image: string;
  photoUrl: string;
  createdAt: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  buyerName: string;
  items: TransactionItem[];
  total: number;
  method: "tunai" | "qris";
  status: "lunas" | "pending";
  date: string;
  time: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  password: string;
}

export interface QrisConfig {
  imageData: string;
  accountName: string;
}

export interface StoreConfig {
  name: string;
  address: string;
  phone: string;
  ownerName: string;
}

export interface Notification {
  id: string;
  type: "stok_habis" | "info" | "success";
  message: string;
  productId?: string;
  timestamp: string;
  read: boolean;
}

// ============ CONTEXT TYPE ============
interface AppContextType {
  // Auth
  currentUser: AppUser | null;
  login: (email: string, password: string) => AppUser | null;
  logout: () => void;

  // Products
  products: Product[];
  addProduct: (p: Omit<Product, "id" | "createdAt" | "stokTerjual">) => void;
  editProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Stock
  setDailyStock: (productId: string, amount: number) => void;
  resetDailyStock: (productId: string) => void;
  getSisaStok: (productId: string) => number;

  // Transactions
  transactions: Transaction[];
  addTransaction: (items: TransactionItem[], method: "tunai" | "qris", buyerName: string) => Transaction;
  editTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  confirmQris: (id: string) => void;
  getTodayTransactions: () => Transaction[];

  // Expenses
  expenses: Expense[];
  addExpense: (description: string, amount: number, date: string) => void;
  deleteExpense: (id: string) => void;

  // QRIS
  qrisConfig: QrisConfig;
  updateQris: (config: Partial<QrisConfig>) => void;

  // Store
  storeConfig: StoreConfig;
  updateStore: (config: Partial<StoreConfig>) => void;

  // Users (admin only)
  users: AppUser[];
  addUser: (u: Omit<AppUser, "id">) => void;
  editUser: (id: string, u: Partial<AppUser>) => void;
  resetPassword: (id: string, newPassword: string) => void;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ============ HELPER ============
function generateId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getNow() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============ DEFAULT DATA ============
const defaultProducts: Product[] = [
  {
    id: "PRD001",
    name: "Tahu Walik",
    price: 1000,
    stokHarian: 30,
    stokTerjual: 0,
    image: "🥟",
    photoUrl: "",
    createdAt: "2026-05-17",
  },
];

const defaultUsers: AppUser[] = [
  {
    id: "USR001",
    name: "Ishaq Abdul Zafar",
    email: "ishaq@cemil.in",
    role: "owner",
    password: "owner123",
  },
  {
    id: "USR002",
    name: "Rofi",
    email: "rofi@cemil.in",
    role: "admin",
    password: "admin123",
  },
  {
    id: "USR003",
    name: "Adit",
    email: "adit@cemil.in",
    role: "admin",
    password: "admin123",
  },
];

const defaultStoreConfig: StoreConfig = {
  name: "Cemil.in",
  address: "Jl. Siliwangi Gg Guntur 1 Cianjur, Jawa Barat",
  phone: "0812-0000-0000",
  ownerName: "Ishaq Abdul Zafar",
};

const defaultQrisConfig: QrisConfig = {
  imageData: "",
  accountName: "Cemil.in - Ishaq",
};

// ============ PROVIDER ============
export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(
    loadFromStorage("pos_currentUser", null)
  );
  const [products, setProducts] = useState<Product[]>(
    loadFromStorage("pos_products", defaultProducts)
  );
  const [transactions, setTransactions] = useState<Transaction[]>(
    loadFromStorage("pos_transactions", [])
  );
  const [expenses, setExpenses] = useState<Expense[]>(
    loadFromStorage("pos_expenses", [])
  );
  const [users, setUsers] = useState<AppUser[]>(
    loadFromStorage("pos_users", defaultUsers)
  );
  const [qrisConfig, setQrisConfig] = useState<QrisConfig>(
    loadFromStorage("pos_qris", defaultQrisConfig)
  );
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(
    loadFromStorage("pos_store", defaultStoreConfig)
  );
  const [notifications, setNotifications] = useState<Notification[]>(
    loadFromStorage("pos_notifications", [])
  );

  // Persist to localStorage
  useEffect(() => saveToStorage("pos_currentUser", currentUser), [currentUser]);
  useEffect(() => saveToStorage("pos_products", products), [products]);
  useEffect(() => saveToStorage("pos_transactions", transactions), [transactions]);
  useEffect(() => saveToStorage("pos_expenses", expenses), [expenses]);
  useEffect(() => saveToStorage("pos_users", users), [users]);
  useEffect(() => saveToStorage("pos_qris", qrisConfig), [qrisConfig]);
  useEffect(() => saveToStorage("pos_store", storeConfig), [storeConfig]);
  useEffect(() => saveToStorage("pos_notifications", notifications), [notifications]);

  // Check stok habis and create notifications
  useEffect(() => {
    const today = getToday();
    products.forEach((p) => {
      const sisa = p.stokHarian - p.stokTerjual;
      if (sisa <= 0 && p.stokHarian > 0) {
        setNotifications((prev) => {
          const existingNotif = prev.find(
            (n) => n.productId === p.id && n.type === "stok_habis" && n.timestamp.startsWith(today)
          );
          if (existingNotif) return prev;
          const newNotif: Notification = {
            id: generateId("NTF"),
            type: "stok_habis",
            message: `Stok ${p.name} Habis! Jualan hari ini selesai 🎉`,
            productId: p.id,
            timestamp: new Date().toISOString(),
            read: false,
          };
          return [newNotif, ...prev];
        });
      }
    });
  }, [products]);

  // ---- AUTH ----
  const login = (email: string, password: string): AppUser | null => {
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return user;
    }
    return null;
  };

  const logout = () => setCurrentUser(null);

  // ---- PRODUCTS ----
  const addProduct = (p: Omit<Product, "id" | "createdAt" | "stokTerjual">) => {
    const newProduct: Product = {
      ...p,
      id: generateId("PRD"),
      stokTerjual: 0,
      createdAt: getToday(),
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const editProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ---- STOCK ----
  const setDailyStock = (productId: string, amount: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stokHarian: amount, stokTerjual: 0 } : p
      )
    );
  };

  const resetDailyStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stokTerjual: 0 } : p))
    );
  };

  const getSisaStok = (productId: string): number => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    return Math.max(0, product.stokHarian - product.stokTerjual);
  };

  // ---- TRANSACTIONS ----
  const addTransaction = (
    items: TransactionItem[],
    method: "tunai" | "qris",
    buyerName: string
  ): Transaction => {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const newTrx: Transaction = {
      id: generateId("TRX"),
      buyerName,
      items,
      total,
      method,
      status: method === "tunai" ? "lunas" : "pending",
      date: getToday(),
      time: getNow(),
    };
    setTransactions((prev) => [newTrx, ...prev]);

    // Stok berkurang langsung untuk SEMUA metode (produk sudah diberikan ke pembeli)
    reduceStock(items);

    return newTrx;
  };

  const reduceStock = (items: TransactionItem[]) => {
    setProducts((prev) =>
      prev.map((p) => {
        const item = items.find((i) => i.productId === p.id);
        if (item) {
          return { ...p, stokTerjual: p.stokTerjual + item.quantity };
        }
        return p;
      })
    );
  };

  const restoreStock = (items: TransactionItem[]) => {
    setProducts((prev) =>
      prev.map((p) => {
        const item = items.find((i) => i.productId === p.id);
        if (item) {
          return { ...p, stokTerjual: Math.max(0, p.stokTerjual - item.quantity) };
        }
        return p;
      })
    );
  };

  const editTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTransaction = (id: string) => {
    const trx = transactions.find((t) => t.id === id);
    if (trx) {
      // Selalu kembalikan stok, baik lunas maupun pending
      restoreStock(trx.items);
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const confirmQris = (id: string) => {
    // Hanya ubah status ke lunas, stok sudah dikurangi saat transaksi dibuat
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id && t.status === "pending") {
          return { ...t, status: "lunas" };
        }
        return t;
      })
    );
  };

  const getTodayTransactions = (): Transaction[] => {
    const today = getToday();
    return transactions.filter((t) => t.date === today && t.status === "lunas");
  };

  // ---- EXPENSES ----
  const addExpense = (description: string, amount: number, date: string) => {
    const newExpense: Expense = {
      id: generateId("EXP"),
      description,
      amount,
      date,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // ---- QRIS ----
  const updateQris = (config: Partial<QrisConfig>) => {
    setQrisConfig((prev) => ({ ...prev, ...config }));
  };

  // ---- STORE ----
  const updateStore = (config: Partial<StoreConfig>) => {
    setStoreConfig((prev) => ({ ...prev, ...config }));
  };

  // ---- USERS ----
  const addUser = (u: Omit<AppUser, "id">) => {
    const newUser: AppUser = { ...u, id: generateId("USR") };
    setUsers((prev) => [...prev, newUser]);
  };

  const editUser = (id: string, updates: Partial<AppUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const resetPassword = (id: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, password: newPassword } : u))
    );
  };

  // ---- NOTIFICATIONS ----
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => setNotifications([]);

  return (
    <AppContext.Provider
      value={{
        currentUser, login, logout,
        products, addProduct, editProduct, deleteProduct,
        setDailyStock, resetDailyStock, getSisaStok,
        transactions, addTransaction, editTransaction, deleteTransaction, confirmQris, getTodayTransactions,
        expenses, addExpense, deleteExpense,
        qrisConfig, updateQris,
        storeConfig, updateStore,
        users, addUser, editUser, resetPassword,
        notifications, markNotificationRead, clearNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
