"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/utils";

type Pipeline =
  | "awaiting_docs"
  | "docs_pending"
  | "docs_submitted"
  | "under_verification"
  | "sold";

export default function AdminPaymentVerifiedPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | Pipeline>("all");
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-verified"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payment-verified");
      const json = await res.json();
      return (json.data?.items ?? []) as Array<{
        reservation: { id: string; status: string; plot_id: string };
        plot: {
          plot_number: string;
          payment_verified?: boolean;
          psid?: string | null;
          is_available?: boolean;
        } | null;
        transaction: {
          gateway_ref: string;
          amount: number;
          psid: string | null;
          status: string;
          created_at: string;
        } | null;
        customer: { full_name: string; email: string; phone: string } | null;
        docs: { total: number; pending: number; verified: number };
        pipeline: Pipeline;
      }>;
    },
  });

  const rows = (data ?? []).filter(
    (row) => filter === "all" || row.pipeline === filter,
  );

  async function markPaid(gatewayRef: string) {
    setMessage("");
    const res = await fetch("/api/admin/payment-verified", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ gatewayRef, action: "mark_paid" }),
    });
    const json = await res.json();
    setMessage(
      json.success ? "PSID marked paid" : json.error?.message ?? "Failed",
    );
    await qc.invalidateQueries({ queryKey: ["admin-payment-verified"] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-primary-navy">
          Payment verified
        </h1>
        <p className="text-sm text-text-secondary">
          Plots with successful KuickPay token payment — next step is document
          verification and sale confirmation.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["awaiting_docs", "Awaiting docs"],
            ["docs_pending", "Docs pending"],
            ["under_verification", "Under verification"],
            ["sold", "Confirmed / sold"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === id
                ? "bg-[#E8F2FF] text-primary-navy ring-1 ring-[#B7D4FF]"
                : "bg-slate-50 text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : null}

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.reservation.id}
            className="rounded-xl border border-border p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-primary-navy">
                  {row.plot?.plot_number ?? row.reservation.plot_id}
                </p>
                <p className="text-sm text-text-secondary">
                  {row.customer?.full_name} · {row.customer?.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="available">payment verified</Badge>
                  <Badge variant="muted" className="capitalize">
                    {row.reservation.status.replaceAll("_", " ")}
                  </Badge>
                  <Badge variant="muted">{row.pipeline.replaceAll("_", " ")}</Badge>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-mono text-xs">
                  PSID: {row.transaction?.psid ?? row.plot?.psid ?? "—"}
                </p>
                <p className="tabular-nums">
                  {row.transaction
                    ? formatPkr(row.transaction.amount)
                    : "—"}
                </p>
                <p className="text-xs text-text-secondary">
                  Docs {row.docs.verified}/{row.docs.total} verified
                  {row.docs.pending ? ` · ${row.docs.pending} pending` : ""}
                </p>
              </div>
            </div>
            {row.transaction?.status === "initiated" ? (
              <Button
                size="sm"
                className="mt-3"
                onClick={() => markPaid(row.transaction!.gateway_ref)}
              >
                Mark PSID paid
              </Button>
            ) : null}
          </div>
        ))}
        {!rows.length && !isLoading ? (
          <p className="text-sm text-text-secondary">
            No payment-verified plots yet.
          </p>
        ) : null}
      </div>
      {message ? <p className="text-sm text-primary-teal">{message}</p> : null}
    </div>
  );
}
