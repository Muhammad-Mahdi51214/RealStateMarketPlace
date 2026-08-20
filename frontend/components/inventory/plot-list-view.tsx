"use client";

import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPlotCardImage } from "@/lib/inventory/plot-card-image";
import { formatPkr } from "@/lib/utils";
import type { PlotWithRelations } from "@shared/types/database.types";

interface PlotListViewProps {
  plots: PlotWithRelations[];
  selectedPlotId: string | null;
  onSelect: (plot: PlotWithRelations) => void;
}

export function PlotListView({
  plots,
  selectedPlotId,
  onSelect,
}: PlotListViewProps) {
  return (
    <div className="h-full overflow-auto bg-[#f3f6fa] p-4 pt-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-primary-navy">Buy property</h2>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-primary-navy tabular-nums">
              {plots.length}
            </span>{" "}
            properties match your filters
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plots.map((plot) => {
          const selected = plot.id === selectedPlotId;
          const imageSrc = getPlotCardImage(plot.id, plot.type);
          return (
            <button
              key={plot.id}
              type="button"
              onClick={() => onSelect(plot)}
              className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                selected
                  ? "border-[#8BB7FF] ring-2 ring-[#E8F2FF]"
                  : "border-border"
              }`}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <Image
                  src={imageSrc}
                  alt={
                    plot.type === "commercial"
                      ? "Commercial property"
                      : "Residential property"
                  }
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-navy/45 via-transparent to-transparent" />
                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-accent-green shadow">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <span className="absolute bottom-2 right-2 rounded-md bg-[#2F6FE0] px-2 py-0.5 text-[11px] font-bold text-white">
                  For Sale
                </span>
              </div>
              <div className="space-y-1.5 p-4">
                <p className="text-lg font-bold tabular-nums text-primary-navy">
                  {formatPkr(plot.lump_sum_price)}
                </p>
                <p className="text-sm font-medium text-text-primary">
                  {plot.size} · Plot ·{" "}
                  {plot.type === "residential" ? "Residential" : "Commercial"}
                </p>
                <p className="text-xs text-text-secondary">
                  {[plot.street, plot.phase?.name].filter(Boolean).join(" · ")}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge
                    variant={
                      plot.type === "residential"
                        ? "residential"
                        : "commercial"
                    }
                  >
                    {plot.type}
                  </Badge>
                  <Badge
                    variant={
                      plot.status === "available"
                        ? "available"
                        : plot.status === "reserved"
                          ? "reserved"
                          : plot.status === "sold"
                            ? "sold"
                            : "muted"
                    }
                  >
                    {plot.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs font-semibold text-text-secondary">
                    {plot.plot_number}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {!plots.length ? (
        <p className="mt-10 text-center text-sm text-text-secondary">
          No plots match the current filters.
        </p>
      ) : null}
    </div>
  );
}
