import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "admin";
}

// GET: Fetch items pending moderation
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const [{ data: seminars }, { data: trainingSpaces }] = await Promise.all([
    admin
      .from("seminars")
      .select("id, title, instructor, city, state, status, created_at, user_id, profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("training_spaces")
      .select("id, name, city, state, status, created_at, user_id, profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    seminars: seminars || [],
    trainingSpaces: trainingSpaces || [],
  });
}

// PATCH: Update status of a seminar or training space
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, id, status } = await request.json();

  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createAdminClient();
  const table = type === "seminar" ? "seminars" : "training_spaces";

  const { error } = await admin
    .from(table)
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: `${type} ${status}` });
}
