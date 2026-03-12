import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/db";
import { processScraperChunk } from "@/lib/scrapers/processor";
import { AkcScraper } from "@/lib/scrapers/akc";
import { OrganizationId } from "@/types/trial";
import { BaseScraper } from "@/lib/scrapers/base";

/**
 * Process one pending scrape job from the queue.
 * Called every 5 min by GitHub Actions, or manually for testing.
 * Each invocation processes ONE org chunk to stay under Vercel's 60s limit.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  // 1. Grab the oldest pending job
  const { data: job, error: fetchError } = await supabase
    .from("scrape_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (fetchError || !job) {
    return NextResponse.json({ message: "No pending jobs" });
  }

  // 2. Mark as processing
  await supabase
    .from("scrape_queue")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.id);

  try {
    // 3. Create the appropriate scraper
    const scraper = createScraper(job.organization_id as OrganizationId);
    if (!scraper) {
      throw new Error(`No scraper for org: ${job.organization_id}`);
    }

    // 4. Process one chunk
    const { stats, nextCursor, hasMore } = await processScraperChunk(
      scraper,
      job.organization_id as OrganizationId,
      job.cursor
    );

    // 5. Log the scrape run
    await supabase.from("scrape_log").insert({
      organization_id: job.organization_id,
      trials_found: stats.trials_found,
      trials_added: stats.trials_added,
      trials_updated: stats.trials_updated,
      errors: stats.errors,
      duration_ms: stats.duration_ms,
    });

    if (hasMore) {
      // More chunks to process — update cursor, reset to pending
      await supabase
        .from("scrape_queue")
        .update({
          status: "pending",
          cursor: nextCursor as Record<string, unknown>,
        })
        .eq("id", job.id);

      return NextResponse.json({
        message: "Chunk processed, more remaining",
        stats,
        hasMore: true,
      });
    } else {
      // All done
      await supabase
        .from("scrape_queue")
        .update({
          status: "complete",
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return NextResponse.json({
        message: "Scrape complete",
        stats,
        hasMore: false,
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[process-queue] Error:`, error);

    await supabase
      .from("scrape_queue")
      .update({
        status: "failed",
        error_message: msg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function createScraper(orgId: OrganizationId): BaseScraper | null {
  switch (orgId) {
    case "akc":
      return new AkcScraper();
    // Future scrapers:
    // case "usdaa": return new UsdaaScraper();
    // case "cpe": return new CpeScraper();
    // case "nadac": return new NadacScraper();
    // case "uki": return new UkiScraper();
    // case "ckc": return new CkcScraper();
    default:
      return null;
  }
}

/**
 * POST handler for manual testing — trigger a scrape for a specific org.
 * Usage: POST /api/cron/process-queue { "org": "akc" }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const orgId = body.org as OrganizationId;

  if (!orgId) {
    return NextResponse.json({ error: "Missing 'org' in body" }, { status: 400 });
  }

  const scraper = createScraper(orgId);
  if (!scraper) {
    return NextResponse.json(
      { error: `No scraper for org: ${orgId}` },
      { status: 400 }
    );
  }

  try {
    const { stats, hasMore, nextCursor } = await processScraperChunk(
      scraper,
      orgId,
      body.cursor
    );

    return NextResponse.json({ stats, hasMore, nextCursor });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
