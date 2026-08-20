"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/utils";

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inventory");
      const json = await res.json();
      return json.data?.plots ?? [];
    },
  });

  async function toggleVerified(plotId: string, admin_verified: boolean) {
    await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plotId, admin_verified }),
    });
    await qc.invalidateQueries({ queryKey: ["admin-inventory"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-navy">Inventory</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-text-secondary">
            <tr>
              <th className="px-2 py-2">Plot</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Price</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).slice(0, 40).map(
              (p: {
                id: string;
                plot_number: string;
                status: string;
                lump_sum_price: number;
                admin_verified: boolean;
              }) => (
                <tr key={p.id} className="border-b border-border/70">
                  <td className="px-2 py-2 font-medium">{p.plot_number}</td>
                  <td className="px-2 py-2 capitalize">
                    {p.status.replaceAll("_", " ")}
                  </td>
                  <td className="px-2 py-2 tabular-nums">
                    {formatPkr(p.lump_sum_price)}
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void toggleVerified(p.id, !p.admin_verified)
                      }
                    >
                      {p.admin_verified ? "Unverify" : "Verify docs"}
                    </Button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
