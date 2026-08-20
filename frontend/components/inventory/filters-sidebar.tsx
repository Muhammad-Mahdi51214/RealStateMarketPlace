"use client";

import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useInventoryStore } from "@/lib/hooks/use-inventory-store";
import { formatPkr } from "@/lib/utils";
import type { Phase } from "@shared/types/database.types";
import { Input } from "@/components/forms/input";

interface FiltersSidebarProps {
  phases: Phase[];
}

function formatCompact(n: number) {
  if (n >= 10_000_000) return `Rs. ${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `Rs. ${(n / 100_000).toFixed(0)}L`;
  if (n >= 1000) return `Rs. ${(n / 1000).toFixed(0)}K`;
  return `Rs. ${n}`;
}

export function FiltersSidebar({ phases }: FiltersSidebarProps) {
  const {
    draftFilters,
    filters,
    filtersOpen,
    setFiltersOpen,
    setDraftFilters,
    applyFilters,
    resetFilters,
  } = useInventoryStore();

  const togglePhase = (id: string) => {
    const next = draftFilters.phaseIds.includes(id)
      ? draftFilters.phaseIds.filter((p) => p !== id)
      : [...draftFilters.phaseIds, id];
    setDraftFilters({ phaseIds: next });
  };

  const toggleType = (type: "residential" | "commercial") => {
    const next = draftFilters.types.includes(type)
      ? draftFilters.types.filter((t) => t !== type)
      : [...draftFilters.types, type];
    setDraftFilters({ types: next });
  };

  const activeChips = [
    ...filters.types.map((t) => t[0].toUpperCase() + t.slice(1)),
    ...phases
      .filter((p) => filters.phaseIds.includes(p.id))
      .map((p) => p.name),
  ];

  if (!filtersOpen) {
    return (
      <button
        type="button"
        onClick={() => setFiltersOpen(true)}
        className="absolute left-3 top-1/2 z-20 flex h-14 w-10 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-r-2xl border border-l-0 border-border bg-white text-primary-navy shadow-lg transition hover:bg-[#E8F2FF]"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="h-4 w-4" />
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <aside className="relative z-20 flex h-full w-[300px] shrink-0 flex-col border-r border-border bg-white shadow-[4px_0_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F2FF] text-primary-navy">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-primary-navy">Filters</h2>
            <p className="text-[11px] font-medium text-text-secondary">
              Refine CSC inventory
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="rounded-xl p-1.5 text-primary-navy transition hover:bg-slate-50"
          aria-label="Collapse filters"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Purpose
          </Label>
          <select
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-primary-navy outline-none transition focus:border-[#8BB7FF] focus:bg-white focus:ring-2 focus:ring-[#E8F2FF]"
            defaultValue="all"
          >
            <option value="all">All Plots</option>
            <option value="official">Official inventory</option>
            <option value="resale">Resale listings</option>
          </select>
        </section>

        <section>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Price range
          </Label>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                Min
              </p>
              <Input
                type="number"
                value={draftFilters.minPrice}
                onChange={(e) =>
                  setDraftFilters({ minPrice: Number(e.target.value) || 0 })
                }
                aria-label="Min price"
                className="mt-0.5 h-7 border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                Max
              </p>
              <Input
                type="number"
                value={draftFilters.maxPrice}
                onChange={(e) =>
                  setDraftFilters({
                    maxPrice: Number(e.target.value) || 50_000_000,
                  })
                }
                aria-label="Max price"
                className="mt-0.5 h-7 border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
          <Slider
            min={0}
            max={50_000_000}
            step={500_000}
            value={[draftFilters.minPrice, draftFilters.maxPrice]}
            onValueChange={([minPrice, maxPrice]) =>
              setDraftFilters({ minPrice, maxPrice })
            }
          />
          <div className="mt-2 flex justify-between text-xs font-semibold tabular-nums text-primary-navy">
            <span>{formatCompact(draftFilters.minPrice)}</span>
            <span>{formatCompact(draftFilters.maxPrice)}</span>
          </div>
        </section>

        <section>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Property type
          </Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["residential", "Residential"],
                ["commercial", "Commercial"],
              ] as const
            ).map(([value, label]) => {
              const on = draftFilters.types.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleType(value)}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    on
                      ? "bg-[#E8F2FF] text-primary-navy ring-1 ring-[#B7D4FF]"
                      : "bg-slate-50 text-text-secondary hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Phase
          </Label>
          <div className="space-y-1.5">
            {phases.map((phase) => {
              const on = draftFilters.phaseIds.includes(phase.id);
              return (
                <label
                  key={phase.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition ${
                    on ? "bg-[#E8F2FF] text-primary-navy" : "hover:bg-slate-50"
                  }`}
                >
                  <Checkbox
                    checked={on}
                    onCheckedChange={() => togglePhase(phase.id)}
                  />
                  {phase.name}
                </label>
              );
            })}
          </div>
        </section>
      </div>

      <div className="space-y-3 border-t border-border bg-slate-50/80 px-4 py-3">
        {activeChips.length ? (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
              Active filters
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-[#E8F2FF] px-2.5 py-0.5 text-xs font-semibold text-primary-navy"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={applyFilters}>
            Apply
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={resetFilters}
          >
            Reset
          </Button>
        </div>
        <p className="text-center text-[11px] text-text-secondary">
          Showing prices from {formatPkr(filters.minPrice)}
        </p>
      </div>
    </aside>
  );
}
