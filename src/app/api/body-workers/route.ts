/**
 * GET /api/body-workers/search?q=&modality=&travels=
 *
 * Search the body worker directory.
 *   - q        Full-text search on name or business name
 *   - modality Filter by modality string (e.g. "Massage")
 *   - travels  If "true", only return practitioners who travel to trials
 *
 * Returns lightweight card data suitable for the directory listing.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const modality = searchParams.get("modality")?.trim() ?? "";
  const travels = searchParams.get("travels") === "true";

  const supabase = createServerClient();

  let query = supabase
    .from("body_workers")
    .select(
      `
      id,
      name,
      slug,
      business_name,
      modalities,
      photo_url,
      booking_url,
      is_verified,
      travels_to_trials,
      service_area
    `
    )
    .order("name", { ascending: true })
    .limit(100);

  // Text search on name or business name
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,business_name.ilike.%${q}%`
    );
  }

  // Modality filter (array contains)
  if (modality) {
    query = query.contains("modalities", [modality]);
  }

  // Travels to trials filter
  if (travels) {
    query = query.eq("travels_to_trials", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/body-workers] Query error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  // Attach upcoming trial count for each result
  const ids = (data ?? []).map((bw) => bw.id);
  let trialCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const today = new Date().toISOString().slice(0, 10);

    // Fetch appearance counts for upcoming trials only
    const { data: appearances } = await supabase
      .from("body_worker_trial_appearances")
      .select(
        `
        body_worker_id,
        trials!inner ( start_date )
      `
      )
      .in("body_worker_id", ids)
      .gte("trials.start_date", today);

    for (const row of appearances ?? []) {
      const bwId = row.body_worker_id;
      trialCounts[bwId] = (trialCounts[bwId] ?? 0) + 1;
    }
  }

  const results = (data ?? []).map((bw) => ({
    ...bw,
    upcoming_trial_count: trialCounts[bw.id] ?? 0,
  }));

  return NextResponse.json({ results });
}
