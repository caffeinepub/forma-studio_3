import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import type { useAuth } from "../hooks/useAuth";

interface LoginPageProps {
  onLogin: ReturnType<typeof useAuth>["login"];
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError("");
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 300));
    const result = onLogin(username.trim(), password);
    if (!result.success) {
      setError(result.error ?? "Login failed.");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "oklch(0.08 0.005 260)" }}
    >
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.22 0.008 260 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.22 0.008 260 / 0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/assets/uploads/IMG_20260317_064146-1.jpg"
            alt="The Pilates Studio"
            className="mx-auto max-h-24 object-contain"
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: "oklch(0.12 0.006 260)",
            borderColor: "oklch(0.22 0.008 260)",
            boxShadow:
              "0 25px 50px oklch(0.05 0.01 260 / 0.5), 0 0 0 1px oklch(0.85 0.14 185 / 0.06)",
          }}
        >
          <div className="mb-6 text-center">
            <h1
              className="font-display text-2xl font-light mb-1"
              style={{ color: "oklch(0.97 0.005 80)" }}
            >
              Welcome back
            </h1>
            <p
              className="text-sm font-body"
              style={{ color: "oklch(0.55 0.01 80)" }}
            >
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="text-xs font-body font-medium uppercase tracking-widest"
                style={{ color: "oklch(0.55 0.01 80)" }}
              >
                Username
              </Label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "oklch(0.45 0.01 80)" }}
                />
                <Input
                  id="username"
                  data-ocid="login.username.input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-9 font-body"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-body font-medium uppercase tracking-widest"
                style={{ color: "oklch(0.55 0.01 80)" }}
              >
                Password
              </Label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "oklch(0.45 0.01 80)" }}
                />
                <Input
                  id="password"
                  data-ocid="login.password.input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-9 pr-9 font-body"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "oklch(0.45 0.01 80)" }}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                data-ocid="login.error_state"
                className="text-sm font-body px-3 py-2 rounded-md"
                style={{
                  backgroundColor: "oklch(0.28 0.05 25 / 0.3)",
                  color: "oklch(0.75 0.15 25)",
                  border: "1px solid oklch(0.4 0.1 25 / 0.4)",
                }}
              >
                {error}
              </div>
            )}

            <Button
              data-ocid="login.submit_button"
              type="submit"
              disabled={loading}
              className="w-full font-body font-medium"
              style={{
                backgroundColor: "oklch(0.52 0.085 150)",
                color: "oklch(0.99 0.005 80)",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>

        <p
          className="text-center text-xs font-body mt-6"
          style={{ color: "oklch(0.35 0.01 80)" }}
        >
          © {new Date().getFullYear()} Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "oklch(0.85 0.14 185)" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
