/**
 * GET  /api/body-workers/:slug — Full body worker profile with upcoming trial appearances
 * PUT  /api/body-workers/:slug — Update profile (authenticated, must own profile via user_id)
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Fields the profile owner may NOT update via the PUT endpoint
const IMMUTABLE_FIELDS = ["is_verified", "source", "user_id", "id", "created_at", "slug"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Fetch body worker record
  const { data: worker, error: workerError } = await supabase
    .from("body_workers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (workerError || !worker) {
    return NextResponse.json({ error: "Body worker not found" }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Fetch upcoming trial appearances (start_date >= today), sorted ASC
  const { data: upcomingAppearances } = await supabase
    .from("body_worker_trial_appearances")
    .select(
      `
      id,
      body_worker_id,
      trial_id,
      confirmed,
      notes,
      booking_url_override,
      created_at,
      trials!inner (
        id,
        title,
        organization_id,
        start_date,
        end_date,
        venues!inner (
          name,
          city,
          state
        )
      )
    `
    )
    .eq("body_worker_id", worker.id)
    .gte("trials.start_date", today)
    .order("trials.start_date", { ascending: true })
    .limit(50);

  // Fetch past appearances (collapsed section)
  const { data: pastAppearances } = await supabase
    .from("body_worker_trial_appearances")
    .select(
      `
      id,
      body_worker_id,
      trial_id,
      confirmed,
      notes,
      booking_url_override,
      created_at,
      trials!inner (
        id,
        title,
        organization_id,
        start_date,
        end_date,
        venues!inner (
          name,
          city,
          state
        )
      )
    `
    )
    .eq("body_worker_id", worker.id)
    .lt("trials.start_date", today)
    .order("trials.start_date", { ascending: false })
    .limit(20);

  // Shape appearance records and resolve effective booking URL
  function shapeAppearances(
    rows: typeof upcomingAppearances,
    workerBookingUrl: string | null
  ) {
    return (rows ?? []).map((row) => {
      const trial = row.trials as unknown as {
        id: string;
        title: string;
        organization_id: string;
        start_date: string;
        end_date: string;
        venues: { name: string; city: string; state: string };
      };
      const venue = trial.venues;
      return {
        id: row.id,
        body_worker_id: row.body_worker_id,
        trial_id: row.trial_id,
        confirmed: row.confirmed,
        notes: row.notes,
        booking_url_override: row.booking_url_override,
        created_at: row.created_at,
        trial: {
          id: trial.id,
          title: trial.title,
          organization_id: trial.organization_id,
          start_date: trial.start_date,
          end_date: trial.end_date,
          venue_name: venue.name,
          city: venue.city,
          state: venue.state,
        },
        // Booking URL resolution: per-trial override takes precedence
        effective_booking_url: row.booking_url_override ?? workerBookingUrl,
      };
    });
  }

  return NextResponse.json({
    worker,
    upcoming_appearances: shapeAppearances(upcomingAppearances, worker.booking_url),
    past_appearances: shapeAppearances(pastAppearances, worker.booking_url),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Must be authenticated
  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch the body worker to verify ownership
  const { data: worker } = await admin
    .from("body_workers")
    .select("id, user_id, is_claimed")
    .eq("slug", slug)
    .single();

  if (!worker) {
    return NextResponse.json({ error: "Body worker not found" }, { status: 404 });
  }

  // Only the profile owner or admin may update
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  if (worker.user_id !== user.id && !isAdmin) {
    if (!worker.is_claimed) {
      return NextResponse.json(
        {
          error:
            "This profile has not been claimed. Please claim the profile before editing.",
          redirect_to_claim: true,
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Forbidden — you do not own this profile" },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Strip immutable fields from the update payload
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!IMMUTABLE_FIELDS.includes(key)) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await admin
    .from("body_workers")
    .update(updates)
    .eq("id", worker.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[PUT /api/body-workers/:slug] Update failed:", updateError);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ worker: updated });
}
