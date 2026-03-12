import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ seminarId: string }> };

/**
 * DELETE /api/seminars/[seminarId] — Delete own seminar
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { seminarId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("seminars")
    .delete()
    .eq("id", seminarId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Deleted" });
}

/**
 * PATCH /api/seminars/[seminarId] — Update own seminar
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { seminarId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const allowedFields = [
    "title", "description", "instructor", "start_date", "end_date",
    "venue_name", "address", "city", "state", "country",
    "contact_email", "contact_url", "price",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (body.lat && body.lng) {
    updateData.lat = body.lat;
    updateData.lng = body.lng;
    updateData.location = `POINT(${body.lng} ${body.lat})`;
  }

  const { data, error } = await supabase
    .from("seminars")
    .update(updateData)
    .eq("id", seminarId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seminar: data });
}
