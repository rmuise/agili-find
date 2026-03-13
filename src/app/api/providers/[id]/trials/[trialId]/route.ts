import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProviderOwner, isErrorResponse } from "@/lib/auth/provider-auth";

/**
 * DELETE /api/providers/:id/trials/:trialId
 * Remove a trial association. Owner only.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; trialId: string }> }
) {
  const { id: providerId, trialId } = await params;
  const auth = await requireProviderOwner(providerId);
  if (isErrorResponse(auth)) return auth;

  const admin = createAdminClient();

  const { error, count } = await admin
    .from("srv_trial_associations")
    .delete({ count: "exact" })
    .eq("provider_id", providerId)
    .eq("trial_id", trialId);

  if (error) {
    console.error("Error deleting trial association:", error);
    return NextResponse.json(
      { error: "Failed to delete association", details: error.message },
      { status: 500 }
    );
  }

  if (count === 0) {
    return NextResponse.json({ error: "Association not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Association removed" });
}
