import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { trial_id, rating, comment, results } = await request.json();

  if (!trial_id) {
    return NextResponse.json({ error: "trial_id is required" }, { status: 400 });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("trial_reviews")
    .upsert(
      {
        user_id: user.id,
        trial_id,
        rating,
        comment,
        results,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,trial_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const trialId = searchParams.get("trial_id");

  if (!trialId) {
    return NextResponse.json({ error: "trial_id required" }, { status: 400 });
  }

  const { data: reviews } = await supabase
    .from("trial_reviews")
    .select(`
      id, rating, comment, results, created_at,
      profiles (display_name)
    `)
    .eq("trial_id", trialId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ reviews: reviews || [] });
}
