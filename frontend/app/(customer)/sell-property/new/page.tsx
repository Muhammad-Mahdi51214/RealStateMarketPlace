"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";

export default function NewSellPropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    plot_number: "",
    size: "10 Marla",
    phase_name: "Phase 1",
    type: "residential",
    asking_price: "12000000",
    document_name: "ownership-proof.pdf",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        type: form.type as "residential" | "commercial",
        asking_price: Number(form.asking_price),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) {
      setError(json.error?.message ?? "Submit failed");
      return;
    }
    router.push("/sell-property");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-[28px] font-bold text-primary-navy">
        Submit plot for resale
      </h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border p-5">
        {(
          [
            ["plot_number", "Plot number"],
            ["size", "Size"],
            ["phase_name", "Phase"],
            ["asking_price", "Asking price (PKR)"],
            ["document_name", "Ownership document filename"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <Label>{label}</Label>
            <Input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
            />
          </div>
        ))}
        <div>
          <Label>Type</Label>
          <select
            className="flex h-10 w-full rounded-lg border border-border px-3 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        {error ? <p className="text-sm text-alert-warning-text">{error}</p> : null}
        <Button disabled={loading}>{loading ? "Submitting…" : "Submit for review"}</Button>
      </form>
    </div>
  );
}
