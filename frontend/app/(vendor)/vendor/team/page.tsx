"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/use-auth";

export default function VendorTeamPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "demo1234!",
    role: "worker" as "manager" | "worker",
  });
  const [error, setError] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["vendor-team"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/team", { credentials: "include" });
      const json = await res.json();
      return json.data?.members ?? [];
    },
  });

  const addMember = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vendors/team", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
      return json.data;
    },
    onSuccess: () => {
      setError("");
      setForm({
        full_name: "",
        email: "",
        phone: "",
        password: "demo1234!",
        role: "worker",
      });
      void qc.invalidateQueries({ queryKey: ["vendor-team"] });
      void qc.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading) {
    return <p className="text-sm text-text-secondary">Loading team…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary-navy">Team directory</h2>
      <div className="space-y-3">
        {members.map(
          (m: {
            id: string;
            full_name: string;
            email: string;
            phone: string;
            role: string;
            active: boolean;
          }) => (
            <div key={m.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{m.full_name}</p>
                <Badge variant="muted">{m.role}</Badge>
                {!m.active ? <Badge variant="muted">inactive</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {m.email} · {m.phone}
              </p>
            </div>
          ),
        )}
        {!members.length ? (
          <p className="text-sm text-text-secondary">No team members yet.</p>
        ) : null}
      </div>

      {user?.role === "vendor" ? (
        <form
          className="max-w-lg space-y-3 rounded-xl border border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            addMember.mutate();
          }}
        >
          <h3 className="font-semibold text-primary-navy">Add employee</h3>
          {(
            [
              ["full_name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["password", "Temp password"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                required
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="h-10 w-full rounded-md border border-input px-3 text-sm"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value as "manager" | "worker",
                }))
              }
            >
              <option value="worker">Worker</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          {error ? (
            <p className="text-sm text-alert-warning-text">{error}</p>
          ) : null}
          <Button disabled={addMember.isPending}>Add to team</Button>
        </form>
      ) : null}
    </div>
  );
}
