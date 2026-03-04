"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Spotlight } from "@/components/ui/spotlight";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = isLogin
        ? await login(username, password)
        : await register(username, email, password);
      setAuth(data.user, data.access_token);
      router.push("/feed");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        // Pydantic validation errors come as [{msg, loc, ...}, ...]
        setError(detail.map((e: any) => e.msg).join(", "));
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center relative overflow-hidden">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-aura-purple/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-aura-accent/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-4 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aura-purple to-aura-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">AuraNet</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-aura-card/80 backdrop-blur-md border border-aura-border rounded-2xl p-8 shadow-2xl shadow-aura-purple/5">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-aura-text">
              {isLogin ? "Welcome back" : "Join the vibes"}
            </h1>
            <p className="text-sm text-aura-muted mt-2">
              {isLogin
                ? "Sign in to continue rating auras"
                : "Create your account and start posting"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-aura-muted mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-aura-bg border border-aura-border rounded-xl px-4 py-3 text-sm
                  focus:border-aura-purple focus:ring-1 focus:ring-aura-purple/50 outline-none transition"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-aura-muted mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-aura-bg border border-aura-border rounded-xl px-4 py-3 text-sm
                    focus:border-aura-purple focus:ring-1 focus:ring-aura-purple/50 outline-none transition"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-aura-muted mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-aura-bg border border-aura-border rounded-xl px-4 py-3 pr-10 text-sm
                    focus:border-aura-purple focus:ring-1 focus:ring-aura-purple/50 outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-muted hover:text-aura-text transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-aura-accent bg-aura-accent/10 rounded-xl p-3 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-aura-purple to-aura-accent rounded-xl font-semibold
                hover:brightness-110 transition disabled:opacity-50 text-white"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-aura-border text-center">
            <p className="text-sm text-aura-muted">
              {isLogin ? "New to AuraNet?" : "Already have an account?"}{" "}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-aura-purple font-medium hover:underline"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-aura-muted mt-6">
          By continuing, you agree to AuraNet&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
