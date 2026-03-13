import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProviderOwner, isErrorResponse } from "@/lib/auth/provider-auth";

/**
 * GET /api/providers/:id
 * Public — single provider profile.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("srv_providers")
    .select(
      "id, provider_type, business_name, contact_name, email, phone, website_url, description, logo_url, location_city, location_province, service_radius_km, is_verified, created_at"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  return NextResponse.json({ provider: data });
}

/**
 * PUT /api/providers/:id
 * Owner only — update provider profile.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireProviderOwner(id);
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();

  // Only allow updating specific fields
  const allowedFields = [
    "business_name",
    "contact_name",
    "email",
    "phone",
    "website_url",
    "description",
    "logo_url",
    "location_city",
    "location_province",
    "service_radius_km",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("srv_providers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating provider:", error);
    return NextResponse.json(
      { error: "Failed to update provider", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ provider: data });
}
