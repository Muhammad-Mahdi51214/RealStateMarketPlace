"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VendorRequestsPage() {
  const qc = useQueryClient();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["hire-requests"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/hire-requests", {
        credentials: "include",
      });
      const json = await res.json();
      return json.data?.requests ?? [];
    },
  });

  const respond = useMutation({
    mutationFn: async (payload: {
      request_id: string;
      action: "accept" | "decline";
    }) => {
      const res = await fetch("/api/vendors/hire-requests", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
      return json.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["hire-requests"] });
      void qc.invalidateQueries({ queryKey: ["vendor-projects"] });
      void qc.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-text-secondary">Loading requests…</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary-navy">Hire requests</h2>
      {requests.map(
        (r: {
          id: string;
          status: string;
          message: string;
          budget_note: string | null;
          customer_name: string | null;
          created_at: string;
        }) => (
          <div key={r.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{r.customer_name ?? "Customer"}</p>
              <Badge variant="muted">{r.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-text-secondary">{r.message}</p>
            {r.budget_note ? (
              <p className="mt-1 text-xs text-text-secondary">
                Budget: {r.budget_note}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-text-secondary">
              {new Date(r.created_at).toLocaleString()}
            </p>
            {r.status === "pending" ? (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={respond.isPending}
                  onClick={() =>
                    respond.mutate({ request_id: r.id, action: "accept" })
                  }
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={respond.isPending}
                  onClick={() =>
                    respond.mutate({ request_id: r.id, action: "decline" })
                  }
                >
                  Decline
                </Button>
              </div>
            ) : null}
          </div>
        ),
      )}
      {!requests.length ? (
        <p className="text-sm text-text-secondary">No hire requests yet.</p>
      ) : null}
    </div>
  );
}
