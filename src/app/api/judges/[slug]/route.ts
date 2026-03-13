import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * GET /api/judges/:slug — Fetch a judge profile by slug,
 * along with recent trials and course maps.
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

  // Fetch recent trials where this judge is listed
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
    .contains("judges", [judge.name])
    .order("start_date", { ascending: false })
    .limit(20);

  // Fetch course maps
  const { data: courseMaps } = await supabase
    .from("judge_course_maps")
    .select(
      `
      id,
      image_url,
      caption,
      class_name,
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
    .order("created_at", { ascending: false })
    .limit(30);

  // Shape trial results
  const recentTrials = (trials || []).map((t) => {
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
    trials: recentTrials,
    courseMaps: courseMaps || [],
  });
}
