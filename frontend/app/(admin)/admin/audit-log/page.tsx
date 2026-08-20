"use client";

import { useQuery } from "@tanstack/react-query";

export default function AuditLogPage() {
  const { data } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit-log");
      const json = await res.json();
      return json.data?.logs ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-navy">Audit log</h1>
      <div className="space-y-2">
        {(data ?? []).map(
          (l: {
            id: string;
            action: string;
            entity: string;
            entity_id: string;
            created_at: string;
          }) => (
            <div key={l.id} className="rounded-lg border border-border px-4 py-3 text-sm">
              <p className="font-semibold">{l.action}</p>
              <p className="text-text-secondary">
                {l.entity} · {l.entity_id.slice(0, 8)} ·{" "}
                {new Date(l.created_at).toLocaleString()}
              </p>
            </div>
          ),
        )}
        {!data?.length ? (
          <p className="text-sm text-text-secondary">No audit events yet.</p>
        ) : null}
      </div>
    </div>
  );
}
