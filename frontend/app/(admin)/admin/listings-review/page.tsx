"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/utils";

export default function ListingsReviewPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/listings-review");
      const json = await res.json();
      return json.data?.listings ?? [];
    },
  });

  async function act(listingId: string, action: "approve" | "reject") {
    await fetch("/api/admin/listings-review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        listingId,
        action,
        review_notes: action === "reject" ? "Documents incomplete" : undefined,
      }),
    });
    await qc.invalidateQueries({ queryKey: ["admin-listings"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-navy">Listings review</h1>
      <div className="space-y-3">
        {(data ?? []).map(
          (l: {
            id: string;
            plot_number: string;
            asking_price: number;
            status: string;
          }) => (
            <div
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div>
                <p className="font-semibold">{l.plot_number}</p>
                <p className="text-sm tabular-nums text-text-secondary">
                  {formatPkr(l.asking_price)} · {l.status}
                </p>
              </div>
              {l.status === "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void act(l.id, "approve")}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void act(l.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          ),
        )}
        {!data?.length ? (
          <p className="text-sm text-text-secondary">No listings to review.</p>
        ) : null}
      </div>
    </div>
  );
}
