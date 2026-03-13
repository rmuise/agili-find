import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * GET /api/trials/:id — Fetch a single trial by ID
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Trial ID is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: trial, error } = await supabase
    .from("trials")
    .select(
      `
      id,
      title,
      hosting_club,
      organization_id,
      start_date,
      end_date,
      entry_close_date,
      classes,
      judges,
      source_url,
      venues!inner (
        name,
        city,
        state,
        country,
        location
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !trial) {
    return NextResponse.json(
      { error: "Trial not found" },
      { status: 404 }
    );
  }

  const venue = trial.venues as unknown as {
    name: string;
    city: string;
    state: string;
    country: string;
    location: string | null;
  };

  // Extract lat/lng from PostGIS point
  let lat = 0;
  let lng = 0;
  if (venue.location) {
    const match = String(venue.location).match(
      /POINT\((-?\d+\.?\d*)\s+(-?\d+\.?\d*)\)/
    );
    if (match) {
      lng = parseFloat(match[1]);
      lat = parseFloat(match[2]);
    }
  }

  const result = {
    id: trial.id,
    title: trial.title,
    hosting_club: trial.hosting_club,
    organization_id: trial.organization_id,
    organization_name: trial.organization_id,
    start_date: trial.start_date,
    end_date: trial.end_date,
    entry_close_date: trial.entry_close_date,
    classes: trial.classes || [],
    judges: trial.judges || [],
    source_url: trial.source_url,
    venue_name: venue.name,
    city: venue.city,
    state: venue.state,
    country: venue.country,
    lat,
    lng,
    distance_miles: null,
  };

  return NextResponse.json(result);
}
