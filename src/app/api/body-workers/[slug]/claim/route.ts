/**
 * POST /api/body-workers/:slug/claim
 *
 * Allows an authenticated user to claim an unclaimed body worker profile.
 * Sets user_id = authenticated user's ID on the record.
 * is_claimed remains FALSE until an admin approves the claim.
 *
 * After submit: user sees "Your claim request has been submitted.
 * We'll review and activate it within 24 hours."
 *
 * TODO (admin): Build POST /api/admin/body-workers/:id/claim-review
 *   to approve (set is_claimed = true) or reject (clear user_id) claims.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
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

  // Fetch the target profile
  const { data: worker } = await admin
    .from("body_workers")
    .select("id, name, is_claimed, user_id")
    .eq("slug", slug)
    .single();

  if (!worker) {
    return NextResponse.json({ error: "Body worker not found" }, { status: 404 });
  }

  // Already claimed by someone else
  if (worker.is_claimed && worker.user_id && worker.user_id !== user.id) {
    return NextResponse.json(
      { error: "This profile has already been claimed by another account" },
      { status: 409 }
    );
  }

  // Already claimed by this user
  if (worker.user_id === user.id) {
    return NextResponse.json(
      { error: "You have already claimed this profile" },
      { status: 409 }
    );
  }

  // Record claim request: link user_id but leave is_claimed = false (pending admin review)
  const { error: updateError } = await admin
    .from("body_workers")
    .update({ user_id: user.id })
    .eq("id", worker.id);

  if (updateError) {
    console.error("[POST /api/body-workers/:slug/claim] Update failed:", updateError);
    return NextResponse.json({ error: "Claim request failed" }, { status: 500 });
  }

  console.log(
    `[claim] User ${user.id} submitted claim for body worker "${worker.name}" (${worker.id}) — pending admin review`
  );

  return NextResponse.json({
    success: true,
    message:
      "Your claim request has been submitted. We'll review and activate it within 24 hours.",
  });
}
