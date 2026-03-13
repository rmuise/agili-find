import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProvider, isErrorResponse } from "@/lib/auth/provider-auth";
import { VALID_PROVIDER_TYPES } from "@/lib/constants";
import { apiError } from "@/lib/api-error";

const REQUIRED_FIELDS_BY_TYPE: Record<string, string[]> = {
  club: ["business_name", "contact_name", "email", "location_city", "location_province"],
  presenter: ["business_name", "contact_name", "email"],
  facility: ["business_name", "contact_name", "email", "location_city", "location_province"],
  body_worker: ["business_name", "contact_name", "email", "location_city"],
  vendor: ["business_name", "contact_name", "email"],
  photographer: ["business_name", "contact_name", "email"],
};

/**
 * POST /api/providers
 * Create a provider profile. Requires authenticated user with provider role.
 */
export async function POST(request: Request) {
  const auth = await requireProvider();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { provider_type } = body;

  if (!provider_type || !VALID_PROVIDER_TYPES.includes(provider_type)) {
    return apiError(`provider_type must be one of: ${VALID_PROVIDER_TYPES.join(", ")}`, 400);
  }

  // Validate required fields for this provider type
  const required = REQUIRED_FIELDS_BY_TYPE[provider_type] || [];
  const missing = required.filter((f) => !body[f]);
  if (missing.length > 0) {
    return apiError(`Missing required fields for ${provider_type}: ${missing.join(", ")}`, 400);
  }

  const admin = createAdminClient();

  // Check if this user already has a provider profile
  const { data: existing } = await admin
    .from("srv_providers")
    .select("id")
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already have a provider profile", provider_id: existing.id },
      { status: 409 }
    );
  }

  const insertData = {
    owner_id: auth.user.id,
    provider_type: body.provider_type,
    business_name: body.business_name,
    contact_name: body.contact_name,
    email: body.email,
    phone: body.phone || null,
    website_url: body.website_url || null,
    description: body.description || null,
    logo_url: body.logo_url || null,
    location_city: body.location_city || null,
    location_province: body.location_province || null,
    service_radius_km: body.service_radius_km || null,
  };

  const { data, error } = await admin
    .from("srv_providers")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating provider:", error);
    return apiError("Failed to create provider", 500, error.message);
  }

  // Upgrade user role to provider if not already
  if (auth.role !== "provider" && auth.role !== "admin") {
    await admin
      .from("profiles")
      .update({ role: "provider" })
      .eq("id", auth.user.id);
  }

  return NextResponse.json({ provider: data }, { status: 201 });
}

/**
 * GET /api/providers
 * List providers. Public. Filters: ?type= ?province= ?trial_id=
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const province = searchParams.get("province");
  const trialId = searchParams.get("trial_id");

  const admin = createAdminClient();

  if (trialId) {
    // Join through srv_trial_associations to find providers for a specific trial
    const { data, error } = await admin
      .from("srv_trial_associations")
      .select(`
        is_attending,
        association_note,
        srv_providers (
          id, provider_type, business_name, contact_name, email, phone,
          website_url, description, logo_url, location_city, location_province,
          service_radius_km, is_verified
        )
      `)
      .eq("trial_id", trialId);

    if (error) {
      return apiError("Failed to fetch providers", 500, error.message);
    }

    let providers = (data || [])
      .filter((row) => row.srv_providers)
      .map((row) => ({
        ...(row.srv_providers as object),
        is_attending: row.is_attending,
      }));

    if (type) {
      providers = providers.filter(
        (p) => p.provider_type === type
      );
    }
    if (province) {
      providers = providers.filter(
        (p) => p.location_province === province
      );
    }

    return NextResponse.json({ providers });
  }

  // No trial_id — query srv_providers directly
  let query = admin
    .from("srv_providers")
    .select(
      "id, provider_type, business_name, contact_name, email, phone, website_url, description, logo_url, location_city, location_province, service_radius_km, is_verified"
    )
    .order("business_name");

  if (type) {
    query = query.eq("provider_type", type);
  }
  if (province) {
    query = query.eq("location_province", province);
  }

  const { data, error } = await query;

  if (error) {
    return apiError("Failed to fetch providers", 500, error.message);
  }

  return NextResponse.json({ providers: data || [] });
}
