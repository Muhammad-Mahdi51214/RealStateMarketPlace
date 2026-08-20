"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { formatPkr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/dashboard");
    }
  }, [authLoading, user, router]);

  const reservations = useQuery({
    queryKey: ["reservations"],
    enabled: Boolean(user),
    queryFn: async () => {
      const res = await fetch("/api/reservations", { credentials: "include" });
      const json = await res.json();
      return json.data?.reservations ?? [];
    },
  });
  const notifications = useQuery({
    queryKey: ["notifications"],
    enabled: Boolean(user),
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const json = await res.json();
      return json.data?.notifications ?? [];
    },
  });

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-secondary">
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-primary-navy">
            Welcome, {user.full_name}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Track reservations, notifications, and your CSC property journey.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/inventory">Browse inventory</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-bg-muted p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Reservations
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-primary-navy">
            {reservations.data?.length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-muted p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Unread alerts
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-primary-teal">
            {notifications.data?.filter((n: { read: boolean }) => !n.read)
              .length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-muted p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            KYC
          </p>
          <p className="mt-2 text-lg font-semibold capitalize text-primary-navy">
            {user.kyc_status?.replaceAll("_", " ") ?? "pending"}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-white p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-primary-navy">
            Active reservations
          </h2>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <Link href="/buy-property">Buy property</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {(reservations.data ?? []).slice(0, 5).map(
            (r: {
              id: string;
              status: string;
              token_amount_paid: number | null;
              plot?: { plot_number: string; token_amount: number; id: string };
            }) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-primary-navy">
                    {r.plot?.plot_number ?? "Plot"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Token {formatPkr(r.plot?.token_amount ?? 0)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted" className="capitalize">
                    {r.status.replaceAll("_", " ")}
                  </Badge>
                  <Button asChild size="sm">
                    <Link
                      href={`/buy-property/${r.plot?.id}?reservationId=${r.id}`}
                    >
                      Continue
                    </Link>
                  </Button>
                </div>
              </div>
            ),
          )}
          {!reservations.data?.length ? (
            <p className="text-sm text-text-secondary">
              No reservations yet. Reserve an available plot from inventory.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
