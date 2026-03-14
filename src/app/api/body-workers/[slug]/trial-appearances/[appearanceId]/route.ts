/**
 * DELETE /api/body-workers/:slug/trial-appearances/:appearanceId
 *
 * Body worker removes themselves from a trial appearance.
 * Authenticated, must own the profile.
 * Only allowed if the appearance was self-confirmed (confirmed = true),
 * meaning the body worker added themselves — not a scraped record.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; appearanceId: string }> }
) {
  const { slug, appearanceId } = await params;

  // Must be authenticated
  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Verify profile ownership
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

  // Fetch the appearance to check confirmed status
  const { data: appearance } = await admin
    .from("body_worker_trial_appearances")
    .select("id, confirmed, body_worker_id")
    .eq("id", appearanceId)
    .eq("body_worker_id", worker.id)
    .single();

  if (!appearance) {
    return NextResponse.json({ error: "Appearance not found" }, { status: 404 });
  }

  // Only allow deletion if self-confirmed (scraped records must go through admin)
  if (!appearance.confirmed) {
    return NextResponse.json(
      {
        error:
          "This appearance was added by our system, not by you. Contact support to remove it.",
      },
      { status: 403 }
    );
  }

  const { error: deleteError } = await admin
    .from("body_worker_trial_appearances")
    .delete()
    .eq("id", appearanceId);

  if (deleteError) {
    console.error("[DELETE trial-appearances] Delete failed:", deleteError);
    return NextResponse.json({ error: "Failed to remove appearance" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
