import { createServerClient } from "@/db";
import { geocodeAddress } from "./nominatim";

interface VenueInput {
  name: string;
  addressRaw: string;
  city: string;
  state: string;
  postalCode?: string | null;
  country?: string;
  /** Pre-provided latitude (e.g., from AKC API). Skips geocoding if both lat/lng set. */
  lat?: number | null;
  /** Pre-provided longitude (e.g., from AKC API). Skips geocoding if both lat/lng set. */
  lng?: number | null;
}

/**
 * Get or create a venue, geocoding the address if needed.
 * Uses address_raw as a dedup key.
 * If lat/lng are provided in the input, skips geocoding entirely.
 */
export async function getOrCreateVenue(input: VenueInput): Promise<string | null> {
  const supabase = createServerClient();

  // Check if venue already exists
  const { data: existing } = await supabase
    .from("venues")
    .select("id")
    .eq("address_raw", input.addressRaw)
    .single();

  if (existing) {
    return existing.id;
  }

  // Use pre-provided coordinates or geocode the address
  let lat: number | null = input.lat ?? null;
  let lng: number | null = input.lng ?? null;
  let geocodeStatus: "success" | "failed" | "manual" = "failed";

  if (lat !== null && lng !== null) {
    // Coordinates provided by the source API (e.g., AKC)
    geocodeStatus = "success";
  } else {
    // Need to geocode
    const geo = await geocodeAddress(input.addressRaw);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      geocodeStatus = "success";
    }
  }

  const venueData: Record<string, unknown> = {
    name: input.name,
    address_raw: input.addressRaw,
    city: input.city,
    state: input.state,
    postal_code: input.postalCode || null,
    country: input.country || "US",
    geocode_status: geocodeStatus,
  };

  // Add location point if we have coordinates
  if (lat !== null && lng !== null) {
    // PostGIS expects POINT(lng lat) format
    venueData.location = `POINT(${lng} ${lat})`;
  }

  const { data: venue, error } = await supabase
    .from("venues")
    .upsert(venueData, { onConflict: "address_raw" })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create venue:", error);
    return null;
  }

  return venue?.id || null;
}
