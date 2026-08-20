"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { FiltersSidebar } from "@/components/inventory/filters-sidebar";
import { PlotDetailSidebar } from "@/components/inventory/plot-detail-sidebar";
import { PlotListView } from "@/components/inventory/plot-list-view";
import { useInventoryStore } from "@/lib/hooks/use-inventory-store";
import type { Phase, PlotWithRelations } from "@shared/types/database.types";

async function fetchInventory(search: string) {
  const res = await fetch(`/api/plots?${search}`);
  const json = (await res.json()) as {
    success: boolean;
    data?: {
      plots: PlotWithRelations[];
      phases: Phase[];
    };
    error?: { message: string };
  };
  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? "Failed to load inventory");
  }
  return json.data;
}

export function BuyPropertyShell() {
  const { filters, selectedPlot, selectPlot, detailOpen } = useInventoryStore();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.phaseIds.length) {
      params.set("phaseIds", filters.phaseIds.join(","));
    }
    if (filters.types.length) {
      params.set("types", filters.types.join(","));
    }
    params.set("minPrice", String(filters.minPrice));
    params.set("maxPrice", String(filters.maxPrice));
    params.set("statuses", "available");
    params.set("limit", "300");
    return params.toString();
  }, [filters]);

  const { data, isError, error } = useQuery({
    queryKey: ["plots", "buy", queryString],
    queryFn: () => fetchInventory(queryString),
  });

  const plots = data?.plots ?? [];
  const phases = data?.phases ?? [];

  return (
    <div className="relative flex h-[calc(100vh-4.5rem)] min-h-[560px] overflow-hidden bg-[#f3f6fa]">
      <FiltersSidebar phases={phases} />

      <div className="relative min-w-0 flex-1 overflow-hidden">
        {isError ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-alert-warning-text">
            {(error as Error).message}
          </div>
        ) : (
          <PlotListView
            plots={plots}
            selectedPlotId={selectedPlot?.id ?? null}
            onSelect={selectPlot}
          />
        )}
      </div>

      {detailOpen ? (
        <PlotDetailSidebar
          plot={selectedPlot}
          onClose={() => selectPlot(null)}
        />
      ) : null}
    </div>
  );
}
