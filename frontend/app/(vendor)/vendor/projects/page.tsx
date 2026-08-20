"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { StarRating } from "@/components/vendor/star-rating";

export default function VendorProjectsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["vendor-projects"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/projects", { credentials: "include" });
      const json = await res.json();
      return json.data?.projects ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (payload: {
      project_id: string;
      status: "active" | "completed" | "cancelled";
    }) => {
      const res = await fetch("/api/vendors/projects", {
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
      void qc.invalidateQueries({ queryKey: ["vendor-projects"] });
      void qc.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-text-secondary">Loading projects…</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary-navy">Projects</h2>
      {projects.map(
        (p: {
          id: string;
          title: string;
          notes: string;
          status: string;
          vendor?: {
            name: string;
            rating_avg: number;
            rating_count: number;
            houses_completed: number;
          } | null;
        }) => (
          <div key={p.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-primary-navy">{p.title}</h3>
              <Badge
                variant={p.status === "completed" ? "available" : "muted"}
              >
                {p.status}
              </Badge>
            </div>
            {p.vendor ? (
              <div className="mt-1">
                <p className="text-sm text-text-secondary">{p.vendor.name}</p>
                <StarRating
                  value={p.vendor.rating_avg}
                  count={p.vendor.rating_count}
                  houses={p.vendor.houses_completed}
                />
              </div>
            ) : null}
            <p className="mt-2 text-sm text-text-secondary">{p.notes}</p>
            {user?.role === "vendor" && p.status === "active" ? (
              <Button
                className="mt-3"
                size="sm"
                disabled={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate({
                    project_id: p.id,
                    status: "completed",
                  })
                }
              >
                Mark completed
              </Button>
            ) : null}
          </div>
        ),
      )}
      {!projects.length ? (
        <p className="text-sm text-text-secondary">No projects yet.</p>
      ) : null}
    </div>
  );
}
