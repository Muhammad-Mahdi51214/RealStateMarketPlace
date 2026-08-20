"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/use-auth";
import { validateRegisterClient } from "@shared/validation/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const clientError = validateRegisterClient(form);
    if (clientError) {
      setError(clientError);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Registration failed");
        return;
      }
      await refresh();
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-primary-navy">Create account</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Register to reserve plots and track ownership.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
            minLength={2}
            maxLength={120}
            className="h-11"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            maxLength={254}
            placeholder="name@example.com"
            className="h-11"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={form.phone}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d+]/g, "").slice(0, 13);
              setForm({ ...form, phone: next });
            }}
            required
            maxLength={13}
            placeholder="03XXXXXXXXX"
            className="h-11"
            autoComplete="tel"
          />
          <p className="text-[11px] text-text-secondary">
            Pakistan mobile only (11 digits, e.g. 03001234567)
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            maxLength={72}
            className="h-11"
            autoComplete="new-password"
          />
          <p className="text-[11px] text-text-secondary">
            Min 8 characters with letters, numbers, and a special character
            (!@#$…)
          </p>
        </div>
        {error ? (
          <p className="rounded-lg bg-alert-warning-bg px-3 py-2 text-sm text-alert-warning-text">
            {error}
          </p>
        ) : null}
        <Button className="h-11 w-full" disabled={loading}>
          {loading ? "Creating…" : "Register Now"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-text-secondary">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-primary-teal">
          Login
        </Link>
      </p>
    </div>
  );
}
