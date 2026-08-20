"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/vendor/star-rating";

type Vendor = {
  id: string;
  name: string;
  bio: string;
  service_areas: string[];
  years_experience: number;
  houses_completed: number;
  rating_avg: number;
  rating_count: number;
};

function SeekVendorInner() {
  const params = useSearchParams();
  const plotId = params.get("plotId");
  const ownershipId = params.get("ownershipId");
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<"rating" | "houses">("rating");
  const [messageByVendor, setMessageByVendor] = useState<Record<string, string>>(
    {},
  );
  const [feedback, setFeedback] = useState("");

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors", sort],
    queryFn: async () => {
      const res = await fetch(`/api/vendors?sort=${sort}`, {
        credentials: "include",
      });
      const json = await res.json();
      return (json.data?.vendors ?? []) as Vendor[];
    },
  });

  const hire = useMutation({
    mutationFn: async (vendorId: string) => {
      const res = await fetch("/api/vendors/hire-requests", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          plot_id: plotId,
          ownership_id: ownershipId,
          message:
            messageByVendor[vendorId]?.trim() ||
            "I would like to hire your team for my CSC plot construction.",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Request failed");
      return json.data;
    },
    onSuccess: () => {
      setFeedback("Hire request sent. The vendor will respond soon.");
      void queryClient.invalidateQueries({ queryKey: ["hire-requests"] });
    },
    onError: (err: Error) => setFeedback(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-primary-navy">
            Seek a vendor
          </h1>
          <p className="text-sm text-text-secondary">
            Browse approved construction vendors by rating and houses completed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={sort === "rating" ? "default" : "outline"}
            onClick={() => setSort("rating")}
          >
            Top rated
          </Button>
          <Button
            size="sm"
            variant={sort === "houses" ? "default" : "outline"}
            onClick={() => setSort("houses")}
          >
            Most houses
          </Button>
        </div>
      </div>

      {feedback ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-text-secondary">
          {feedback}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading vendors…</p>
      ) : (
        <div className="space-y-4">
          {vendors.map((v) => (
            <div key={v.id} className="rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-primary-navy">
                    {v.name}
                  </h2>
                  <StarRating
                    value={v.rating_avg}
                    count={v.rating_count}
                    houses={v.houses_completed}
                  />
                  <p className="mt-2 text-sm text-text-secondary">{v.bio}</p>
                  <p className="mt-2 text-xs text-text-secondary">
                    {v.years_experience} years ·{" "}
                    {v.service_areas.join(" · ") || "CSC"}
                  </p>
                </div>
              </div>
              <textarea
                className="mt-4 min-h-[72px] w-full rounded-md border border-input px-3 py-2 text-sm"
                placeholder="Message to vendor"
                value={messageByVendor[v.id] ?? ""}
                onChange={(e) =>
                  setMessageByVendor((m) => ({ ...m, [v.id]: e.target.value }))
                }
              />
              <Button
                className="mt-3"
                disabled={hire.isPending}
                onClick={() => hire.mutate(v.id)}
              >
                Request hire
              </Button>
            </div>
          ))}
          {!vendors.length ? (
            <p className="text-sm text-text-secondary">
              No approved vendors yet.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function SeekVendorPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-secondary">Loading…</p>}>
      <SeekVendorInner />
    </Suspense>
  );
}
