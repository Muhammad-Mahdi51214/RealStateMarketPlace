"use client";

import dynamic from "next/dynamic";
import { Map as MapIcon, MapPinned } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { FiltersSidebar } from "@/components/inventory/filters-sidebar";
import { PlotDetailSidebar } from "@/components/inventory/plot-detail-sidebar";
import { TownPlanViewer } from "@/components/inventory/town-plan-viewer";
import { MapControls } from "@/components/map/map-controls";
import { MapLegend } from "@/components/map/map-legend";
import { useInventoryStore } from "@/lib/hooks/use-inventory-store";
import { cn } from "@/lib/utils";
import type { Phase, PlotWithRelations } from "@shared/types/database.types";

type MapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
};

const MapView = dynamic(
  () =>
    import("@/components/map/map-view").then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0b1f14] text-sm text-white/80">
        Loading satellite map…
      </div>
    ),
  },
);

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

const viewTabs = [
  { mode: "map" as const, label: "Map view", icon: MapIcon },
  { mode: "town-plan" as const, label: "Town Plan", icon: MapPinned },
];

export function InventoryShell() {
  const mapApiRef = useRef<MapHandle | null>(null);
  const {
    viewMode,
    setViewMode,
    basemap,
    setBasemap,
    filters,
    selectedPlot,
    selectPlot,
    detailOpen,
    openShopPanel,
  } = useInventoryStore();

  // CSC Owned Inventory is map-first (list lives on Buy property)
  useEffect(() => {
    if (viewMode === "list") {
      setViewMode("map");
    }
  }, [viewMode, setViewMode]);

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
    params.set("statuses", "available,reserved");
    params.set("limit", "300");
    return params.toString();
  }, [filters]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["plots", queryString],
    queryFn: () => fetchInventory(queryString),
  });

  const plots = data?.plots ?? [];
  const phases = data?.phases ?? [];
  const activeMode = viewMode === "list" ? "map" : viewMode;

  return (
    <div className="relative flex h-[calc(100vh-4.5rem)] min-h-[560px] overflow-hidden bg-[#f3f6fa]">
      <FiltersSidebar phases={phases} />

      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute left-1/2 top-4 z-20 flex -translate-x-1/2 gap-1 rounded-full border border-white/80 bg-white/95 p-1.5 shadow-[0_8px_28px_rgba(15,23,42,0.12)] backdrop-blur">
          {viewTabs.map(({ mode, label, icon: Icon }) => {
            const active = activeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                className={cn(
                  "pointer-events-auto relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                  active
                    ? "bg-[#E8F2FF] text-primary-navy shadow-sm"
                    : "text-text-secondary hover:bg-slate-50 hover:text-primary-navy",
                )}
                onClick={() => setViewMode(mode)}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {active ? (
                  <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary-navy" />
                ) : null}
              </button>
            );
          })}
        </div>

        {activeMode === "map" ? (
          <>
            <MapControls
              basemap={basemap}
              onBasemapChange={setBasemap}
              selectedCount={selectedPlot ? 1 : 0}
              onShopClick={openShopPanel}
              onZoomIn={() => mapApiRef.current?.zoomIn()}
              onZoomOut={() => mapApiRef.current?.zoomOut()}
              showLayers
            />
            <div className="absolute bottom-4 left-4 z-20">
              <MapLegend />
            </div>
          </>
        ) : null}

        <div className="absolute inset-0">
          {isError ? (
            <div className="flex h-full items-center justify-center p-6 text-sm text-alert-warning-text">
              {(error as Error).message}
            </div>
          ) : null}

          {!isError && activeMode === "map" ? (
            <MapView
              plots={plots}
              phases={phases}
              selectedPlotId={selectedPlot?.id ?? null}
              basemap={basemap}
              onSelectPlot={selectPlot}
              onReady={(api) => {
                mapApiRef.current = api;
              }}
            />
          ) : null}

          {!isError && activeMode === "town-plan" ? (
            <div className="h-full p-3 pt-16 sm:p-4 sm:pt-16">
              <TownPlanViewer
                src="/images/town-plan-master.png"
                webpSrc="/images/town-plan-master-hq.webp"
                alt="Capital Smart City master town plan"
                caption={
                  isLoading
                    ? "Loading inventory…"
                    : `High-resolution master plan · drag to pan · ${plots.length} plots in current filters`
                }
                className="h-full shadow-sm"
              />
            </div>
          ) : null}
        </div>
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
