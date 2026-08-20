"use client";

import { useQuery } from "@tanstack/react-query";
import { formatPkr } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const { data } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payments");
      const json = await res.json();
      return json.data?.transactions ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-navy">Payments</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-text-secondary">
            <tr>
              <th className="px-2 py-2">Gateway ref</th>
              <th className="px-2 py-2">Amount</th>
              <th className="px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map(
              (t: {
                id: string;
                gateway_ref: string;
                amount: number;
                status: string;
              }) => (
                <tr key={t.id} className="border-b border-border/70">
                  <td className="px-2 py-2 font-mono text-xs">{t.gateway_ref}</td>
                  <td className="px-2 py-2 tabular-nums">{formatPkr(t.amount)}</td>
                  <td className="px-2 py-2 capitalize">{t.status}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
