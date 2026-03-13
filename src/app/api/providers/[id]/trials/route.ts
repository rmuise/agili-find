import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProviderOwner, isErrorResponse } from "@/lib/auth/provider-auth";

/**
 * POST /api/providers/:id/trials
 * Associate provider with a trial. Owner only.
 * Body: { trial_id, is_attending }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: providerId } = await params;
  const auth = await requireProviderOwner(providerId);
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { trial_id, is_attending } = body;

  if (!trial_id) {
    return NextResponse.json({ error: "trial_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("srv_trial_associations")
    .upsert(
      {
        provider_id: providerId,
        trial_id,
        is_attending: is_attending ?? false,
      },
      { onConflict: "provider_id,trial_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating trial association:", error);
    return NextResponse.json(
      { error: "Failed to create association", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ association: data }, { status: 201 });
}

/**
 * GET /api/providers/:id/trials
 * List all trials this provider is associated with. Public.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: providerId } = await params;
  const admin = createAdminClient();

  // Verify provider exists
  const { data: provider } = await admin
    .from("srv_providers")
    .select("id")
    .eq("id", providerId)
    .single();

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("srv_trial_associations")
    .select("id, trial_id, is_attending, association_note, created_at")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trials: data || [] });
}
