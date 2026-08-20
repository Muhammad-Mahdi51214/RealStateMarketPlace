"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/vendor/star-rating";
import { formatPkr } from "@/lib/utils";

export default function MyPropertyPage() {
  const qc = useQueryClient();
  const [reviewDraft, setReviewDraft] = useState<
    Record<string, { stars: number; remarks: string }>
  >({});

  const { data } = useQuery({
    queryKey: ["my-property"],
    queryFn: async () => {
      const res = await fetch("/api/my-property");
      const json = await res.json();
      return json.data?.ownership ?? [];
    },
  });

  const { data: hired = [] } = useQuery({
    queryKey: ["hired-panel"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/projects?panel=hired", {
        credentials: "include",
      });
      const json = await res.json();
      return json.data?.hired ?? [];
    },
  });

  const submitReview = useMutation({
    mutationFn: async (payload: {
      project_id: string;
      stars: number;
      remarks: string;
    }) => {
      const res = await fetch("/api/vendors/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
      return json.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["hired-panel"] });
      void qc.invalidateQueries({ queryKey: ["vendors"] });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-primary-navy">My Property</h1>
        <p className="text-sm text-text-secondary">
          Confirmed ownership records after admin sale confirmation.
        </p>
      </div>
      <div className="space-y-4">
        {(data ?? []).map(
          (o: {
            id: string;
            plot_id: string;
            confirmed_at: string;
            plot?: {
              plot_number: string;
              size: string;
              lump_sum_price: number;
              phase?: { name: string };
            };
            documents: { file_name: string; status: string }[];
          }) => (
            <div key={o.id} className="rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {o.plot?.plot_number}
                </h2>
                <Badge variant="available">Owned</Badge>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {o.plot?.phase?.name} · {o.plot?.size}
              </p>
              <p className="mt-2 tabular-nums font-semibold text-primary-navy">
                {formatPkr(o.plot?.lump_sum_price ?? 0)}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                Confirmed {new Date(o.confirmed_at).toLocaleString()}
              </p>
              <div className="mt-4">
                <p className="text-sm font-medium">Documents</p>
                <ul className="mt-1 space-y-1 text-sm text-text-secondary">
                  {o.documents.map((d, i) => (
                    <li key={i}>
                      {d.file_name} · {d.status}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Badge variant="muted">Reserved</Badge>
                <span>→</span>
                <Badge variant="muted">Verification</Badge>
                <span>→</span>
                <Badge variant="available">Confirmed</Badge>
              </div>
              <Button asChild className="mt-4" size="sm">
                <Link
                  href={`/seek-vendor?plotId=${o.plot_id}&ownershipId=${o.id}`}
                >
                  Seek a vendor
                </Link>
              </Button>
            </div>
          ),
        )}
        {!data?.length ? (
          <p className="text-sm text-text-secondary">
            No confirmed ownership yet. Complete reservation → payment → docs →
            admin confirmation.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-primary-navy">
            Hired vendor
          </h2>
          <p className="text-sm text-text-secondary">
            Project status, task summary, and materials logged by your vendor.
          </p>
        </div>
        {hired.map(
          (h: {
            project: {
              id: string;
              title: string;
              status: string;
              notes: string;
            };
            vendor: {
              name: string;
              rating_avg: number;
              rating_count: number;
              houses_completed: number;
            } | null;
            tasks_summary: {
              total: number;
              done: number;
              in_progress: number;
            };
            materials: {
              id: string;
              name: string;
              qty: number;
              unit: string;
              cost: number;
            }[];
            review: { stars: number; remarks: string } | null;
          }) => (
            <div key={h.project.id} className="rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{h.project.title}</h3>
                <Badge
                  variant={
                    h.project.status === "completed" ? "available" : "muted"
                  }
                >
                  {h.project.status}
                </Badge>
              </div>
              {h.vendor ? (
                <div className="mt-2">
                  <p className="text-sm font-medium">{h.vendor.name}</p>
                  <StarRating
                    value={h.vendor.rating_avg}
                    count={h.vendor.rating_count}
                    houses={h.vendor.houses_completed}
                  />
                </div>
              ) : null}
              <p className="mt-2 text-sm text-text-secondary">
                Tasks: {h.tasks_summary.done}/{h.tasks_summary.total} done ·{" "}
                {h.tasks_summary.in_progress} in progress
              </p>
              <div className="mt-3">
                <p className="text-sm font-medium">Project materials</p>
                <ul className="mt-1 space-y-1 text-sm text-text-secondary">
                  {h.materials.map((m) => (
                    <li key={m.id}>
                      {m.name} · {m.qty} {m.unit} · {formatPkr(m.cost)}
                    </li>
                  ))}
                  {!h.materials.length ? <li>No materials logged yet.</li> : null}
                </ul>
              </div>
              {h.project.status === "completed" ? (
                h.review ? (
                  <p className="mt-3 text-sm text-text-secondary">
                    Your review: {h.review.stars}★ — {h.review.remarks}
                  </p>
                ) : (
                  <div className="mt-4 space-y-2 rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">Leave a review</p>
                    <select
                      className="h-9 rounded-md border border-input px-2 text-sm"
                      value={reviewDraft[h.project.id]?.stars ?? 5}
                      onChange={(e) =>
                        setReviewDraft((d) => ({
                          ...d,
                          [h.project.id]: {
                            stars: Number(e.target.value),
                            remarks: d[h.project.id]?.remarks ?? "",
                          },
                        }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((s) => (
                        <option key={s} value={s}>
                          {s} stars
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="min-h-[72px] w-full rounded-md border border-input px-3 py-2 text-sm"
                      placeholder="Remarks"
                      value={reviewDraft[h.project.id]?.remarks ?? ""}
                      onChange={(e) =>
                        setReviewDraft((d) => ({
                          ...d,
                          [h.project.id]: {
                            stars: d[h.project.id]?.stars ?? 5,
                            remarks: e.target.value,
                          },
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      disabled={submitReview.isPending}
                      onClick={() =>
                        submitReview.mutate({
                          project_id: h.project.id,
                          stars: reviewDraft[h.project.id]?.stars ?? 5,
                          remarks:
                            reviewDraft[h.project.id]?.remarks?.trim() ||
                            "Great work",
                        })
                      }
                    >
                      Submit review
                    </Button>
                  </div>
                )
              ) : null}
            </div>
          ),
        )}
        {!hired.length ? (
          <p className="text-sm text-text-secondary">
            No hired vendor yet. Use Seek a vendor after ownership is confirmed.
          </p>
        ) : null}
      </div>
    </div>
  );
}
