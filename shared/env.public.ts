import { z } from "zod";

/**
 * Browser-safe env only. Never put secrets here.
 * Map uses Esri/ArcGIS World Imagery via Leaflet — no map token required.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_APP_URL: z.string().optional().or(z.literal("")),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export function isSupabaseConfigured(): boolean {
  return Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
