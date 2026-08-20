"use client";

import { useQuery } from "@tanstack/react-query";

export default function AdminDashboardPage() {
  const stats = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [plots, reservations, listings, txs, logs] = await Promise.all([
        fetch("/api/admin/inventory").then((r) => r.json()),
        fetch("/api/admin/reservations").then((r) => r.json()),
        fetch("/api/admin/listings-review").then((r) => r.json()),
        fetch("/api/admin/payments").then((r) => r.json()),
        fetch("/api/admin/audit-log").then((r) => r.json()),
      ]);
      const plotList = plots.data?.plots ?? [];
      return {
        totalPlots: plotList.length,
        available: plotList.filter((p: { status: string }) => p.status === "available").length,
        reserved: plotList.filter((p: { status: string }) => p.status === "reserved").length,
        sold: plotList.filter((p: { status: string }) => p.status === "sold").length,
        reservations: reservations.data?.reservations?.length ?? 0,
        pendingListings:
          listings.data?.listings?.filter((l: { status: string }) => l.status === "pending")
            .length ?? 0,
        payments: txs.data?.transactions?.length ?? 0,
        audit: logs.data?.logs?.length ?? 0,
      };
    },
  });

  const s = stats.data;
  const cards = [
    ["Total plots", s?.totalPlots],
    ["Available", s?.available],
    ["Reserved", s?.reserved],
    ["Sold", s?.sold],
    ["Reservations", s?.reservations],
    ["Pending listings", s?.pendingListings],
    ["Payments", s?.payments],
    ["Audit events", s?.audit],
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-navy">Admin dashboard</h1>
        <p className="text-sm text-text-secondary">
          Inventory, funnel, and oversight snapshot
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-bg-muted p-4">
            <p className="text-xs uppercase text-text-secondary">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-primary-navy">
              {value ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
