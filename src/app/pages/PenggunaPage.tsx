import { useState } from "react";
import { Plus, Edit, Key, Search, X, Save } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function PenggunaPage() {
  const { users, addUser, editUser, resetPassword } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "owner" as "owner" | "admin", password: "" });
  const [showReset, setShowReset] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const filtered = users.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  const openAdd = () => { setEditId(null); setForm({ name: "", email: "", role: "owner", password: "" }); setShowModal(true); };
  const openEdit = (id: string) => {
    const u = users.find((us) => us.id === id);
    if (u) { setEditId(id); setForm({ name: u.name, email: u.email, role: u.role, password: "" }); setShowModal(true); }
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editId) {
      editUser(editId, { name: form.name, email: form.email, role: form.role });
    } else {
      if (!form.password) return;
      addUser({ name: form.name, email: form.email, role: form.role, password: form.password });
    }
    setShowModal(false);
  };

  const handleReset = () => {
    if (showReset && newPassword.length >= 6) {
      resetPassword(showReset, newPassword);
      setShowReset(null);
      setNewPassword("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-1">Kelola akun Owner & Admin</p>
        </div>
        <button onClick={openAdd} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2 transform hover:scale-[1.02] transition-all">
          <Plus className="w-5 h-5" />Tambah User
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="Cari pengguna..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Pengguna</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.role === "owner" ? "bg-gradient-to-br from-[#FBAA31] to-[#E87428]" : "bg-gradient-to-br from-purple-500 to-purple-700"}`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${user.role === "owner" ? "bg-[#FBAA31]/10 text-[#E87428]" : "bg-purple-50 text-purple-600"}`}>
                      {user.role === "owner" ? "👑 Owner" : "🔧 Admin"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(user.id)} className="p-2 hover:bg-[#FBAA31]/10 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4 text-[#FBAA31]" /></button>
                      <button onClick={() => { setShowReset(user.id); setNewPassword(""); }} className="p-2 hover:bg-purple-50 rounded-lg transition-colors" title="Reset Password"><Key className="w-4 h-4 text-purple-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editId ? "Edit User" : "Tambah User"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "owner" | "admin" })} className="w-full px-4 py-3 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {!editId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                </div>
              )}
            </div>
            <button onClick={handleSave} className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />{editId ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Reset Password</h3>
            <p className="text-sm text-muted-foreground mb-4">User: {users.find((u) => u.id === showReset)?.name}</p>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password baru (min 6 karakter)" className="w-full px-4 py-3 bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowReset(null)} className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-xl">Batal</button>
              <button onClick={handleReset} disabled={newPassword.length < 6} className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 transition-all">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
