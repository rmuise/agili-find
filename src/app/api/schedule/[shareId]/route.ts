import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/db";

type RouteContext = { params: Promise<{ shareId: string }> };

/**
 * GET /api/schedule/[shareId]
 * Returns a public schedule — saved trials for the user matching the share token.
 * No auth required.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { shareId } = await context.params;
  const supabase = createServerClient(); // admin client to bypass RLS

  // Look up user by share token
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("share_token", shareId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Schedule not found" },
      { status: 404 }
    );
  }

  // Fetch their saved trials with full data
  const { data: savedTrials, error: trialsError } = await supabase
    .from("saved_trials")
    .select(
      `
      trial_id,
      status,
      trials:trial_id (
        id,
        title,
        hosting_club,
        organization_id,
        start_date,
        end_date,
        entry_close_date,
        source_url,
        venues:venue_id (
          name,
          city,
          state,
          country
        ),
        organizations:organization_id (
          name
        )
      )
    `
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (trialsError) {
    return NextResponse.json({ error: trialsError.message }, { status: 500 });
  }

  const trials = (savedTrials || [])
    .filter((row: Record<string, unknown>) => row.trials)
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
        source_url: trial.source_url,
        venue_name: venue?.name || "Unknown Venue",
        city: venue?.city || "",
        state: venue?.state || "",
        country: venue?.country || "",
        status: row.status,
      };
    });

  return NextResponse.json({
    displayName: profile.display_name,
    trials,
  });
}
