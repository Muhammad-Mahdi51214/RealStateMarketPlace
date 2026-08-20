import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/types/database.types";
import { isSupabaseConfigured } from "@shared/env.public";
import { env } from "@backend/env.server";

/**
 * Service-role client — server-only. Never import from client components.
 * Used for privileged mutations (webhooks, admin ops) in later phases.
 */
export function createAdminClient() {
  if (!isSupabaseConfigured() || !env.server.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase admin client requires URL, anon key, and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.server.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
