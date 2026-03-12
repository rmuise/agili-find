import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/saved-trials/full
 * Returns the authenticated user's saved trials with full trial + venue data.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_trials")
    .select(
      `
      trial_id,
      status,
      created_at,
      trials:trial_id (
        id,
        title,
        hosting_club,
        organization_id,
        start_date,
        end_date,
        entry_close_date,
        classes,
        judges,
        source_url,
        venues:venue_id (
          name,
          city,
          state,
          country,
          lat,
          lng
        ),
        organizations:organization_id (
          name
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Saved trials fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the nested data into TrialResult-compatible objects
  const savedTrials = (data || [])
    .filter((row: Record<string, unknown>) => row.trials) // skip if trial was deleted
    .map((row: Record<string, unknown>) => {
      const trial = row.trials as Record<string, unknown>;
      const venue = trial.venues as Record<string, unknown> | null;
      const org = trial.organizations as Record<string, unknown> | null;

      return {
        id: trial.id,
        title: trial.title,
        hosting_club: trial.hosting_club,
        organization_id: trial.organization_id,
        organization_name: org?.name || String(trial.organization_id).toUpperCase(),
        start_date: trial.start_date,
        end_date: trial.end_date,
        entry_close_date: trial.entry_close_date,
        classes: trial.classes || [],
        judges: trial.judges || [],
        source_url: trial.source_url,
        venue_name: venue?.name || "Unknown Venue",
        city: venue?.city || "",
        state: venue?.state || "",
        country: venue?.country || "",
        lat: venue?.lat || 0,
        lng: venue?.lng || 0,
        distance_miles: null,
        // Extra fields for schedule view
        saved_status: row.status,
        saved_at: row.created_at,
      };
    });

  return NextResponse.json({ savedTrials });
}
