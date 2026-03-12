import { NextRequest, NextResponse } from "next/server";
import { AkcScraper } from "@/lib/scrapers/akc";
import { UsdaaScraper } from "@/lib/scrapers/usdaa";
import { CpeScraper } from "@/lib/scrapers/cpe";
import { NadacScraper } from "@/lib/scrapers/nadac";
import { UkiScraper } from "@/lib/scrapers/uki";
import { CkcScraper } from "@/lib/scrapers/ckc";
import { processScraperChunk } from "@/lib/scrapers/processor";
import { BaseScraper } from "@/lib/scrapers/base";
import { OrganizationId } from "@/types/trial";

/**
 * Test endpoint to run scrapers manually.
 * GET /api/test-scrape?org=akc&chunks=1
 *
 * Supported orgs: akc, usdaa, cpe, nadac, uki, ckc
 * Protected by CRON_SECRET for safety.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = (request.nextUrl.searchParams.get("org") || "akc") as OrganizationId;
  const chunks = parseInt(
    request.nextUrl.searchParams.get("chunks") || "1",
    10
  );

  const scraper = createScraper(orgId);
  if (!scraper) {
    return NextResponse.json(
      { error: `Unknown org: ${orgId}. Use: akc, usdaa, cpe, nadac, uki, ckc` },
      { status: 400 }
    );
  }

  const allStats = [];
  let cursor: unknown = undefined;

  for (let i = 0; i < chunks; i++) {
    console.log(`\n--- [${orgId}] Processing chunk ${i + 1}/${chunks} ---`);
    const { stats, nextCursor, hasMore } = await processScraperChunk(
      scraper,
      orgId,
      cursor
    );
    allStats.push(stats);
    cursor = nextCursor;

    if (!hasMore) {
      console.log(`[${orgId}] No more chunks to process`);
      break;
    }
  }

  return NextResponse.json({
    org: orgId,
    message: `Processed ${allStats.length} chunk(s) for ${orgId}`,
    stats: allStats,
  });
}

function createScraper(orgId: OrganizationId): BaseScraper | null {
  switch (orgId) {
    case "akc":
      return new AkcScraper();
    case "usdaa":
      return new UsdaaScraper();
    case "cpe":
      return new CpeScraper();
    case "nadac":
      return new NadacScraper();
    case "uki":
      return new UkiScraper();
    case "ckc":
      return new CkcScraper();
    default:
      return null;
  }
}
