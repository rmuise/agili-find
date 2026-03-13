import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, bio, location, dogs, is_public, created_at")
    .eq("id", userId)
    .eq("is_public", true)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Get follower/following counts
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  // Check if current user follows this profile
  const { data: { user } } = await supabase.auth.getUser();
  let isFollowing = false;
  if (user) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .single();
    isFollowing = !!follow;
  }

  // Get trial reviews by this user
  const { data: reviews } = await supabase
    .from("trial_reviews")
    .select(`
      id, rating, comment, results, created_at,
      trials (id, title, organization_id, start_date, city, state)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    profile,
    followers: followers || 0,
    following: following || 0,
    isFollowing,
    reviews: reviews || [],
  });
}
