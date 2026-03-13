import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const CACHE_TTL_DAYS = 30;

interface PlacesSearchConfig {
  category: string;
  type?: string;
  keyword?: string;
  radiusMeters: number;
}

const SEARCH_CONFIGS: PlacesSearchConfig[] = [
  {
    category: "vet",
    type: "veterinary_care",
    radiusMeters: 25000,
  },
  {
    category: "emergency_vet",
    type: "veterinary_care",
    keyword: "emergency",
    radiusMeters: 50000,
  },
  {
    category: "pet_store",
    type: "pet_store",
    radiusMeters: 15000,
  },
  {
    category: "body_worker",
    keyword: "canine massage OR dog physiotherapy OR canine rehabilitation",
    radiusMeters: 40000,
  },
];

interface PlaceResult {
  place_id: string;
  name?: string;
  vicinity?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  rating?: number;
  geometry?: {
    location: { lat: number; lng: number };
  };
}

async function searchNearby(
  lat: number,
  lng: number,
  config: PlacesSearchConfig
): Promise<PlaceResult[]> {
  if (!PLACES_API_KEY) return [];

  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(config.radiusMeters),
    key: PLACES_API_KEY,
  });

  if (config.type) params.set("type", config.type);
  if (config.keyword) params.set("keyword", config.keyword);

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`
  );

  if (!res.ok) {
    console.error(`Places API error for ${config.category}:`, res.status);
    return [];
  }

  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error(`Places API status for ${config.category}:`, data.status, data.error_message);
    return [];
  }

  return (data.results || []).slice(0, 10);
}

/**
 * POST /api/places/refresh/:trialId
 *
 * Fetches real nearby places from Google Places API and caches them.
 * Skips fetch if existing cache is less than 30 days old.
 * Accepts { lat, lng } in request body.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ trialId: string }> }
) {
  const { trialId } = await params;

  if (!trialId) {
    return NextResponse.json({ error: "Trial ID is required" }, { status: 400 });
  }

  const body = await request.json();
  const { lat, lng } = body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { error: "lat and lng are required as numbers" },
      { status: 400 }
    );
  }

  if (!PLACES_API_KEY) {
    return NextResponse.json(
      { error: "Google Places API key not configured" },
      { status: 503 }
    );
  }

  const supabase = createServerClient();

  // Check cache TTL — skip if recent data exists
  const { data: existing } = await supabase
    .from("srv_places_cache")
    .select("fetched_at")
    .eq("trial_id", trialId)
    .order("fetched_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    const ageMs = Date.now() - new Date(existing[0].fetched_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays < CACHE_TTL_DAYS) {
      return NextResponse.json({
        message: `Cache is ${ageDays.toFixed(1)} days old (TTL: ${CACHE_TTL_DAYS} days). Skipping refresh.`,
        skipped: true,
        cache_age_days: Math.round(ageDays * 10) / 10,
      });
    }
  }

  // Delete stale cache
  await supabase
    .from("srv_places_cache")
    .delete()
    .eq("trial_id", trialId);

  // Fetch all categories in parallel
  const results = await Promise.all(
    SEARCH_CONFIGS.map(async (config) => {
      const places = await searchNearby(lat, lng, config);

      return places.map((place) => ({
        trial_id: trialId,
        category: config.category,
        place_id: place.place_id,
        name: place.name || null,
        address: place.vicinity || place.formatted_address || null,
        phone: place.formatted_phone_number || null,
        rating: place.rating || null,
        maps_url: place.geometry
          ? `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}&query_place_id=${place.place_id}`
          : null,
      }));
    })
  );

  const allRows = results.flat();

  if (allRows.length === 0) {
    return NextResponse.json({
      message: "No places found nearby",
      inserted: 0,
    });
  }

  const { data, error } = await supabase
    .from("srv_places_cache")
    .insert(allRows)
    .select("id, category, name");

  if (error) {
    console.error("Error inserting places:", error);
    return NextResponse.json(
      { error: "Failed to cache places", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Cached ${data?.length || 0} places for trial ${trialId}`,
    inserted: data?.length || 0,
    categories: {
      vet: allRows.filter((r) => r.category === "vet").length,
      emergency_vet: allRows.filter((r) => r.category === "emergency_vet").length,
      pet_store: allRows.filter((r) => r.category === "pet_store").length,
      body_worker: allRows.filter((r) => r.category === "body_worker").length,
    },
  });
}
