import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * Vercel cron job: pre-warm Places cache for trials starting in the next 60 days.
 * Runs daily at 5am UTC (configured in vercel.json).
 *
 * For each trial without recent cache data, calls POST /api/places/refresh/:trialId
 * internally to fetch and cache nearby places.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { message: "GOOGLE_PLACES_API_KEY not set, skipping" },
      { status: 200 }
    );
  }

  const supabase = createServerClient();

  const now = new Date();
  const sixtyDaysOut = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Find trials in the next 60 days
  const { data: trials, error } = await supabase
    .from("trials")
    .select("id, venues!inner(location)")
    .gte("start_date", now.toISOString().split("T")[0])
    .lte("start_date", sixtyDaysOut.toISOString().split("T")[0])
    .limit(50);

  if (error) {
    console.error("Places warm: error fetching trials:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!trials || trials.length === 0) {
    return NextResponse.json({ message: "No upcoming trials to warm", warmed: 0 });
  }

  // Check which trials already have fresh cache
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: cachedTrials } = await supabase
    .from("srv_places_cache")
    .select("trial_id")
    .gte("fetched_at", thirtyDaysAgo);

  const cachedSet = new Set((cachedTrials || []).map((r) => r.trial_id));

  const trialsToWarm = trials.filter((t) => !cachedSet.has(t.id));

  let warmed = 0;
  let errors = 0;

  for (const trial of trialsToWarm) {
    const venue = trial.venues as unknown as { location: string | null };
    if (!venue?.location) continue;

    // Extract lat/lng from PostGIS point
    const match = String(venue.location).match(
      /POINT\((-?\d+\.?\d*)\s+(-?\d+\.?\d*)\)/
    );
    if (!match) continue;

    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);

    try {
      const baseUrl = request.nextUrl.origin;
      const res = await fetch(`${baseUrl}/api/places/refresh/${trial.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });

      if (res.ok) {
        warmed++;
      } else {
        errors++;
        console.error(`Places warm: failed for trial ${trial.id}:`, res.status);
      }
    } catch (err) {
      errors++;
      console.error(`Places warm: error for trial ${trial.id}:`, err);
    }

    // Rate limit: 100ms between requests
    await new Promise((r) => setTimeout(r, 100));
  }

  return NextResponse.json({
    message: `Pre-warmed ${warmed} trials, ${errors} errors, ${cachedSet.size} already cached`,
    total_upcoming: trials.length,
    warmed,
    errors,
    already_cached: trials.length - trialsToWarm.length,
  });
}
