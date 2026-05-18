"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.auth.login(email, password);

      if (res.success) {
        const user = res.data as { role: string };
        if (user.role === "owner") {
          toast.success("Login berhasil!");
          router.push("/dashboard");
        } else {
          setError("Halaman ini khusus untuk Owner. Admin silakan gunakan URL khusus.");
          // Clear the cookie since admin shouldn't login here
          await api.auth.logout();
        }
      } else {
        setError(res.error || "Email atau password salah!");
      }
    } catch {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0E11] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl animate-scaleIn">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FBAA31] to-[#E87428] flex items-center justify-center mb-4 shadow-lg shadow-[#FBAA31]/30">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Cemil.in</h1>
            <p className="text-white/70 text-sm">Pos Tahu Walik</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-red-200 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ishaq@cemil.in"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/50 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg shadow-[#FBAA31]/30 hover:shadow-xl hover:shadow-[#FBAA31]/40 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/50 text-xs text-center mb-2">Demo Login Owner:</p>
            <p className="text-white/70 text-xs text-center">
              Email: <span className="text-[#FDE77A]">ishaq@cemil.in</span> | Password: <span className="text-[#FDE77A]">owner123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          © 2026 Cemil.in – Pos Tahu Walik. All rights reserved.
        </p>
      </div>
    </div>
  );
}
