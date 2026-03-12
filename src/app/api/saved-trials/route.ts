import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/saved-trials
 * Returns the authenticated user's saved trial IDs and statuses.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ savedTrials: [] });
  }

  const { data, error } = await supabase
    .from("saved_trials")
    .select("trial_id, status")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ savedTrials: data });
}
