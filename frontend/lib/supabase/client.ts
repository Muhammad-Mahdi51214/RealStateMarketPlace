import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@shared/types/database.types";
import { isSupabaseConfigured, publicEnv } from "@shared/env.public";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
