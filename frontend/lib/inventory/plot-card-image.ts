import type { PlotType } from "@shared/types/database.types";

const RESIDENTIAL = [
  "/images/listings/residential-1.jpg",
  "/images/listings/residential-2.jpg",
  "/images/listings/residential-3.jpg",
] as const;

const COMMERCIAL = [
  "/images/listings/commercial-1.jpg",
  "/images/listings/commercial-2.jpg",
  "/images/listings/commercial-3.jpg",
] as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Distinct listing photo by plot type; rotates variants so cards are not identical. */
export function getPlotCardImage(
  plotId: string,
  type: PlotType,
): string {
  const pool = type === "commercial" ? COMMERCIAL : RESIDENTIAL;
  return pool[hashId(plotId) % pool.length];
}
