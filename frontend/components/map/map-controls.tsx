"use client";

import { Layers, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { BasemapId } from "@/lib/hooks/use-inventory-store";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  basemap: BasemapId;
  onBasemapChange: (basemap: BasemapId) => void;
  selectedCount: number;
  onShopClick: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  showLayers: boolean;
}

const BASEMAPS: { id: BasemapId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "osm", label: "OpenStreetMap" },
  { id: "satellite", label: "Satellite" },
];

const btnClass =
  "relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg-base text-primary-navy shadow-md hover:bg-bg-muted";

export function MapControls({
  basemap,
  onBasemapChange,
  selectedCount,
  onShopClick,
  onZoomIn,
  onZoomOut,
  showLayers,
}: MapControlsProps) {
  const [layersOpen, setLayersOpen] = useState(false);

  return (
    <div className="absolute right-4 top-4 z-20 flex w-10 flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={onShopClick}
        className={btnClass}
        aria-label="Open selection panel"
        title="Selection"
      >
        <ShoppingBag className="h-5 w-5" />
        {selectedCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-green px-0.5 text-[10px] font-bold text-white">
            {selectedCount}
          </span>
        ) : null}
      </button>

      {showLayers ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayersOpen((v) => !v)}
            className={btnClass}
            aria-label="Map layers"
            title="Layers"
          >
            <Layers className="h-5 w-5" />
          </button>
          {layersOpen ? (
            <div className="absolute right-12 top-0 z-30 w-56 rounded-xl border border-border bg-bg-base p-3 shadow-xl">
              <p className="mb-2 text-sm font-semibold text-text-primary">
                Base Maps
              </p>
              <div className="space-y-2">
                {BASEMAPS.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-bg-muted",
                      basemap === item.id && "bg-bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="basemap"
                      className="accent-primary-navy"
                      checked={basemap === item.id}
                      onChange={() => {
                        onBasemapChange(item.id);
                        setLayersOpen(false);
                      }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onZoomIn}
        className={btnClass}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Plus className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        className={btnClass}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus className="h-5 w-5" />
      </button>
    </div>
  );
}
