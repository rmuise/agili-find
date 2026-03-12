import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for use in client components.
 * Uses the anon key — respects RLS and carries user session via cookies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
