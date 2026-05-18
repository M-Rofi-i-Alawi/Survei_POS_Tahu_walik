import { useNavigate } from "react-router";
import { ShoppingCart, Mail, Lock, Shield } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const user = login(email, password);
      if (user) {
        if (user.role === "admin") {
          navigate("/dashboard");
        } else {
          setError("Halaman ini khusus untuk Admin maintenance.");
          setLoading(false);
        }
      } else {
        setError("Email atau password salah!");
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="w-full max-w-md">
      {/* Glassmorphism Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-white/70 text-sm">Cemil.in – Maintenance Access</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Email Admin
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cemil.in"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Memproses..." : "Masuk sebagai Admin"}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/50 text-xs text-center mb-2">Demo Login Admin:</p>
          <p className="text-white/70 text-xs text-center">
            Email: <span className="text-purple-300">rofi@cemil.in</span> | Password: <span className="text-purple-300">admin123</span>
          </p>
        </div>
      </div>

      <p className="text-center text-white/50 text-xs mt-6">
        🔒 Halaman ini hanya untuk Admin maintenance
      </p>
    </div>
  );
}
