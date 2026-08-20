"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    cnic_number: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name,
        phone: user.phone,
        cnic_number: user.cnic_number ?? "",
      });
    }
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        cnic_number: form.cnic_number || null,
      }),
    });
    const json = await res.json();
    setMessage(json.success ? "Profile updated" : json.error?.message);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-primary-navy">Profile</h1>
        <p className="text-sm text-text-secondary">
          Personal details and KYC status
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">KYC status</span>
        <Badge variant="verified" className="capitalize">
          {user?.kyc_status}
        </Badge>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border p-5">
        <div>
          <Label>Full name</Label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <Label>CNIC number</Label>
          <Input
            value={form.cnic_number}
            onChange={(e) => setForm({ ...form, cnic_number: e.target.value })}
            placeholder="XXXXX-XXXXXXX-X"
          />
        </div>
        <Button type="submit">Save profile</Button>
        {message ? <p className="text-sm text-primary-teal">{message}</p> : null}
      </form>
    </div>
  );
}
