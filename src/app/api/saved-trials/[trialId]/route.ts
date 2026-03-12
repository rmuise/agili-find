import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ trialId: string }> };

/**
 * POST /api/saved-trials/[trialId]
 * Save a trial for the authenticated user.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { trialId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let status = "interested";
  try {
    const body = await request.json();
    if (body.status) status = body.status;
  } catch {
    // No body or invalid JSON — use default status
  }

  const { error } = await supabase.from("saved_trials").insert({
    user_id: user.id,
    trial_id: trialId,
    status,
  });

  if (error) {
    // Duplicate — already saved
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already saved" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Saved", trial_id: trialId, status });
}

/**
 * DELETE /api/saved-trials/[trialId]
 * Remove a saved trial for the authenticated user.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { trialId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("saved_trials")
    .delete()
    .eq("user_id", user.id)
    .eq("trial_id", trialId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Unsaved", trial_id: trialId });
}

/**
 * PATCH /api/saved-trials/[trialId]
 * Update the status of a saved trial.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { trialId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.status) {
    return NextResponse.json(
      { error: "status is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("saved_trials")
    .update({ status: body.status })
    .eq("user_id", user.id)
    .eq("trial_id", trialId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Updated",
    trial_id: trialId,
    status: body.status,
  });
}
