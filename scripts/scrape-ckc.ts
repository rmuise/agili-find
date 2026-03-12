/**
 * Standalone script to scrape all Canadian agility regions from CanuckDogs.
 * Run with: npx tsx scripts/scrape-ckc.ts
 *
 * This uses Playwright to bypass Cloudflare, so it must run in an
 * environment with a headless browser (local machine or GitHub Actions).
 */

import { CkcScraper } from "../src/lib/scrapers/ckc";
import { processScraperChunk } from "../src/lib/scrapers/processor";

async function main() {
  console.log("Starting CKC/CanuckDogs scraper for all regions...\n");

  const scraper = new CkcScraper();
  let cursor: unknown = undefined;
  let totalTrials = 0;
  let chunk = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    chunk++;
    console.log(`\n=== Processing chunk ${chunk} (cursor: ${JSON.stringify(cursor)}) ===`);

    try {
      const { stats, nextCursor, hasMore } = await processScraperChunk(
        scraper,
        "ckc",
        cursor
      );

      console.log(`  Found: ${stats.trials_found}, Added: ${stats.trials_added}, Updated: ${stats.trials_updated}`);
      console.log(`  Duration: ${stats.duration_ms}ms`);

      if (stats.errors.length > 0) {
        console.log(`  Errors:`, stats.errors);
      }

      totalTrials += stats.trials_found;
      cursor = nextCursor;

      if (!hasMore) {
        console.log("\nAll regions complete!");
        break;
      }

      // Rate limit between regions
      console.log("  Waiting 3s before next region...");
      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  Error in chunk ${chunk}:`, err);
      break;
    }
  }

  console.log(`\nTotal trials scraped: ${totalTrials}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
