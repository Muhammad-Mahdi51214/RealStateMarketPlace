"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function SalesConfirmationPage() {
  const qc = useQueryClient();
  const { data, error, refetch } = useQuery({
    queryKey: ["admin-sales"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sales-confirmation");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Forbidden");
      return json.data?.reservations ?? [];
    },
  });

  async function confirm(reservationId: string) {
    const res = await fetch("/api/admin/sales-confirmation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });
    const json = await res.json();
    if (!json.success) {
      alert(json.error?.message ?? "Confirm failed");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["admin-sales"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-navy">Sale confirmation</h1>
      <p className="text-sm text-text-secondary">
        Super Admin only — final authority to move under_verification → sold.
      </p>
      {error ? (
        <p className="text-sm text-alert-warning-text">
          {(error as Error).message}. Sign in as admin@csc.demo
        </p>
      ) : null}
      <div className="space-y-3">
        {(data ?? []).map((r: { id: string; plot_id: string; status: string }) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div>
              <p className="font-semibold">Reservation {r.id.slice(0, 8)}</p>
              <p className="text-sm text-text-secondary">{r.status}</p>
            </div>
            <Button size="sm" onClick={() => void confirm(r.id)}>
              Confirm sale
            </Button>
          </div>
        ))}
        {!data?.length && !error ? (
          <p className="text-sm text-text-secondary">
            No reservations awaiting final confirmation.{" "}
            <button type="button" className="text-primary-teal" onClick={() => void refetch()}>
              Refresh
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}
