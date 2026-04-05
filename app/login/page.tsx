"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast({
        title: "Missing fields",
        description: "Enter your email and password.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    toast({
      title: "Signing in...",
      description: "Please wait.",
      variant: "info",
    });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast({
          title: "Login failed",
          description: data?.error ?? "Invalid email or password.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back",
        description: "Signed in successfully.",
        variant: "success",
      });
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background px-4 py-10 sm:px-6 flex items-center justify-center">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-pharmacy p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: "hsl(221, 83%, 53%)", color: "white" }}
            >
              OS
            </div>
            <div>
              <p className="text-base font-semibold text-foreground tracking-tight">
                PharmaPay
              </p>
              <p className="text-sm text-muted-foreground">
                Vendor, purchase, payment management
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Track vendor balances, manage purchases & payments, and export
              reports to Excel.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { title: "Vendors", desc: "Create, edit, view, delete" },
                { title: "Purchases", desc: "Bills, type, notes" },
                { title: "Payments", desc: "Methods, notes" },
                { title: "Ledger", desc: "Running balance by vendor" },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {c.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              By continuing, you agree to the terms and privacy policy.
            </p>
          </div>
        </div>

        <div className="card-pharmacy p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Login</h2>
            <p className="text-sm text-muted-foreground">
              Use your email and password to access the dashboard.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  value={form.email}
                  disabled={submitting}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  value={form.password}
                  disabled={submitting}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.remember}
                  disabled={submitting}
                  onChange={(e) =>
                    setForm({ ...form, remember: e.target.checked })
                  }
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              className="btn-primary w-full"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              <span>New here?</span>{" "}
              <Link href="/" className="text-primary hover:underline">
                Contact admin
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
