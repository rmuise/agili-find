import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/db";
import { createClient } from "@/lib/supabase/server";

const MILES_TO_METERS = 1609.34;

/**
 * GET /api/seminars — List approved seminars, with optional geo/date filters
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const supabase = createServerClient(); // admin — bypasses RLS for reading approved

  const lat = parseFloat(params.get("lat") || "");
  const lng = parseFloat(params.get("lng") || "");
  const hasLocation = !isNaN(lat) && !isNaN(lng);
  const radiusMiles = parseFloat(params.get("radius") || "100");
  const startDate = params.get("startDate") || null;
  const endDate = params.get("endDate") || null;

  let query = supabase
    .from("seminars")
    .select("*")
    .eq("status", "approved")
    .order("start_date", { ascending: true });

  if (startDate) query = query.gte("start_date", startDate);
  if (endDate) query = query.lte("start_date", endDate);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let seminars = (data || []).map((s: Record<string, unknown>) => {
    let distance_miles: number | null = null;
    if (hasLocation && s.lat && s.lng) {
      // Haversine approximation
      const R = 3959; // Earth radius in miles
      const dLat = ((Number(s.lat) - lat) * Math.PI) / 180;
      const dLng = ((Number(s.lng) - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((Number(s.lat) * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      distance_miles = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    }
    return {
      id: s.id,
      type: "seminar" as const,
      title: s.title,
      description: s.description,
      instructor: s.instructor,
      start_date: s.start_date,
      end_date: s.end_date,
      venue_name: s.venue_name,
      city: s.city,
      state: s.state,
      country: s.country,
      lat: s.lat,
      lng: s.lng,
      contact_email: s.contact_email,
      contact_url: s.contact_url,
      price: s.price,
      distance_miles,
    };
  });

  // Filter by radius if location provided
  if (hasLocation) {
    const radiusMi = radiusMiles;
    seminars = seminars.filter(
      (s: { distance_miles: number | null }) =>
        s.distance_miles !== null && s.distance_miles <= radiusMi
    );
    seminars.sort(
      (a: { distance_miles: number | null }, b: { distance_miles: number | null }) =>
        (a.distance_miles || 0) - (b.distance_miles || 0)
    );
  }

  return NextResponse.json({ seminars });
}

/**
 * POST /api/seminars — Submit a new seminar (requires auth)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const {
    title,
    description,
    instructor,
    start_date,
    end_date,
    venue_name,
    address,
    city,
    state,
    country,
    lat,
    lng,
    contact_email,
    contact_url,
    price,
  } = body;

  // Validation
  if (!title?.trim() || !instructor?.trim() || !start_date || !end_date || !venue_name?.trim() || !city?.trim() || !state?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields: title, instructor, dates, venue_name, city, state" },
      { status: 400 }
    );
  }

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    title: title.trim(),
    description: description?.trim() || null,
    instructor: instructor.trim(),
    start_date,
    end_date,
    venue_name: venue_name.trim(),
    address: address?.trim() || null,
    city: city.trim(),
    state: state.trim(),
    country: country?.trim() || "US",
    contact_email: contact_email?.trim() || null,
    contact_url: contact_url?.trim() || null,
    price: price?.trim() || null,
    status: "approved", // Auto-approve for now; add moderation later
  };

  // Add geo if provided
  if (lat && lng) {
    insertData.lat = lat;
    insertData.lng = lng;
    insertData.location = `POINT(${lng} ${lat})`;
  }

  const { data, error } = await supabase
    .from("seminars")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seminar: data }, { status: 201 });
}
