import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return apiError("Unauthorized", 401);
  }

  const { trial_id, rating, comment, results } = await request.json();

  if (!trial_id) {
    return apiError("trial_id is required", 400);
  }

  if (rating && (rating < 1 || rating > 5)) {
    return apiError("Rating must be 1-5", 400);
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
    return apiError("Failed to save review", 500, error.message);
  }

  return NextResponse.json({ review: data });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const trialId = searchParams.get("trial_id");

  if (!trialId) {
    return apiError("trial_id required", 400);
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
