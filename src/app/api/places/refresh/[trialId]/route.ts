import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * POST /api/places/refresh/:trialId
 *
 * STUB: Accepts { lat, lng } and inserts dummy rows into srv_places_cache
 * so the main /api/trials/:id/services endpoint can return a fully shaped
 * response for testing.
 *
 * In production, this will call Google Places API (or similar) to fetch
 * real nearby veterinarians, pet stores, body workers, and emergency vets.
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

  const supabase = createServerClient();

  // Stub data: insert dummy places for each category
  const stubPlaces = [
    {
      trial_id: trialId,
      category: "vet",
      place_id: `stub-vet-1-${trialId}`,
      name: "Paws & Claws Veterinary Clinic",
      address: `123 Main St, near ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      phone: "(555) 123-4567",
      rating: 4.7,
      maps_url: `https://www.google.com/maps/search/veterinarian/@${lat},${lng},14z`,
    },
    {
      trial_id: trialId,
      category: "vet",
      place_id: `stub-vet-2-${trialId}`,
      name: "Valley Animal Hospital",
      address: `456 Oak Ave, near ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      phone: "(555) 234-5678",
      rating: 4.5,
      maps_url: `https://www.google.com/maps/search/veterinarian/@${lat},${lng},14z`,
    },
    {
      trial_id: trialId,
      category: "emergency_vet",
      place_id: `stub-emergency-1-${trialId}`,
      name: "24/7 Emergency Animal Hospital",
      address: `789 Elm Blvd, near ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      phone: "(555) 911-PETS",
      rating: 4.8,
      maps_url: `https://www.google.com/maps/search/emergency+vet/@${lat},${lng},14z`,
    },
    {
      trial_id: trialId,
      category: "pet_store",
      place_id: `stub-petstore-1-${trialId}`,
      name: "Happy Tails Pet Supply",
      address: `321 Maple Dr, near ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      phone: "(555) 345-6789",
      rating: 4.3,
      maps_url: `https://www.google.com/maps/search/pet+store/@${lat},${lng},14z`,
    },
    {
      trial_id: trialId,
      category: "pet_store",
      place_id: `stub-petstore-2-${trialId}`,
      name: "PetSmart",
      address: `100 Commerce Way, near ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      phone: "(555) 456-7890",
      rating: 4.1,
      maps_url: `https://www.google.com/maps/search/pet+store/@${lat},${lng},14z`,
    },
    {
      trial_id: trialId,
      category: "body_worker",
      place_id: `stub-bodyworker-1-${trialId}`,
      name: "Canine Sports Massage & Rehab",
      address: `55 Wellness Ct, near ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      phone: "(555) 567-8901",
      rating: 4.9,
      maps_url: `https://www.google.com/maps/search/animal+chiropractor/@${lat},${lng},14z`,
    },
  ];

  try {
    // Delete existing cache for this trial before inserting fresh stub data
    await supabase
      .from("srv_places_cache")
      .delete()
      .eq("trial_id", trialId);

    const { data, error } = await supabase
      .from("srv_places_cache")
      .insert(stubPlaces)
      .select("id, category, name");

    if (error) {
      console.error("Error inserting stub places:", error);
      return NextResponse.json(
        { error: "Failed to insert stub data", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Inserted ${data?.length || 0} stub places for trial ${trialId}`,
      inserted: data,
      note: "STUB: Replace with real Google Places API integration in production",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Places refresh error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
