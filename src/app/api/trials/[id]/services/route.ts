import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

interface Provider {
  id: string;
  provider_type: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website_url: string | null;
  description: string | null;
  logo_url: string | null;
  location_city: string | null;
  location_province: string | null;
  service_radius_km: number | null;
  is_verified: boolean;
}

interface ProviderWithAssociation extends Provider {
  is_attending: boolean;
  association_note: string | null;
}

interface PlaceCacheRow {
  id: string;
  category: string;
  place_id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  rating: number | null;
  maps_url: string | null;
  fetched_at: string;
}

/**
 * GET /api/trials/:id/services
 *
 * Returns service providers associated with a trial and nearby places.
 *
 * Response shape:
 * {
 *   providers: {
 *     attending: ProviderWithAssociation[],
 *     associated: ProviderWithAssociation[]
 *   },
 *   nearby: {
 *     veterinarians: PlaceCacheRow[],
 *     pet_stores: PlaceCacheRow[],
 *     body_workers: PlaceCacheRow[],
 *     emergency_vets: PlaceCacheRow[]
 *   },
 *   places_cache_age_days: number | null
 * }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trialId } = await params;

  if (!trialId) {
    return NextResponse.json({ error: "Trial ID is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    // 1. Fetch providers associated with this trial (join through srv_trial_associations)
    const { data: associations, error: assocError } = await supabase
      .from("srv_trial_associations")
      .select(`
        is_attending,
        association_note,
        srv_providers (
          id,
          provider_type,
          business_name,
          contact_name,
          email,
          phone,
          website_url,
          description,
          logo_url,
          location_city,
          location_province,
          service_radius_km,
          is_verified
        )
      `)
      .eq("trial_id", trialId);

    if (assocError) {
      console.error("Error fetching trial associations:", assocError);
      return NextResponse.json(
        { error: "Failed to fetch providers", details: assocError.message },
        { status: 500 }
      );
    }

    // Split into attending vs associated
    const attending: ProviderWithAssociation[] = [];
    const associated: ProviderWithAssociation[] = [];

    for (const row of associations || []) {
      const provider = row.srv_providers as unknown as Provider | null;
      if (!provider) continue;

      const entry: ProviderWithAssociation = {
        ...provider,
        is_attending: row.is_attending,
        association_note: row.association_note,
      };

      if (row.is_attending) {
        attending.push(entry);
      } else {
        associated.push(entry);
      }
    }

    // Sort: verified first, then alphabetical
    const sortProviders = (a: ProviderWithAssociation, b: ProviderWithAssociation) => {
      if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
      return a.business_name.localeCompare(b.business_name);
    };
    attending.sort(sortProviders);
    associated.sort(sortProviders);

    // 2. Fetch nearby places from cache
    const { data: places, error: placesError } = await supabase
      .from("srv_places_cache")
      .select("id, category, place_id, name, address, phone, rating, maps_url, fetched_at")
      .eq("trial_id", trialId)
      .order("rating", { ascending: false, nullsFirst: false });

    if (placesError) {
      console.error("Error fetching places cache:", placesError);
      return NextResponse.json(
        { error: "Failed to fetch nearby places", details: placesError.message },
        { status: 500 }
      );
    }

    // Group places by category
    const veterinarians: PlaceCacheRow[] = [];
    const petStores: PlaceCacheRow[] = [];
    const bodyWorkers: PlaceCacheRow[] = [];
    const emergencyVets: PlaceCacheRow[] = [];

    for (const place of (places || []) as PlaceCacheRow[]) {
      switch (place.category) {
        case "vet":
          veterinarians.push(place);
          break;
        case "pet_store":
          petStores.push(place);
          break;
        case "body_worker":
          bodyWorkers.push(place);
          break;
        case "emergency_vet":
          emergencyVets.push(place);
          break;
      }
    }

    // 3. Calculate cache age
    let placesCacheAgeDays: number | null = null;
    if (places && places.length > 0) {
      const oldest = (places as PlaceCacheRow[]).reduce((min, p) =>
        new Date(p.fetched_at) < new Date(min.fetched_at) ? p : min
      );
      const ageMs = Date.now() - new Date(oldest.fetched_at).getTime();
      placesCacheAgeDays = Math.round((ageMs / (1000 * 60 * 60 * 24)) * 10) / 10;
    }

    return NextResponse.json({
      providers: {
        attending,
        associated,
      },
      nearby: {
        veterinarians,
        pet_stores: petStores,
        body_workers: bodyWorkers,
        emergency_vets: emergencyVets,
      },
      places_cache_age_days: placesCacheAgeDays,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Services endpoint error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
