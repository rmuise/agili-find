import { NextRequest, NextResponse } from "next/server";
import { AkcScraper } from "@/lib/scrapers/akc";
import { processScraperChunk } from "@/lib/scrapers/processor";

/**
 * Test endpoint to run the AKC scraper manually.
 * GET /api/test-scrape?chunks=1
 *
 * Protected by CRON_SECRET for safety.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chunks = parseInt(
    request.nextUrl.searchParams.get("chunks") || "1",
    10
  );

  const scraper = new AkcScraper();
  const allStats = [];
  let cursor: unknown = undefined;

  for (let i = 0; i < chunks; i++) {
    console.log(`\n--- Processing chunk ${i + 1}/${chunks} ---`);
    const { stats, nextCursor, hasMore } = await processScraperChunk(
      scraper,
      "akc",
      cursor
    );
    allStats.push(stats);
    cursor = nextCursor;

    if (!hasMore) {
      console.log("No more chunks to process");
      break;
    }
  }

  return NextResponse.json({
    message: `Processed ${allStats.length} chunks`,
    stats: allStats,
  });
}
