"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/use-auth";

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("admin@csc.demo");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, adminOnly: true }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Login failed");
        return;
      }
      await refresh();
      router.replace(params.get("next") || "/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-primary-navy">Admin portal login</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Staff access for inventory, verification, and sales.
      </p>
      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-text-secondary">
        Demo: <span className="font-semibold">admin@csc.demo</span> /{" "}
        <span className="font-semibold">demo1234</span> (also officer@ / sales@)
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
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
          {loading ? "Signing in…" : "Admin sign in"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-text-secondary">
        <Link href="/login" className="font-semibold text-primary-teal">
          Customer login
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-text-secondary">Loading…</p>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
