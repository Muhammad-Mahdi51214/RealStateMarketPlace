import type { Phase, PlotStatus, PlotType, PlotWithRelations } from "@shared/types/database.types";

export type PlotParcel = {
  plotId: string;
  label: string;
  type: PlotType;
  status: PlotStatus;
  reservationExpiresAt: string | null;
  latlngs: [number, number][];
  center: [number, number];
};

function phaseBounds(phase: Phase): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} | null {
  const geometry = phase.boundary_geojson as {
    type: string;
    coordinates: number[][][];
  };
  if (geometry?.type !== "Polygon" || !geometry.coordinates?.[0]?.length) {
    return null;
  }
  const ring = geometry.coordinates[0];
  const lats = ring.map((c) => c[1]);
  const lngs = ring.map((c) => c[0]);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function extractLabel(plotNumber: string, fallback: number): string {
  const match = plotNumber.match(/(\d+)/);
  return match?.[1] ?? String(fallback);
}

/**
 * Deterministic irregular rectangular parcels inside each phase bounding box.
 * Each parcel maps 1:1 to a plot so sidebar details stay the same on click.
 */
export function buildPlotParcels(
  phases: Phase[],
  plots: PlotWithRelations[],
): PlotParcel[] {
  const parcels: PlotParcel[] = [];

  for (const phase of phases) {
    const bounds = phaseBounds(phase);
    if (!bounds) continue;

    const phasePlots = plots.filter((p) => p.phase_id === phase.id);
    if (!phasePlots.length) continue;

    const count = phasePlots.length;
    const cols = Math.max(3, Math.ceil(Math.sqrt(count * 1.15)));
    const rows = Math.ceil(count / cols);

    const padLat = (bounds.maxLat - bounds.minLat) * 0.06;
    const padLng = (bounds.maxLng - bounds.minLng) * 0.06;
    const usableLat = bounds.maxLat - bounds.minLat - padLat * 2;
    const usableLng = bounds.maxLng - bounds.minLng - padLng * 2;
    const cellH = usableLat / rows;
    const cellW = usableLng / cols;

    phasePlots.forEach((plot, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const n = i + phase.name.length * 17;

      const ox = (hash(n + 1) - 0.5) * cellW * 0.18;
      const oy = (hash(n + 2) - 0.5) * cellH * 0.18;
      const shrinkX = 0.1 + hash(n + 3) * 0.12;
      const shrinkY = 0.1 + hash(n + 4) * 0.12;

      const south =
        bounds.minLat + padLat + row * cellH + cellH * shrinkY + oy;
      const north =
        bounds.minLat + padLat + (row + 1) * cellH - cellH * shrinkY + oy;
      const west =
        bounds.minLng + padLng + col * cellW + cellW * shrinkX + ox;
      const east =
        bounds.minLng + padLng + (col + 1) * cellW - cellW * shrinkX + ox;

      const j = (k: number) =>
        (hash(n + k) - 0.5) * Math.min(cellW, cellH) * 0.08;

      const latlngs: [number, number][] = [
        [south + j(5), west + j(6)],
        [south + j(7), east + j(8)],
        [north + j(9), east + j(10)],
        [north + j(11), west + j(12)],
      ];

      const center: [number, number] = [
        (south + north) / 2,
        (west + east) / 2,
      ];

      parcels.push({
        plotId: plot.id,
        label: extractLabel(plot.plot_number, i + 1),
        type: plot.type,
        status: plot.status,
        reservationExpiresAt: plot.reservation_expires_at ?? null,
        latlngs,
        center,
      });
    });
  }

  return parcels;
}

export function parcelFillColor(
  type: PlotType,
  selected: boolean,
  status?: PlotStatus,
): string {
  if (selected) return "#0E7C86";
  if (status === "reserved") return "#D97706";
  return type === "commercial" ? "#2F6FE0" : "#F5A623";
}
