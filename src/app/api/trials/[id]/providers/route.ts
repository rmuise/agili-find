import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * GET /api/trials/:id/providers
 *
 * Simple flat list of providers associated with a trial.
 * Used internally by the services endpoint and for lightweight lookups.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trialId } = await params;

  if (!trialId) {
    return NextResponse.json({ error: "Trial ID is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from("srv_trial_associations")
      .select(`
        id,
        is_attending,
        association_note,
        created_at,
        srv_providers (
          id,
          provider_type,
          business_name,
          contact_name,
          email,
          phone,
          website_url,
          description,
          logo_url,
          location_city,
          location_province,
          service_radius_km,
          is_verified
        )
      `)
      .eq("trial_id", trialId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching providers:", error);
      return NextResponse.json(
        { error: "Failed to fetch providers", details: error.message },
        { status: 500 }
      );
    }

    const providers = (data || []).map((row) => ({
      association_id: row.id,
      is_attending: row.is_attending,
      association_note: row.association_note,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(row.srv_providers as any),
    }));

    return NextResponse.json({ providers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Providers endpoint error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
