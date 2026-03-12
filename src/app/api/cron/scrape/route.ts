import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/db";
import { OrganizationId } from "@/types/trial";

const ACTIVE_ORGS: OrganizationId[] = ["akc"];

/**
 * Vercel cron job: enqueue scrape jobs for each active organization.
 * Runs daily at 4am UTC (configured in vercel.json).
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  const jobs = [];
  for (const orgId of ACTIVE_ORGS) {
    const { data, error } = await supabase
      .from("scrape_queue")
      .insert({
        organization_id: orgId,
        status: "pending",
        cursor: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`Failed to enqueue ${orgId}:`, error);
      jobs.push({ org: orgId, error: error.message });
    } else {
      jobs.push({ org: orgId, jobId: data.id });
    }
  }

  return NextResponse.json({
    message: `Enqueued ${jobs.filter((j) => !("error" in j)).length} scrape jobs`,
    jobs,
  });
}
