"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function RegisterForm({ token }: { token: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast({
        title: "Missing fields",
        description: "Fill all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (form.password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Confirm password must match.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    toast({
      title: "Creating user...",
      description: "Please wait.",
      variant: "info",
    });

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast({
          title: "Failed to create user",
          description: data?.error ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "User created",
        description: "You can now login.",
        variant: "success",
      });
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background px-4 py-10 sm:px-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <div className="card-pharmacy p-6 sm:p-8">
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
              <p className="text-sm text-muted-foreground">Create a new user</p>
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Register
            </h1>
            <p className="text-sm text-muted-foreground">
              This is a restricted page for creating new users.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  value={form.name}
                  disabled={submitting}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
            </div>

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
                  className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  value={form.password}
                  disabled={submitting}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create password"
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  value={form.confirmPassword}
                  disabled={submitting}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm((v) => !v)}
                  disabled={submitting}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="btn-primary w-full" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              <span>Already have an account?</span>{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

