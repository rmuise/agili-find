import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PATCH /api/providers/:id/verify
 * Sets is_verified = true. Requires admin role.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: providerId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Check admin role
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: provider, error } = await admin
    .from("srv_providers")
    .update({ is_verified: true })
    .eq("id", providerId)
    .select()
    .single();

  if (error || !provider) {
    return NextResponse.json(
      { error: "Provider not found or update failed" },
      { status: 404 }
    );
  }

  return NextResponse.json({ provider });
}
