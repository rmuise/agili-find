import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * GET /api/judges/:slug — Fetch a judge profile by slug.
 *
 * Returns:
 *   - judge: full judge record (canonical name, variants, bio, orgs, etc.)
 *   - trials: upcoming trials where this judge is listed (start_date >= today, ASC)
 *   - courseMaps: approved course maps only (is_approved = true)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Fetch judge
  const { data: judge, error: judgeError } = await supabase
    .from("judges")
    .select("*")
    .eq("slug", slug)
    .single();

  if (judgeError || !judge) {
    return NextResponse.json({ error: "Judge not found" }, { status: 404 });
  }

  // All known names for this judge (canonical + variants) — used for trial matching
  const knownNames: string[] = [judge.name, ...(judge.name_variants ?? [])];
  const today = new Date().toISOString().slice(0, 10);

  // Fetch upcoming trials only (start_date >= today), sorted ASC
  const { data: trials } = await supabase
    .from("trials")
    .select(
      `
      id,
      title,
      hosting_club,
      organization_id,
      start_date,
      end_date,
      classes,
      judges,
      source_url,
      venues!inner (
        name,
        city,
        state
      )
    `
    )
    .overlaps("judges", knownNames)
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(50);

  // Fetch approved course maps only — pending uploads are never shown to the public
  const { data: courseMaps } = await supabase
    .from("judge_course_maps")
    .select(
      `
      id,
      image_url,
      caption,
      class_name,
      source_label,
      is_approved,
      created_at,
      trials (
        id,
        title,
        organization_id,
        start_date
      )
    `
    )
    .eq("judge_id", judge.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(50);

  // Shape trial results
  const upcomingTrials = (trials || []).map((t) => {
    const venue = t.venues as unknown as {
      name: string;
      city: string;
      state: string;
    };
    return {
      id: t.id,
      title: t.title,
      hosting_club: t.hosting_club,
      organization_id: t.organization_id,
      start_date: t.start_date,
      end_date: t.end_date,
      classes: t.classes || [],
      judges: t.judges || [],
      source_url: t.source_url,
      venue_name: venue.name,
      city: venue.city,
      state: venue.state,
    };
  });

  return NextResponse.json({
    judge,
    trials: upcomingTrials,
    courseMaps: courseMaps || [],
  });
}
