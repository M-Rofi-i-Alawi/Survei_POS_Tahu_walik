import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

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
  isLoading: boolean;
  currentUser: AppUser | null;
  login: (email: string, password: string) => Promise<AppUser | null>;
  logout: () => void;
  products: Product[];
  addProduct: (p: Omit<Product, "id" | "createdAt" | "stokTerjual">) => Promise<void>;
  editProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setDailyStock: (productId: string, amount: number) => Promise<void>;
  resetDailyStock: (productId: string) => Promise<void>;
  getSisaStok: (productId: string) => number;
  transactions: Transaction[];
  addTransaction: (items: TransactionItem[], method: "tunai" | "qris", buyerName: string) => Promise<Transaction>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  confirmQris: (id: string) => Promise<void>;
  getTodayTransactions: () => Transaction[];
  expenses: Expense[];
  addExpense: (description: string, amount: number, date: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  qrisConfig: QrisConfig;
  updateQris: (config: Partial<QrisConfig>) => Promise<void>;
  storeConfig: StoreConfig;
  updateStore: (config: Partial<StoreConfig>) => Promise<void>;
  users: AppUser[];
  addUser: (u: Omit<AppUser, "id">) => Promise<void>;
  editUser: (id: string, u: Partial<AppUser>) => Promise<void>;
  resetPassword: (id: string, newPassword: string) => Promise<void>;
  notifications: Notification[];
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ============ HELPERS ============
function generateId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getNow() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ============ DEFAULT DATA (hanya users & config, tidak ada produk) ============
const defaultUsers: AppUser[] = [
  { id: "USR001", name: "Ishaq Abdul Zafar", email: "ishaq@cemil.in", role: "owner", password: "owner123" },
  { id: "USR002", name: "Rofi", email: "rofi@cemil.in", role: "admin", password: "admin123" },
  { id: "USR003", name: "Adit", email: "adit@cemil.in", role: "admin", password: "admin123" },
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

// ============ FIRESTORE INIT ============
async function initializeDefaultData() {
  const storeSnap = await getDoc(doc(db, "config", "store"));
  if (!storeSnap.exists()) {
    await setDoc(doc(db, "config", "store"), defaultStoreConfig);
  }

  const qrisSnap = await getDoc(doc(db, "config", "qris"));
  if (!qrisSnap.exists()) {
    await setDoc(doc(db, "config", "qris"), defaultQrisConfig);
  }

  const usersSnap = await getDocs(collection(db, "users"));
  if (usersSnap.empty) {
    const batch = writeBatch(db);
    defaultUsers.forEach((u) => {
      batch.set(doc(db, "users", u.id), u);
    });
    await batch.commit();
  }

  // Produk tidak diisi otomatis — owner yang tambah sendiri lewat UI
}

// ============ PROVIDER ============
export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [qrisConfig, setQrisConfig] = useState<QrisConfig>(defaultQrisConfig);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(defaultStoreConfig);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let unsubscribers: (() => void)[] = [];

    const init = async () => {
      await initializeDefaultData();

      const savedUser = localStorage.getItem("pos_currentUser");
      if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch { /* ignore */ }
      }

      unsubscribers.push(
        onSnapshot(collection(db, "products"), (snap) => {
          setProducts(snap.docs.map((d) => d.data() as Product));
        }),
        onSnapshot(collection(db, "transactions"), (snap) => {
          const trxs = snap.docs.map((d) => d.data() as Transaction);
          trxs.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
          setTransactions(trxs);
        }),
        onSnapshot(collection(db, "expenses"), (snap) => {
          const exps = snap.docs.map((d) => d.data() as Expense);
          exps.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setExpenses(exps);
        }),
        onSnapshot(collection(db, "users"), (snap) => {
          setUsers(snap.docs.map((d) => d.data() as AppUser));
        }),
        onSnapshot(collection(db, "notifications"), (snap) => {
          const notifs = snap.docs.map((d) => d.data() as Notification);
          notifs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setNotifications(notifs);
        }),
        onSnapshot(doc(db, "config", "store"), (snap) => {
          if (snap.exists()) setStoreConfig(snap.data() as StoreConfig);
        }),
        onSnapshot(doc(db, "config", "qris"), (snap) => {
          if (snap.exists()) setQrisConfig(snap.data() as QrisConfig);
        }),
      );

      setIsLoading(false);
    };

    init();
    return () => unsubscribers.forEach((u) => u());
  }, []);

  useEffect(() => {
    if (currentUser) {
      const fresh = users.find((u) => u.id === currentUser.id);
      if (!fresh) {
        setCurrentUser(null);
        localStorage.removeItem("pos_currentUser");
      } else if (JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
        setCurrentUser(fresh);
        localStorage.setItem("pos_currentUser", JSON.stringify(fresh));
      }
    }
  }, [users]);

  useEffect(() => {
    const today = getToday();
    products.forEach(async (p) => {
      const sisa = p.stokHarian - p.stokTerjual;
      if (sisa <= 0 && p.stokHarian > 0) {
        const existing = notifications.find(
          (n) => n.productId === p.id && n.type === "stok_habis" && n.timestamp.startsWith(today)
        );
        if (!existing) {
          const newNotif: Notification = {
            id: generateId("NTF"),
            type: "stok_habis",
            message: `Stok ${p.name} Habis! Jualan hari ini selesai 🎉`,
            productId: p.id,
            timestamp: new Date().toISOString(),
            read: false,
          };
          await setDoc(doc(db, "notifications", newNotif.id), newNotif);
        }
      }
    });
  }, [products]);

  const login = async (email: string, password: string): Promise<AppUser | null> => {
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("pos_currentUser", JSON.stringify(user));
      return user;
    }
    return null;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("pos_currentUser");
  };

  const addProduct = async (p: Omit<Product, "id" | "createdAt" | "stokTerjual">) => {
    const newProduct: Product = { ...p, id: generateId("PRD"), stokTerjual: 0, createdAt: getToday() };
    await setDoc(doc(db, "products", newProduct.id), newProduct);
  };

  const editProduct = async (id: string, updates: Partial<Product>) => {
    const ref = doc(db, "products", id);
    const snap = await getDoc(ref);
    if (snap.exists()) await setDoc(ref, { ...snap.data(), ...updates });
  };

  const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, "products", id));
  };

  const setDailyStock = async (productId: string, amount: number) => {
    const ref = doc(db, "products", productId);
    const snap = await getDoc(ref);
    if (snap.exists()) await setDoc(ref, { ...snap.data(), stokHarian: amount, stokTerjual: 0 });
  };

  const resetDailyStock = async (productId: string) => {
    const ref = doc(db, "products", productId);
    const snap = await getDoc(ref);
    if (snap.exists()) await setDoc(ref, { ...snap.data(), stokTerjual: 0 });
  };

  const getSisaStok = (productId: string): number => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    return Math.max(0, product.stokHarian - product.stokTerjual);
  };

  const addTransaction = async (
    items: TransactionItem[],
    method: "tunai" | "qris",
    buyerName: string
  ): Promise<Transaction> => {
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
    await setDoc(doc(db, "transactions", newTrx.id), newTrx);

    const batch = writeBatch(db);
    for (const item of items) {
      const ref = doc(db, "products", item.productId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const p = snap.data() as Product;
        batch.set(ref, { ...p, stokTerjual: p.stokTerjual + item.quantity });
      }
    }
    await batch.commit();

    return newTrx;
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    const ref = doc(db, "transactions", id);
    const snap = await getDoc(ref);
    if (snap.exists()) await setDoc(ref, { ...snap.data(), ...updates });
  };

  const deleteTransaction = async (id: string) => {
    const ref = doc(db, "transactions", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const trx = snap.data() as Transaction;
      const batch = writeBatch(db);
      for (const item of trx.items) {
        const pRef = doc(db, "products", item.productId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const p = pSnap.data() as Product;
          batch.set(pRef, { ...p, stokTerjual: Math.max(0, p.stokTerjual - item.quantity) });
        }
      }
      batch.delete(ref);
      await batch.commit();
    }
  };

  const confirmQris = async (id: string) => {
    const ref = doc(db, "transactions", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const trx = snap.data() as Transaction;
      if (trx.status === "pending") await setDoc(ref, { ...trx, status: "lunas" });
    }
  };

  const getTodayTransactions = (): Transaction[] => {
    const today = getToday();
    return transactions.filter((t) => t.date === today && t.status === "lunas");
  };

  const addExpense = async (description: string, amount: number, date: string) => {
    const newExpense: Expense = {
      id: generateId("EXP"),
      description,
      amount,
      date,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "expenses", newExpense.id), newExpense);
  };

  const deleteExpense = async (id: string) => {
    await deleteDoc(doc(db, "expenses", id));
  };

  const updateQris = async (config: Partial<QrisConfig>) => {
    await setDoc(doc(db, "config", "qris"), { ...qrisConfig, ...config });
  };

  const updateStore = async (config: Partial<StoreConfig>) => {
    await setDoc(doc(db, "config", "store"), { ...storeConfig, ...config });
  };

  const addUser = async (u: Omit<AppUser, "id">) => {
    const newUser: AppUser = { ...u, id: generateId("USR") };
    await setDoc(doc(db, "users", newUser.id), newUser);
  };

  const editUser = async (id: string, updates: Partial<AppUser>) => {
    const ref = doc(db, "users", id);
    const snap = await getDoc(ref);
    if (snap.exists()) await setDoc(ref, { ...snap.data(), ...updates });
  };

  const resetPassword = async (id: string, newPassword: string) => {
    const ref = doc(db, "users", id);
    const snap = await getDoc(ref);
    if (snap.exists()) await setDoc(ref, { ...snap.data(), password: newPassword });
  };

  const markNotificationRead = async (id: string) => {
    const ref = doc(db, "notifications", id);
    const snap = await getDoc(ref);
    if (snap.exists()) await setDoc(ref, { ...snap.data(), read: true });
  };

  const clearNotifications = async () => {
    const batch = writeBatch(db);
    notifications.forEach((n) => batch.delete(doc(db, "notifications", n.id)));
    await batch.commit();
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
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