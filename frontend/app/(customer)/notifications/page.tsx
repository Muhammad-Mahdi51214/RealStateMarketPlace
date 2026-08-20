"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      return json.data?.notifications ?? [];
    },
  });

  async function markRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    await qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-primary-navy">Notifications</h1>
        <Button size="sm" variant="outline" onClick={markRead}>
          Mark all read
        </Button>
      </div>
      <div className="space-y-3">
        {(data ?? []).map(
          (n: {
            id: string;
            title: string;
            message: string;
            read: boolean;
            created_at: string;
          }) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 ${
                n.read ? "border-border bg-bg-base" : "border-primary-teal/40 bg-bg-muted"
              }`}
            >
              <p className="font-semibold text-text-primary">{n.title}</p>
              <p className="mt-1 text-sm text-text-secondary">{n.message}</p>
              <p className="mt-2 text-xs text-text-secondary">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ),
        )}
        {!data?.length ? (
          <p className="text-sm text-text-secondary">No notifications yet.</p>
        ) : null}
      </div>
    </div>
  );
}
