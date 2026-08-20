"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/vendor/star-rating";
import { formatPkr } from "@/lib/utils";

export default function AdminVendorsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendors", { credentials: "include" });
      const json = await res.json();
      return json.data as {
        vendors: {
          id: string;
          name: string;
          status: string;
          bio: string;
          rating_avg: number;
          rating_count: number;
          houses_completed: number;
        }[];
        catalog: {
          id: string;
          name: string;
          sku: string;
          unit_price: number;
          active: boolean;
          category: string;
        }[];
      };
    },
  });

  const setStatus = useMutation({
    mutationFn: async (payload: {
      vendor_id: string;
      status: "approved" | "suspended" | "pending";
    }) => {
      const res = await fetch("/api/admin/vendors", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
      return json.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-vendors"] }),
  });

  const moderateCatalog = useMutation({
    mutationFn: async (payload: { catalog_id: string; active: boolean }) => {
      const res = await fetch("/api/materials", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
      return json.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-vendors"] }),
  });

  if (isLoading) {
    return <p className="text-sm text-text-secondary">Loading vendors…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary-navy">Vendors</h1>
        <p className="text-sm text-text-secondary">
          Approve or suspend vendor orgs. Moderate materials catalog visibility.
        </p>
      </div>

      <div className="space-y-3">
        {(data?.vendors ?? []).map((v) => (
          <div key={v.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{v.name}</h2>
              <Badge variant={v.status === "approved" ? "available" : "muted"}>
                {v.status}
              </Badge>
            </div>
            <StarRating
              value={v.rating_avg}
              count={v.rating_count}
              houses={v.houses_completed}
            />
            <p className="mt-2 text-sm text-text-secondary">{v.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={setStatus.isPending || v.status === "approved"}
                onClick={() =>
                  setStatus.mutate({ vendor_id: v.id, status: "approved" })
                }
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={setStatus.isPending || v.status === "suspended"}
                onClick={() =>
                  setStatus.mutate({ vendor_id: v.id, status: "suspended" })
                }
              >
                Suspend
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-primary-navy">
          Materials catalog
        </h2>
        {(data?.catalog ?? []).map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
          >
            <div>
              <p className="font-medium">
                {c.name}{" "}
                <span className="text-xs text-text-secondary">({c.sku})</span>
              </p>
              <p className="text-sm text-text-secondary">
                {c.category} · {formatPkr(c.unit_price)} ·{" "}
                {c.active ? "active" : "hidden"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={moderateCatalog.isPending}
              onClick={() =>
                moderateCatalog.mutate({
                  catalog_id: c.id,
                  active: !c.active,
                })
              }
            >
              {c.active ? "Hide" : "Show"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
