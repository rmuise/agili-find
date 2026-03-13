import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";
import { haversineDistance } from "@/lib/geo";

/**
 * GET /api/training-spaces — List approved training spaces, with optional geo filters
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const supabase = createServerClient();

  const lat = parseFloat(params.get("lat") || "");
  const lng = parseFloat(params.get("lng") || "");
  const hasLocation = !isNaN(lat) && !isNaN(lng);
  const radiusMiles = parseFloat(params.get("radius") || "100");
  const indoor = params.get("indoor"); // "true" | "false" | null
  const surface = params.get("surface"); // surface_type filter

  let query = supabase
    .from("training_spaces")
    .select("*")
    .eq("status", "approved")
    .order("name", { ascending: true });

  if (indoor === "true") query = query.eq("indoor", true);
  if (indoor === "false") query = query.eq("indoor", false);
  if (surface) query = query.eq("surface_type", surface);

  const { data, error } = await query;

  if (error) {
    return apiError("Operation failed", 500, error.message);
  }

  let spaces = (data || []).map((s: Record<string, unknown>) => {
    let distance_miles: number | null = null;
    if (hasLocation && s.lat && s.lng) {
      distance_miles =
        Math.round(haversineDistance(lat, lng, Number(s.lat), Number(s.lng)) * 10) / 10;
    }
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      surface_type: s.surface_type,
      indoor: s.indoor,
      has_equipment: s.has_equipment,
      equipment_details: s.equipment_details,
      address: s.address,
      city: s.city,
      state: s.state,
      country: s.country,
      lat: s.lat,
      lng: s.lng,
      contact_email: s.contact_email,
      contact_phone: s.contact_phone,
      website: s.website,
      rental_info: s.rental_info,
      photo_url: s.photo_url,
      distance_miles,
    };
  });

  if (hasLocation) {
    spaces = spaces.filter(
      (s: { distance_miles: number | null }) =>
        s.distance_miles !== null && s.distance_miles <= radiusMiles
    );
    spaces.sort(
      (a: { distance_miles: number | null }, b: { distance_miles: number | null }) =>
        (a.distance_miles || 0) - (b.distance_miles || 0)
    );
  }

  return NextResponse.json({ spaces });
}

/**
 * POST /api/training-spaces — Submit a new training space (requires auth)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("Unauthorized", 401);
  }

  const body = await request.json();

  const {
    name,
    description,
    surface_type,
    indoor,
    has_equipment,
    equipment_details,
    address,
    city,
    state,
    country,
    lat,
    lng,
    contact_email,
    contact_phone,
    website,
    rental_info,
  } = body;

  if (!name?.trim() || !city?.trim() || !state?.trim()) {
    return apiError("Missing required fields: name, city, state", 400);
  }

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    name: name.trim(),
    description: description?.trim() || null,
    surface_type: surface_type || null,
    indoor: indoor || false,
    has_equipment: has_equipment || false,
    equipment_details: equipment_details?.trim() || null,
    address: address?.trim() || null,
    city: city.trim(),
    state: state.trim(),
    country: country?.trim() || "US",
    contact_email: contact_email?.trim() || null,
    contact_phone: contact_phone?.trim() || null,
    website: website?.trim() || null,
    rental_info: rental_info?.trim() || null,
    status: "approved",
  };

  if (lat && lng) {
    insertData.lat = lat;
    insertData.lng = lng;
    insertData.location = `POINT(${lng} ${lat})`;
  }

  const { data, error } = await supabase
    .from("training_spaces")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return apiError("Operation failed", 500, error.message);
  }

  return NextResponse.json({ space: data }, { status: 201 });
}
