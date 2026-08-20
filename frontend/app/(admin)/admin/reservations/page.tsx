"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function AdminReservationsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reservations");
      const json = await res.json();
      return json.data?.reservations ?? [];
    },
  });

  async function cancel(reservationId: string) {
    await fetch("/api/admin/reservations", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reservationId, action: "cancel" }),
    });
    await qc.invalidateQueries({ queryKey: ["admin-reservations"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-navy">Reservations</h1>
      <div className="space-y-3">
        {(data ?? []).map(
          (r: {
            id: string;
            status: string;
            expires_at: string;
            plot?: { plot_number: string };
          }) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div>
                <p className="font-semibold">
                  {r.plot?.plot_number ?? "Plot"} · {r.status}
                </p>
                <p className="text-xs text-text-secondary">
                  Expires {new Date(r.expires_at).toLocaleString()}
                </p>
              </div>
              {["pending_payment", "reserved"].includes(r.status) ? (
                <Button size="sm" variant="outline" onClick={() => void cancel(r.id)}>
                  Cancel / release
                </Button>
              ) : null}
            </div>
          ),
        )}
        {!data?.length ? (
          <p className="text-sm text-text-secondary">No reservations yet.</p>
        ) : null}
      </div>
    </div>
  );
}
