"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Missing email",
        description: "Enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setResetLink(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        resetLink?: string;
        emailSent?: boolean;
        emailError?: string;
        error?: string;
      } | null;

      if (!res.ok) {
        toast({
          title: "Request failed",
          description: data?.error ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.resetLink) setResetLink(data.resetLink);
      if (data?.emailSent === false && data?.emailError) {
        toast({
          title: "Email not sent (dev)",
          description: data.emailError,
          variant: "destructive",
        });
      }

      toast({
        title: "If the email exists…",
        description: "A password reset link has been generated.",
        variant: "success",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background px-4 py-10 sm:px-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-xl">
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
              <p className="text-sm text-muted-foreground">
                Reset your password
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative mt-1">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={submitting}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>

            <button
              className="btn-primary w-full"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            {resetLink ? (
              <div className="rounded-md border border-border bg-card p-3 text-sm">
                <div className="text-foreground font-medium">
                  Reset link (dev)
                </div>
                <a
                  href={resetLink}
                  className="mt-1 block break-all text-primary hover:underline"
                >
                  {resetLink}
                </a>
              </div>
            ) : null}

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
