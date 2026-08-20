"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/use-auth";

function homeForRole(role: string | undefined): string {
  if (role === "vendor" || role === "vendor_employee") return "/vendor/dashboard";
  if (
    role &&
    ["verification_officer", "sales_admin", "super_admin"].includes(role)
  ) {
    return "/admin/dashboard";
  }
  return "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("customer@csc.demo");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Only leave login after a live /api/auth/me confirms a real user
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const next = params.get("next") || homeForRole(user.role);
    router.replace(next);
  }, [authLoading, user, params, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Login failed");
        return;
      }
      const nextUser = await refresh();
      const role = nextUser?.role ?? json.data?.user?.role;
      const next = params.get("next") || homeForRole(role);
      router.replace(next);
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <p className="text-center text-sm text-text-secondary">
        Checking session…
      </p>
    );
  }

  if (user) {
    return (
      <p className="text-center text-sm text-text-secondary">
        Signed in — redirecting…
      </p>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-primary-navy">Login</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Sign in as customer, vendor, or vendor employee.
      </p>
      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-text-secondary">
        Demo: <span className="font-semibold">customer@csc.demo</span>,{" "}
        <span className="font-semibold">vendor@csc.demo</span>,{" "}
        <span className="font-semibold">worker@csc.demo</span> /{" "}
        <span className="font-semibold">demo1234</span>
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11"
          />
        </div>
        {error ? (
          <p className="rounded-lg bg-alert-warning-bg px-3 py-2 text-sm text-alert-warning-text">
            {error}
          </p>
        ) : null}
        <Button className="h-11 w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-text-secondary">
        No account?{" "}
        <Link href="/register" className="font-semibold text-primary-teal">
          Register
        </Link>
        {" · "}
        <Link
          href="/register/vendor"
          className="font-semibold text-primary-teal"
        >
          Vendor register
        </Link>
        {" · "}
        <Link href="/admin-login" className="font-semibold text-primary-navy">
          Admin login
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-text-secondary">Loading…</p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
