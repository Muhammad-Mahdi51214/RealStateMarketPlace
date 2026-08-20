"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { useInventoryStore } from "@/lib/hooks/use-inventory-store";
import { formatPkr } from "@/lib/utils";
import type { PlotWithRelations } from "@shared/types/database.types";
import { ShieldCheck, ShoppingBag, X } from "lucide-react";

interface PlotDetailSidebarProps {
  plot: PlotWithRelations | null;
  onClose: () => void;
}

const statusVariant = {
  available: "available",
  reserved: "reserved",
  sold: "sold",
  under_verification: "muted",
} as const;

export function PlotDetailSidebar({ plot, onClose }: PlotDetailSidebarProps) {
  const { user } = useAuth();
  const selectPlot = useInventoryStore((s) => s.selectPlot);
  const countdown = useCountdown(
    plot?.status === "reserved" ? plot.reservation_expires_at : null,
  );

  function clearSelection() {
    selectPlot(null);
  }

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-border bg-bg-base shadow-2xl sm:w-[380px]">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-green">
            Selected plot
          </p>
          {plot ? (
            <>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant={
                    plot.type === "residential" ? "residential" : "commercial"
                  }
                >
                  {plot.type === "residential" ? "Residential" : "Commercial"}
                </Badge>
                <Badge variant={statusVariant[plot.status]}>
                  {plot.status.replace("_", " ")}
                </Badge>
              </div>
              <h2 className="mt-2 text-[22px] font-semibold text-text-primary">
                {plot.plot_number}
              </h2>
              <p className="text-sm text-text-secondary">
                {plot.phase?.name ?? "Phase"} · Zone {plot.zone ?? "—"} ·{" "}
                {plot.street ?? "—"}
              </p>
              {plot.status === "reserved" && plot.reservation_expires_at ? (
                <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-[#D97706]">
                  {countdown.reservedLabel}
                </p>
              ) : null}
            </>
          ) : (
            <h2 className="mt-2 text-lg font-semibold text-text-primary">
              Your selection
            </h2>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-text-secondary hover:bg-bg-muted"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {!plot ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-text-secondary">
          <ShoppingBag className="h-10 w-10 text-primary-navy/40" />
          <p>
            Click a plot polygon on the map, or keep browsing. This panel stays
            closed until you select a project.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory">Browse inventory</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-text-secondary">Size</dt>
                <dd className="font-medium tabular-nums">{plot.size}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Status</dt>
                <dd className="font-medium capitalize">
                  {plot.status.replace("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">Lump sum</dt>
                <dd className="font-semibold tabular-nums text-primary-navy">
                  {formatPkr(plot.lump_sum_price)}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">Token amount</dt>
                <dd className="font-semibold tabular-nums text-accent-green">
                  {formatPkr(plot.token_amount)}
                </dd>
              </div>
            </dl>

            <div className="rounded-lg bg-alert-warning-bg px-3 py-2 text-xs text-alert-warning-text">
              Prices are exclusive of charges &amp; government taxes. Final
              ownership confirmation is performed by the society Admin Portal.
            </div>

            <div className="flex flex-wrap gap-2">
              {plot.rda_verified ? (
                <Badge variant="verified" className="gap-1">
                  <ShieldCheck className="h-3 w-3" /> RDA Verified
                </Badge>
              ) : null}
              {plot.admin_verified ? (
                <Badge variant="verified" className="gap-1">
                  <ShieldCheck className="h-3 w-3" /> Documents Verified by Admin
                </Badge>
              ) : null}
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Payment plans
              </h3>
              <ul className="mt-2 space-y-2">
                {(plot.payment_plans ?? []).map((plan) => (
                  <li
                    key={plan.id}
                    className="rounded-lg border border-border bg-bg-muted px-3 py-2 text-sm"
                  >
                    {plan.plan_type}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-2 border-t border-border px-4 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={clearSelection}
            >
              Clear Selection
            </Button>
            {plot.status !== "available" ? (
              <Button className="w-full" disabled>
                {plot.status === "reserved"
                  ? countdown.reservedLabel || "Reserved"
                  : "Not available"}
              </Button>
            ) : user ? (
              <Button asChild className="w-full">
                <Link href={`/buy-property/${plot.id}`}>Reserve plot</Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href={`/login?next=/buy-property/${plot.id}`}>
                  Login to reserve
                </Link>
              </Button>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
