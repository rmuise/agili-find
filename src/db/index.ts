import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side client with service role key for admin operations (scrapers, cron, etc.).
 * Re-exported for backward compatibility with existing consumers.
 */
export function createServerClient() {
  return createAdminClient();
}
