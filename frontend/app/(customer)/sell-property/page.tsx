"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/utils";

export default function SellPropertyPage() {
  const { data } = useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      const res = await fetch("/api/listings");
      const json = await res.json();
      return json.data?.listings ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-primary-navy">
            Sell property
          </h1>
          <p className="text-sm text-text-secondary">
            Submit a resale listing for admin document review before it goes
            public.
          </p>
        </div>
        <Button asChild>
          <Link href="/sell-property/new">New submission</Link>
        </Button>
      </div>
      <div className="space-y-3">
        {(data ?? []).map(
          (l: {
            id: string;
            plot_number: string;
            asking_price: number;
            status: string;
            review_notes: string | null;
          }) => (
            <div
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div>
                <p className="font-semibold">{l.plot_number}</p>
                <p className="text-sm tabular-nums text-text-secondary">
                  {formatPkr(l.asking_price)}
                </p>
                {l.review_notes ? (
                  <p className="mt-1 text-xs text-alert-warning-text">
                    {l.review_notes}
                  </p>
                ) : null}
              </div>
              <Badge variant="muted" className="capitalize">
                {l.status}
              </Badge>
            </div>
          ),
        )}
        {!data?.length ? (
          <p className="text-sm text-text-secondary">No submissions yet.</p>
        ) : null}
      </div>
    </div>
  );
}
