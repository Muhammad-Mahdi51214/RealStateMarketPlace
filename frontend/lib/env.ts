/**
 * Prefer importing from:
 * - `@/lib/env.public` / `@shared/env.public` in client components
 * - `@backend/env.server` in server-only modules
 */
export { publicEnv, isSupabaseConfigured } from "@shared/env.public";
