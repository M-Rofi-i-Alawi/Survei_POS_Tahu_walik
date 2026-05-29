import { useNavigate, Navigate } from "react-router";
import { Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, currentUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Jika sudah login, langsung redirect ke dashboard
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const user = login(email, password);
      if (user) {
        navigate("/dashboard");
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
          <img
            src="/logo.png"
            alt="Cemil.in Logo"
            className="w-24 h-24 rounded-2xl object-contain mb-4 drop-shadow-lg"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Cemil.in</h1>
          <p className="text-white/70 text-sm">Pos Tahu Walik</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@cemil.in"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/50 focus:border-[#FBAA31]/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
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
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/50 focus:border-[#FBAA31]/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg shadow-[#FBAA31]/30 hover:shadow-xl hover:shadow-[#FBAA31]/40 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-white/50 text-xs mt-6">
        © 2026 Cemil.in – Pos Tahu Walik. All rights reserved.
      </p>
    </div>
  );
}
