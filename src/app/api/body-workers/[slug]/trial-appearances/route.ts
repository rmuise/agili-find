/**
 * POST /api/body-workers/:slug/trial-appearances
 *
 * Body worker adds themselves to an upcoming trial.
 * Authenticated, must own the profile (user_id match).
 * Sets confirmed = true (self-confirmed appearance).
 *
 * Validates that the trial exists and start_date is in the future.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
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

  // Fetch the body worker and verify ownership
  const { data: worker } = await admin
    .from("body_workers")
    .select("id, user_id")
    .eq("slug", slug)
    .single();

  if (!worker) {
    return NextResponse.json({ error: "Body worker not found" }, { status: 404 });
  }

  if (worker.user_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden — you do not own this profile" },
      { status: 403 }
    );
  }

  const { trial_id, notes, booking_url_override } = await request.json();

  if (!trial_id) {
    return NextResponse.json({ error: "trial_id is required" }, { status: 400 });
  }

  // Validate trial exists and is in the future
  const today = new Date().toISOString().slice(0, 10);
  const { data: trial } = await admin
    .from("trials")
    .select("id, title, start_date")
    .eq("id", trial_id)
    .single();

  if (!trial) {
    return NextResponse.json({ error: "Trial not found" }, { status: 404 });
  }

  if (trial.start_date < today) {
    return NextResponse.json(
      { error: "Cannot add yourself to a trial that has already passed" },
      { status: 400 }
    );
  }

  // Upsert appearance (idempotent)
  const { data: appearance, error: upsertError } = await admin
    .from("body_worker_trial_appearances")
    .upsert(
      {
        body_worker_id: worker.id,
        trial_id,
        confirmed: true,
        notes: notes ?? null,
        booking_url_override: booking_url_override ?? null,
      },
      { onConflict: "body_worker_id,trial_id" }
    )
    .select("*")
    .single();

  if (upsertError || !appearance) {
    console.error("[POST trial-appearances] Upsert failed:", upsertError);
    return NextResponse.json({ error: "Failed to add trial appearance" }, { status: 500 });
  }

  return NextResponse.json({ appearance }, { status: 201 });
}
