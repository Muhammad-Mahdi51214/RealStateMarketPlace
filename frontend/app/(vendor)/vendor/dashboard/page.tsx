"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

type VendorDashboardData = {
  vendor: {
    name: string;
    status: string;
  } | null;
  open_requests: number;
  active_projects: number;
  team_size: number;
  rating_avg: number;
  rating_count: number;
  houses_completed: number;
};

const emptyDashboard: VendorDashboardData = {
  vendor: null,
  open_requests: 0,
  active_projects: 0,
  team_size: 0,
  rating_avg: 0,
  rating_count: 0,
  houses_completed: 0,
};

export default function VendorDashboardPage() {
  const { data = emptyDashboard, isLoading, isError, error } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: async (): Promise<VendorDashboardData> => {
      const res = await fetch("/api/vendors/dashboard", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? "Failed to load dashboard");
      }
      // TanStack Query forbids returning undefined — always return an object
      return (json.data as VendorDashboardData | undefined) ?? emptyDashboard;
    },
  });

  if (isLoading) {
    return <p className="text-sm text-text-secondary">Loading dashboard…</p>;
  }

  if (isError) {
    return (
      <p className="rounded-lg bg-alert-warning-bg px-3 py-2 text-sm text-alert-warning-text">
        {error instanceof Error ? error.message : "Unable to load dashboard"}
      </p>
    );
  }

  const cards = [
    { label: "Open requests", value: data.open_requests ?? 0 },
    { label: "Active projects", value: data.active_projects ?? 0 },
    { label: "Team size", value: data.team_size ?? 0 },
    {
      label: "Rating",
      value: `${Number(data.rating_avg ?? 0).toFixed(1)} ★ (${data.rating_count ?? 0})`,
    },
    { label: "Houses completed", value: data.houses_completed ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold text-primary-navy">
          {data.vendor?.name ?? "Your vendor org"}
        </h2>
        {data.vendor?.status ? (
          <Badge
            variant={data.vendor.status === "approved" ? "available" : "muted"}
          >
            {data.vendor.status}
          </Badge>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {c.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-primary-navy">
              {c.value}
            </p>
          </div>
        ))}
      </div>
      {data.vendor?.status === "pending" ? (
        <p className="rounded-lg bg-alert-warning-bg px-3 py-2 text-sm text-alert-warning-text">
          Your vendor profile is pending admin approval. You can explore the
          portal, but hire requests stay locked until approved.
        </p>
      ) : null}
    </div>
  );
}
