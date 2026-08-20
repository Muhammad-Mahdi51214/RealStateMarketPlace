import { isSupabaseConfigured } from "@shared/env.public";
import {
  filterSeedPlots,
  seedAmenities,
  seedPhases,
  seedPlots,
} from "@backend/data/seed";
import type { PlotsQuery } from "@backend/validation/plots";
import type {
  Amenity,
  Phase,
  PlotStatus,
  PlotType,
  PlotWithRelations,
} from "@shared/types/database.types";

export async function getPhases(): Promise<Phase[]> {
  if (!isSupabaseConfigured()) {
    return seedPhases;
  }

  try {
    const { createClient } = await import("@backend/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.from("phases").select("*").order("name");
    if (error || !data?.length) return seedPhases;
    return data;
  } catch {
    return seedPhases;
  }
}

export async function getAmenities(): Promise<Amenity[]> {
  if (!isSupabaseConfigured()) {
    return seedAmenities;
  }

  try {
    const { createClient } = await import("@backend/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.from("amenities").select("*");
    if (error || !data?.length) return seedAmenities;
    return data;
  } catch {
    return seedAmenities;
  }
}

async function withLiveDemoStatuses(
  plots: PlotWithRelations[],
): Promise<PlotWithRelations[]> {
  try {
    const {
      getPlotStatus,
      expirePendingReservations,
      isPaymentVerified,
      getPlotPsid,
      getDemoStore,
    } = await import("@backend/demo/store");
    expirePendingReservations();
    const store = getDemoStore();
    return plots.map((plot) => {
      const status = getPlotStatus(plot.id);
      const payment_verified = isPaymentVerified(plot.id);
      const psid = getPlotPsid(plot.id);
      const pending = store.reservations.find(
        (r) => r.plot_id === plot.id && r.status === "pending_payment",
      );
      return {
        ...plot,
        status,
        is_available: status === "available",
        payment_verified,
        psid,
        payment_ref: psid,
        reservation_expires_at:
          status === "reserved" && pending ? pending.expires_at : null,
      };
    });
  } catch {
    return plots.map((plot) => ({
      ...plot,
      is_available: plot.status === "available",
      payment_verified: false,
      psid: null,
      payment_ref: null,
      reservation_expires_at: null,
    }));
  }
}

export async function getPlotById(
  plotId: string,
): Promise<PlotWithRelations | null> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@backend/supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("plots")
        .select("*, phase:phases(id, name), payment_plans(*)")
        .eq("id", plotId)
        .maybeSingle();
      if (!error && data) {
        const [live] = await withLiveDemoStatuses([data as PlotWithRelations]);
        return live ?? (data as PlotWithRelations);
      }
    } catch {
      // fall through to seed
    }
  }

  const seeded = seedPlots.find((p) => p.id === plotId);
  if (!seeded) return null;
  const [live] = await withLiveDemoStatuses([seeded]);
  return live ?? seeded;
}

export async function getPlots(
  query: PlotsQuery,
): Promise<PlotWithRelations[]> {
  if (!isSupabaseConfigured()) {
    const plots = await withLiveDemoStatuses(
      filterSeedPlots({
        phaseIds: query.phaseIds,
        types: query.types as PlotType[] | undefined,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        statuses: undefined,
        bbox: query.bbox,
      }),
    );
    const filtered = query.statuses?.length
      ? plots.filter((p) => query.statuses!.includes(p.status))
      : plots;
    return filtered.slice(0, query.limit);
  }

  try {
    const { createClient } = await import("@backend/supabase/server");
    const supabase = await createClient();
    let q = supabase
      .from("plots")
      .select("*, phase:phases(id, name), payment_plans(*)")
      .limit(query.limit);

    if (query.phaseIds?.length) {
      q = q.in("phase_id", query.phaseIds);
    }
    if (query.types?.length) {
      q = q.in("type", query.types);
    }
    if (query.statuses?.length) {
      q = q.in("status", query.statuses as PlotStatus[]);
    }
    if (query.minPrice !== undefined) {
      q = q.gte("lump_sum_price", query.minPrice);
    }
    if (query.maxPrice !== undefined) {
      q = q.lte("lump_sum_price", query.maxPrice);
    }
    if (query.bbox) {
      const [minLng, minLat, maxLng, maxLat] = query.bbox;
      q = q
        .gte("longitude", minLng)
        .lte("longitude", maxLng)
        .gte("latitude", minLat)
        .lte("latitude", maxLat);
    }

    const { data, error } = await q;
    if (error || !data?.length) {
      return withLiveDemoStatuses(
        filterSeedPlots({
          phaseIds: query.phaseIds,
          types: query.types as PlotType[] | undefined,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          statuses: query.statuses as PlotStatus[] | undefined,
          bbox: query.bbox,
        }).slice(0, query.limit),
      );
    }

    const live = await withLiveDemoStatuses(data as PlotWithRelations[]);
    return query.statuses?.length
      ? live.filter((p) => query.statuses!.includes(p.status))
      : live;
  } catch {
    return withLiveDemoStatuses(
      filterSeedPlots({
        phaseIds: query.phaseIds,
        types: query.types as PlotType[] | undefined,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        statuses: query.statuses as PlotStatus[] | undefined,
        bbox: query.bbox,
      }).slice(0, query.limit),
    );
  }
}

export function getInventoryStats(plots: PlotWithRelations[]) {
  return {
    total: plots.length,
    available: plots.filter((p) => p.status === "available").length,
    reserved: plots.filter((p) => p.status === "reserved").length,
    sold: plots.filter((p) => p.status === "sold").length,
    residential: plots.filter((p) => p.type === "residential").length,
    commercial: plots.filter((p) => p.type === "commercial").length,
  };
}

export { seedPlots, seedPhases };
