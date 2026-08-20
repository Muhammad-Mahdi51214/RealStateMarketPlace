"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      return json.data?.users ?? [];
    },
  });

  async function toggle(userId: string, suspended: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, suspended }),
    });
    await qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-navy">Users</h1>
      <div className="space-y-3">
        {(data ?? []).map(
          (u: {
            id: string;
            full_name: string;
            email: string;
            role: string;
            suspended: boolean;
          }) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div>
                <p className="font-semibold">{u.full_name}</p>
                <p className="text-sm text-text-secondary">
                  {u.email} · {u.role}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void toggle(u.id, !u.suspended)}
              >
                {u.suspended ? "Unsuspend" : "Suspend"}
              </Button>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
