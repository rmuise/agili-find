/**
 * POST /api/body-workers/register
 *
 * Self-registration endpoint for K9 body workers.
 * Requires the user to be authenticated (any role).
 *
 * Accepts multipart/form-data so that a photo can be uploaded in the same
 * request. Non-photo fields are included as form fields alongside the file.
 *
 * Sets: source = 'self_registered', is_claimed = true, user_id = authenticated user ID.
 *
 * Photo is uploaded to the "body-worker-photos" Supabase Storage bucket
 * and the public URL is stored in body_workers.photo_url.
 *
 * Returns the newly created body_worker record on success.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  // Authenticate the requesting user (any authenticated user may register)
  const serverClient = await createClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for duplicate registration (same user already has a profile)
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("body_workers")
    .select("id, name, slug")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      {
        error: "A profile already exists for your account",
        existing: { id: existing.id, name: existing.name, slug: existing.slug },
      },
      { status: 409 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let name: string;
  let business_name: string | null = null;
  let bio: string | null = null;
  let modalities: string[] = [];
  let certifications: string[] | null = null;
  let service_area: string | null = null;
  let travels_to_trials = false;
  let booking_url: string | null = null;
  let website_url: string | null = null;
  let email: string | null = null;
  let phone: string | null = null;
  let instagram_url: string | null = null;
  let facebook_url: string | null = null;
  let photoFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    name = (formData.get("name") as string | null)?.trim() ?? "";
    business_name = (formData.get("business_name") as string | null)?.trim() || null;
    bio = (formData.get("bio") as string | null)?.trim() || null;
    modalities = JSON.parse((formData.get("modalities") as string) || "[]");
    certifications = JSON.parse((formData.get("certifications") as string) || "null");
    service_area = (formData.get("service_area") as string | null)?.trim() || null;
    travels_to_trials = formData.get("travels_to_trials") === "true";
    booking_url = (formData.get("booking_url") as string | null)?.trim() || null;
    website_url = (formData.get("website_url") as string | null)?.trim() || null;
    email = (formData.get("email") as string | null)?.trim() || null;
    phone = (formData.get("phone") as string | null)?.trim() || null;
    instagram_url = (formData.get("instagram_url") as string | null)?.trim() || null;
    facebook_url = (formData.get("facebook_url") as string | null)?.trim() || null;
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      photoFile = photo;
    }
  } else {
    const body = await request.json();
    name = body.name?.trim() ?? "";
    business_name = body.business_name?.trim() || null;
    bio = body.bio?.trim() || null;
    modalities = Array.isArray(body.modalities) ? body.modalities : [];
    certifications = Array.isArray(body.certifications) ? body.certifications : null;
    service_area = body.service_area?.trim() || null;
    travels_to_trials = !!body.travels_to_trials;
    booking_url = body.booking_url?.trim() || null;
    website_url = body.website_url?.trim() || null;
    email = body.email?.trim() || null;
    phone = body.phone?.trim() || null;
    instagram_url = body.instagram_url?.trim() || null;
    facebook_url = body.facebook_url?.trim() || null;
  }

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!Array.isArray(modalities) || modalities.length === 0) {
    return NextResponse.json(
      { error: "At least one modality is required" },
      { status: 400 }
    );
  }

  // Check for possible duplicate by name (same name already exists, prompt claim flow)
  const { data: nameDuplicate } = await admin
    .from("body_workers")
    .select("id, name, slug, is_claimed")
    .ilike("name", name)
    .single();

  if (nameDuplicate && !nameDuplicate.is_claimed) {
    return NextResponse.json(
      {
        error: "A profile may already exist for you",
        existing: {
          id: nameDuplicate.id,
          name: nameDuplicate.name,
          slug: nameDuplicate.slug,
          message:
            "This profile was auto-created from a trial listing. Claim it to take ownership.",
        },
      },
      { status: 409 }
    );
  }

  // Upload photo if provided
  let photo_url: string | null = null;
  if (photoFile) {
    // Client-side also validates, but enforce server-side as well
    if (photoFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Photo must be under 5 MB" },
        { status: 400 }
      );
    }

    const ext = photoFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const allowedExts = ["jpg", "jpeg", "png", "webp"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: "Photo must be a JPG, PNG, or WebP image" },
        { status: 400 }
      );
    }

    const filePath = `photos/${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const arrayBuffer = await photoFile.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from("body-worker-photos")
      .upload(filePath, arrayBuffer, {
        contentType: photoFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[POST /api/body-workers/register] Photo upload failed:", uploadError);
      return NextResponse.json(
        { error: "Photo upload failed — please try again" },
        { status: 500 }
      );
    }

    const { data: urlData } = admin.storage
      .from("body-worker-photos")
      .getPublicUrl(filePath);
    photo_url = urlData.publicUrl;
  }

  // Generate slug (with collision handling)
  let slug = slugify(name);
  const { data: slugCheck } = await admin
    .from("body_workers")
    .select("id")
    .eq("slug", slug)
    .single();
  if (slugCheck) {
    slug = `${slug}-${Date.now()}`;
  }

  // Insert body worker record
  const { data: newWorker, error: insertError } = await admin
    .from("body_workers")
    .insert({
      user_id: user.id,
      name,
      slug,
      business_name,
      modalities,
      certifications,
      bio,
      service_area,
      travels_to_trials,
      booking_url,
      website_url,
      email,
      phone,
      instagram_url,
      facebook_url,
      photo_url,
      source: "self_registered",
      is_claimed: true,
      is_verified: false,
    })
    .select("*")
    .single();

  if (insertError || !newWorker) {
    console.error("[POST /api/body-workers/register] Insert failed:", insertError);
    return NextResponse.json(
      { error: "Registration failed — please try again" },
      { status: 500 }
    );
  }

  return NextResponse.json({ body_worker: newWorker }, { status: 201 });
}
