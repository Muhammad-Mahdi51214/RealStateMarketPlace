"use client";

export function MapLegend() {
  return (
    <div className="rounded-lg border border-border bg-bg-base/95 px-3 py-2 text-sm shadow-md backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        Map legend
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-sm bg-plot-commercial ring-1 ring-white" />
          <span>Commercial (available)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-sm bg-plot-residential ring-1 ring-white" />
          <span>Residential (available)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-sm bg-[#D97706] ring-1 ring-white" />
          <span>Reserved (timer)</span>
        </div>
        <div className="flex items-center gap-2 pt-0.5 text-xs text-text-secondary">
          <span className="h-3.5 w-3.5 rounded-sm bg-[#0E7C86] ring-1 ring-white" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
