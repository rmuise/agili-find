import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/judges/:slug/course-maps
 *
 * Upload a course map image for a judge. Authenticated users only.
 * All uploads default to is_approved = false — an admin must approve
 * before the map appears publicly on the judge's profile.
 *
 * Accepts multipart form data:
 *   file         — image file (required, image/*, max 10 MB)
 *   course_type  — string, e.g. "Standard", "Jumpers" (optional)
 *   source_label — human-readable source, e.g. "AKC Regionals 2024" (optional)
 *   caption      — free-text caption (optional)
 *   trial_id     — UUID of associated trial (optional)
 *
 * FUTURE HOOK:
 *   PATCH /api/admin/course-maps/:id/approve  →  sets is_approved = true
 *   A future admin UI will list rows WHERE is_approved = false for moderation.
 *   Do not build this now — this comment marks the integration point.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Use the server (user-scoped) client to check auth via cookies
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin client for storage upload + DB insert (bypasses RLS for these operations)
  const admin = createAdminClient();

  // Find the judge by slug
  const { data: judge, error: judgeError } = await admin
    .from("judges")
    .select("id")
    .eq("slug", slug)
    .single();

  if (judgeError || !judge) {
    return NextResponse.json({ error: "Judge not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const courseType = (formData.get("course_type") as string) || null;
  const sourceLabel = (formData.get("source_label") as string) || null;
  const caption = (formData.get("caption") as string) || null;
  const trialId = (formData.get("trial_id") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  // Validate file type — images only for now (PDF support can be added via admin tooling)
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  // Validate file size — 10 MB max (spec requirement)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be under 10 MB" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage bucket "judge-assets"
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `course-maps/${judge.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("judge-assets")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[course-maps] Storage upload error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }

  // Get public URL for storage (bucket is configured as public in judge-assets)
  const {
    data: { publicUrl },
  } = admin.storage.from("judge-assets").getPublicUrl(filePath);

  // Insert metadata — is_approved defaults to false; admin must approve before display
  const { error: insertError } = await admin
    .from("judge_course_maps")
    .insert({
      judge_id: judge.id,
      trial_id: trialId || null,
      image_url: publicUrl,
      caption,
      class_name: courseType,
      source_label: sourceLabel,
      uploaded_by: user.id,
      is_approved: false,
    });

  if (insertError) {
    console.error("[course-maps] DB insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to save course map" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message:
        "Thank you! Your course map has been submitted for review and will appear once approved.",
      pending: true,
    },
    { status: 201 }
  );
}
