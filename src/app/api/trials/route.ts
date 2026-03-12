import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/db";
import type { OrganizationId } from "@/types/trial";
import type { TrialResult, SearchResult } from "@/types/search";

const MILES_TO_METERS = 1609.34;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * GET /api/trials — Search for agility trials
 *
 * Query params:
 *   lat, lng       - Center point for geo search
 *   radius         - Search radius in miles (default: 100)
 *   orgs           - Comma-separated org IDs (e.g., "akc,usdaa")
 *   judge          - Judge name search (partial, case-insensitive)
 *   startDate      - ISO date, start of range
 *   endDate        - ISO date, end of range
 *   page           - Page number (1-based, default: 1)
 *   limit          - Results per page (default: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Parse params
  const lat = parseFloat(params.get("lat") || "");
  const lng = parseFloat(params.get("lng") || "");
  const hasLocation = !isNaN(lat) && !isNaN(lng);

  const radiusMiles = parseFloat(params.get("radius") || "100");
  const radiusMeters = radiusMiles * MILES_TO_METERS;

  const orgsParam = params.get("orgs");
  const orgFilter: OrganizationId[] | null = orgsParam
    ? (orgsParam.split(",").filter(Boolean) as OrganizationId[])
    : null;

  const judge = params.get("judge") || null;
  const classesParam = params.get("classes");
  const classFilter: string[] | null = classesParam
    ? classesParam.split(",").filter(Boolean)
    : null;
  const startDate = params.get("startDate") || null;
  const endDate = params.get("endDate") || null;

  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(params.get("limit") || String(DEFAULT_LIMIT), 10)));
  const offset = (page - 1) * limit;

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase.rpc("nearby_trials", {
      search_lat: hasLocation ? lat : null,
      search_lng: hasLocation ? lng : null,
      radius_meters: hasLocation ? radiusMeters : 999999999, // effectively no limit
      org_filter: orgFilter,
      judge_filter: judge,
      class_filter: classFilter,
      date_start: startDate,
      date_end: endDate,
      result_limit: limit,
      result_offset: offset,
    });

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json(
        { error: "Search failed", details: error.message },
        { status: 500 }
      );
    }

    const trials: TrialResult[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.trial_id as string,
      title: row.title as string,
      hosting_club: row.hosting_club as string | null,
      organization_id: row.organization_id as OrganizationId,
      organization_name: row.organization_name as string,
      start_date: row.start_date as string,
      end_date: row.end_date as string,
      entry_close_date: row.entry_close_date as string | null,
      classes: row.classes as string[],
      judges: row.judges as string[],
      source_url: row.source_url as string,
      venue_name: row.venue_name as string,
      city: row.city as string,
      state: row.state as string,
      country: row.country as string,
      lat: row.lat as number,
      lng: row.lng as number,
      distance_miles: hasLocation
        ? Math.round(((row.distance_meters as number) / MILES_TO_METERS) * 10) / 10
        : null,
    }));

    const result: SearchResult = {
      trials,
      total: trials.length, // Note: for accurate total count, we'd need a separate count query
      page,
      limit,
    };

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Search error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
