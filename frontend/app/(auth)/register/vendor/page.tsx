"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/use-auth";
import { validateRegisterClient } from "@shared/validation/auth";

export default function VendorRegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    company_name: "",
    bio: "",
    service_areas: "Executive Block",
    years_experience: "5",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const clientError = validateRegisterClient({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    if (clientError) {
      setError(clientError);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/vendors/register", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          company_name: form.company_name,
          bio: form.bio,
          service_areas: form.service_areas
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          years_experience: Number(form.years_experience) || 0,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Registration failed");
        return;
      }
      await refresh();
      router.replace("/vendor/dashboard");
      router.refresh();
    } catch {
      setError("Unable to register vendor. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-primary-navy">Register as vendor</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Create a construction vendor account. Admin approval is required before
        you appear in Seek a vendor.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {(
          [
            ["full_name", "Owner full name", "text"],
            ["email", "Email", "email"],
            ["phone", "Phone", "tel"],
            ["password", "Password", "password"],
            ["company_name", "Company name", "text"],
          ] as const
        ).map(([key, label, type]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type={type}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required
              className="h-11"
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label htmlFor="bio">Company bio</Label>
          <textarea
            id="bio"
            className="min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            required
            minLength={10}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="service_areas">Service areas (comma-separated)</Label>
          <Input
            id="service_areas"
            value={form.service_areas}
            onChange={(e) =>
              setForm((f) => ({ ...f, service_areas: e.target.value }))
            }
            required
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="years_experience">Years experience</Label>
          <Input
            id="years_experience"
            type="number"
            min={0}
            value={form.years_experience}
            onChange={(e) =>
              setForm((f) => ({ ...f, years_experience: e.target.value }))
            }
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
          {loading ? "Submitting…" : "Submit for approval"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary-teal">
          Login
        </Link>
      </p>
    </div>
  );
}
