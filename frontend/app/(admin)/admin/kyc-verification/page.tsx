"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Doc = {
  id: string;
  file_name: string;
  file_url: string;
  type: string;
  status: string;
  reservation_id: string | null;
  viewed_at: string | null;
  viewed_by: string | null;
  verified_at: string | null;
};

export default function KycVerificationPage() {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<Doc | null>(null);
  const [error, setError] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-docs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/kyc-verification");
      const json = await res.json();
      return (json.data?.documents ?? []) as Doc[];
    },
  });

  async function act(documentId: string, action: "approve" | "reject" | "view") {
    setError("");
    const res = await fetch("/api/admin/kyc-verification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId, action }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error?.message ?? "Action failed");
      return;
    }
    if (action === "view") {
      const doc = json.data?.document as Doc;
      setPreview(doc);
    }
    await qc.invalidateQueries({ queryKey: ["admin-docs"] });
  }

  const pending = (data ?? []).filter((d) => d.status === "pending");
  const reviewed = (data ?? []).filter((d) => d.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary-navy">
          KYC / document verification
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          View each document first, then verify or reject. Final plot sale is
          confirmed separately by super admin after all required docs pass.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-alert-warning-bg px-3 py-2 text-sm text-alert-warning-text">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Awaiting review
        </h2>
        {pending.map((d) => {
          const viewed = Boolean(d.viewed_at);
          return (
            <div
              key={d.id}
              className="rounded-xl border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary-navy">{d.file_name}</p>
                  <p className="text-sm capitalize text-text-secondary">
                    {d.type.replaceAll("_", " ")} · {d.status}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {viewed
                      ? `Viewed ${new Date(d.viewed_at!).toLocaleString()}`
                      : "Not viewed yet — open before verify"}
                  </p>
                </div>
                <Badge variant={viewed ? "available" : "muted"}>
                  {viewed ? "Viewed" : "Needs view"}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void act(d.id, "view")}>
                  View document
                </Button>
                <Button
                  size="sm"
                  disabled={!viewed}
                  onClick={() => void act(d.id, "approve")}
                >
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!viewed}
                  onClick={() => void act(d.id, "reject")}
                >
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
        {!pending.length ? (
          <p className="text-sm text-text-secondary">No pending documents.</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Already reviewed
        </h2>
        {reviewed.map((d) => (
          <div
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
          >
            <div>
              <p className="font-semibold">{d.file_name}</p>
              <p className="text-sm capitalize text-text-secondary">
                {d.type.replaceAll("_", " ")} · {d.status}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void act(d.id, "view")}>
              Preview
            </Button>
          </div>
        ))}
        {!reviewed.length ? (
          <p className="text-sm text-text-secondary">No reviewed documents yet.</p>
        ) : null}
      </section>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-primary-navy">
              Document preview
            </h2>
            <p className="mt-2 text-sm capitalize text-text-secondary">
              {preview.type.replaceAll("_", " ")} · {preview.status}
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-border bg-slate-50 p-8 text-center">
              <p className="font-semibold text-primary-navy">{preview.file_name}</p>
              <p className="mt-2 text-xs text-text-secondary">{preview.file_url}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {preview.status === "pending" && preview.viewed_at ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      void act(preview.id, "approve");
                      setPreview(null);
                    }}
                  >
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void act(preview.id, "reject");
                      setPreview(null);
                    }}
                  >
                    Reject
                  </Button>
                </>
              ) : null}
              <Button variant="outline" onClick={() => setPreview(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
