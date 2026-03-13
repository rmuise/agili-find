import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * POST /api/judges/:slug/course-maps — Upload a course map image for a judge.
 * Accepts multipart form data with: file, caption?, class_name?
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServerClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the judge
  const { data: judge, error: judgeError } = await supabase
    .from("judges")
    .select("id")
    .eq("slug", slug)
    .single();

  if (judgeError || !judge) {
    return NextResponse.json({ error: "Judge not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const caption = (formData.get("caption") as string) || null;
  const className = (formData.get("class_name") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File must be under 5MB" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `course-maps/${judge.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("judge-assets")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("judge-assets").getPublicUrl(filePath);

  // Insert metadata
  const { data: courseMap, error: insertError } = await supabase
    .from("judge_course_maps")
    .insert({
      judge_id: judge.id,
      image_url: publicUrl,
      caption,
      class_name: className,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to save course map" },
      { status: 500 }
    );
  }

  return NextResponse.json(courseMap, { status: 201 });
}
