import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ spaceId: string }> };

/**
 * DELETE /api/training-spaces/[spaceId] — Delete own training space
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { spaceId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("training_spaces")
    .delete()
    .eq("id", spaceId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Deleted" });
}

/**
 * PATCH /api/training-spaces/[spaceId] — Update own training space
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { spaceId } = await context.params;
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
    "name", "description", "surface_type", "indoor", "has_equipment",
    "equipment_details", "address", "city", "state", "country",
    "contact_email", "contact_phone", "website", "rental_info",
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
    .from("training_spaces")
    .update(updateData)
    .eq("id", spaceId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ space: data });
}
