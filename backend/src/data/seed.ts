import type {
  Amenity,
  PaymentPlan,
  Phase,
  PlotStatus,
  PlotType,
  PlotWithRelations,
} from "@shared/types/database.types";

/** Approximate Capital Smart City corridor west of Islamabad (placeholders). */
const PHASE_DEFS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Phase 1",
    center: { lat: 33.5655, lng: 72.861 },
    span: 0.012,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Phase 2",
    center: { lat: 33.552, lng: 72.875 },
    span: 0.011,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Phase 3",
    center: { lat: 33.54, lng: 72.89 },
    span: 0.013,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Phase RVS",
    center: { lat: 33.575, lng: 72.845 },
    span: 0.01,
  },
] as const;

function rectanglePolygon(
  centerLat: number,
  centerLng: number,
  span: number,
): {
  type: "Polygon";
  coordinates: number[][][];
} {
  const half = span / 2;
  return {
    type: "Polygon",
    coordinates: [
      [
        [centerLng - half, centerLat - half],
        [centerLng + half, centerLat - half],
        [centerLng + half, centerLat + half],
        [centerLng - half, centerLat + half],
        [centerLng - half, centerLat - half],
      ],
    ],
  };
}

const STATUSES: PlotStatus[] = [
  "available",
  "available",
  "available",
  "available",
  "available",
  "available",
  "available",
  "available",
];

const SIZES = ["5 Marla", "7 Marla", "10 Marla", "1 Kanal", "2 Kanal"];

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export const seedPhases: Phase[] = PHASE_DEFS.map((p) => ({
  id: p.id,
  society_id: null,
  name: p.name,
  boundary_geojson: rectanglePolygon(p.center.lat, p.center.lng, p.span),
  town_plan_url: "/images/town-plan-placeholder.svg",
  created_at: new Date().toISOString(),
}));

export const seedPlots: PlotWithRelations[] = PHASE_DEFS.flatMap((phase, pi) => {
  const count = pi === 0 ? 28 : pi === 1 ? 22 : pi === 2 ? 20 : 16;
  return Array.from({ length: count }, (_, i) => {
    const n = pi * 100 + i + 1;
    const type: PlotType = hash(n) > 0.72 ? "commercial" : "residential";
    const status = STATUSES[Math.floor(hash(n + 3) * STATUSES.length)];
    const size = SIZES[Math.floor(hash(n + 7) * SIZES.length)];
    const base =
      type === "commercial"
        ? 18_000_000 + Math.floor(hash(n + 11) * 25_000_000)
        : 6_500_000 + Math.floor(hash(n + 13) * 18_000_000);
    const lat =
      phase.center.lat + (hash(n + 17) - 0.5) * phase.span * 0.85;
    const lng =
      phase.center.lng + (hash(n + 19) - 0.5) * phase.span * 0.85;
    const id = `a0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
    const plot: PlotWithRelations = {
      id,
      phase_id: phase.id,
      plot_number: `Plot ${100 + n}`,
      size,
      street: `St. ${(i % 24) + 1}`,
      zone: String((i % 6) + 1),
      type,
      lump_sum_price: base,
      token_amount: Math.round(base * 0.05),
      status,
      rda_verified: hash(n + 23) > 0.35,
      admin_verified: hash(n + 29) > 0.45,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phase: { id: phase.id, name: phase.name },
      payment_plans: [
        {
          id: `b0000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
          plot_id: id,
          plan_type: "Lump Sum",
          installment_schedule: null,
          created_at: new Date().toISOString(),
        },
        {
          id: `c0000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
          plot_id: id,
          plan_type: "1 Year Plan",
          installment_schedule: [
            { period: "Down payment", amount: Math.round(base * 0.3) },
            { period: "Quarterly x4", amount: Math.round((base * 0.7) / 4) },
          ],
          created_at: new Date().toISOString(),
        },
      ] satisfies PaymentPlan[],
    };
    return plot;
  });
});

export const seedAmenities: Amenity[] = PHASE_DEFS.flatMap((phase, pi) => {
  const types: Amenity["type"][] = ["mosque", "park", "hospital", "school"];
  return types.map((type, ti) => {
    const n = pi * 10 + ti + 1;
    return {
      id: `d0000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
      phase_id: phase.id,
      type,
      latitude: Number(
        (phase.center.lat + (hash(n + 41) - 0.5) * phase.span * 0.5).toFixed(6),
      ),
      longitude: Number(
        (phase.center.lng + (hash(n + 43) - 0.5) * phase.span * 0.5).toFixed(6),
      ),
      label: `${type[0].toUpperCase()}${type.slice(1)} — ${phase.name}`,
    };
  });
});

export function filterSeedPlots(filters: {
  phaseIds?: string[];
  types?: PlotType[];
  minPrice?: number;
  maxPrice?: number;
  statuses?: PlotStatus[];
  bbox?: [number, number, number, number];
}): PlotWithRelations[] {
  return seedPlots.filter((plot) => {
    if (filters.phaseIds?.length && !filters.phaseIds.includes(plot.phase_id)) {
      return false;
    }
    if (filters.types?.length && !filters.types.includes(plot.type)) {
      return false;
    }
    if (
      filters.statuses?.length &&
      !filters.statuses.includes(plot.status)
    ) {
      return false;
    }
    if (
      filters.minPrice !== undefined &&
      Number(plot.lump_sum_price) < filters.minPrice
    ) {
      return false;
    }
    if (
      filters.maxPrice !== undefined &&
      Number(plot.lump_sum_price) > filters.maxPrice
    ) {
      return false;
    }
    if (filters.bbox) {
      const [minLng, minLat, maxLng, maxLat] = filters.bbox;
      if (
        plot.longitude < minLng ||
        plot.longitude > maxLng ||
        plot.latitude < minLat ||
        plot.latitude > maxLat
      ) {
        return false;
      }
    }
    return true;
  });
}
