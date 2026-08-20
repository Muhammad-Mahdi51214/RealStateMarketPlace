"use client";

import { create } from "zustand";
import type { PlotType, PlotWithRelations } from "@shared/types/database.types";

export type InventoryViewMode = "map" | "town-plan" | "list";
export type BasemapId = "none" | "osm" | "satellite";

export interface InventoryFilters {
  phaseIds: string[];
  types: PlotType[];
  minPrice: number;
  maxPrice: number;
}

interface InventoryState {
  viewMode: InventoryViewMode;
  basemap: BasemapId;
  filtersOpen: boolean;
  detailOpen: boolean;
  filters: InventoryFilters;
  draftFilters: InventoryFilters;
  selectedPlotId: string | null;
  selectedPlot: PlotWithRelations | null;
  setViewMode: (mode: InventoryViewMode) => void;
  setBasemap: (basemap: BasemapId) => void;
  setFiltersOpen: (open: boolean) => void;
  setDetailOpen: (open: boolean) => void;
  setDraftFilters: (partial: Partial<InventoryFilters>) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  selectPlot: (plot: PlotWithRelations | null) => void;
  openShopPanel: () => void;
}

const defaultFilters: InventoryFilters = {
  phaseIds: [],
  types: [],
  minPrice: 0,
  maxPrice: 50_000_000,
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  viewMode: "map",
  basemap: "satellite",
  filtersOpen: true,
  detailOpen: false,
  filters: defaultFilters,
  draftFilters: defaultFilters,
  selectedPlotId: null,
  selectedPlot: null,
  setViewMode: (viewMode) => set({ viewMode }),
  setBasemap: (basemap) => set({ basemap }),
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
  setDetailOpen: (detailOpen) => set({ detailOpen }),
  setDraftFilters: (partial) =>
    set({ draftFilters: { ...get().draftFilters, ...partial } }),
  applyFilters: () => set({ filters: { ...get().draftFilters } }),
  resetFilters: () =>
    set({ filters: defaultFilters, draftFilters: defaultFilters }),
  selectPlot: (plot) =>
    set({
      selectedPlot: plot,
      selectedPlotId: plot?.id ?? null,
      detailOpen: plot ? true : false,
    }),
  openShopPanel: () =>
    set({
      detailOpen: true,
    }),
}));
