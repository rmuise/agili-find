import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * GET /api/judges/search?q=<query>
 *
 * Full-text search across judge names and name_variants.
 * Used for the JudgeSearch autocomplete component.
 *
 * Returns: id, name, slug, organizations, location, photo_url, trial_count
 *
 * Query params:
 *   q     — search string (required, min 1 char)
 *   limit — max results to return (default 10, max 25)
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    25,
    Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "10", 10))
  );

  if (!q) {
    return NextResponse.json({ judges: [] });
  }

  const supabase = createServerClient();

  // Use ilike for case-insensitive partial matching on name.
  // We also need to match inside name_variants (a TEXT[] column).
  // Strategy: run two queries and merge + deduplicate by id.
  const searchPattern = `%${q}%`;

  const [nameResult, variantResult] = await Promise.all([
    // Match on canonical name
    supabase
      .from("judges")
      .select("id, name, slug, organizations, location, photo_url")
      .ilike("name", searchPattern)
      .order("name")
      .limit(limit),

    // Match inside name_variants array using the text search cast
    // Supabase doesn't support ilike on array elements directly, so we
    // cast the array to text and use ilike on that.
    supabase
      .from("judges")
      .select("id, name, slug, organizations, location, photo_url")
      .ilike("name_variants::text", searchPattern)
      .order("name")
      .limit(limit),
  ]);

  // Merge and deduplicate
  const seen = new Set<string>();
  const merged: typeof nameResult.data = [];

  for (const row of [...(nameResult.data ?? []), ...(variantResult.data ?? [])]) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      merged.push(row);
    }
  }

  // Slice to limit after deduplication
  const candidates = merged.slice(0, limit);

  if (candidates.length === 0) {
    return NextResponse.json({ judges: [] });
  }

  // Fetch upcoming trial counts for each matching judge.
  // trials.judges is a TEXT[] of raw names; we count trials where any of the
  // judge's known names (canonical + variants) appear in the array.
  // We do this in a single query with the judge IDs we already have.
  const judgeIds = candidates.map((j) => j.id);
  const today = new Date().toISOString().slice(0, 10);

  // Fetch name + name_variants for all candidates so we can do the array overlap count
  const { data: judgeDetails } = await supabase
    .from("judges")
    .select("id, name, name_variants")
    .in("id", judgeIds);

  // Build a map: judgeId -> all known names
  const judgeNames = new Map<string, string[]>();
  for (const j of judgeDetails ?? []) {
    judgeNames.set(j.id, [j.name, ...(j.name_variants ?? [])]);
  }

  // Count upcoming trials per judge (one query per judge is acceptable at this scale;
  // the result set is small — typically < 25 judges)
  const trialCounts = await Promise.all(
    candidates.map(async (judge) => {
      const names = judgeNames.get(judge.id) ?? [judge.name];
      const { count } = await supabase
        .from("trials")
        .select("id", { count: "exact", head: true })
        .gte("start_date", today)
        .overlaps("judges", names);

      return { id: judge.id, count: count ?? 0 };
    })
  );

  const countMap = new Map(trialCounts.map(({ id, count }) => [id, count]));

  const judges = candidates.map((j) => ({
    id: j.id,
    name: j.name,
    slug: j.slug,
    organizations: j.organizations ?? [],
    location: j.location ?? null,
    photo_url: j.photo_url ?? null,
    trial_count: countMap.get(j.id) ?? 0,
  }));

  return NextResponse.json({ judges });
}
