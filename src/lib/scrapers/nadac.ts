import { BaseScraper } from "./base";
import { ScrapePageResult } from "@/types/scraper";

/**
 * NADAC (North American Dog Agility Council) scraper.
 *
 * Status: NOT SCRAPEABLE (as of March 2026)
 *
 * NADAC's trial calendar system at /trial_sec/Calendar_list.php is currently
 * broken — their PHP code uses deprecated MYSQL_ASSOC constants that were
 * removed in PHP 7.0+, causing fatal errors on every page load.
 *
 * Their alternative portal at nadac.retool.com requires authentication
 * and doesn't expose any public API endpoints.
 *
 * The /play/ page is a WordPress shell that links to the broken PHP calendar
 * and authenticated Retool apps — no publicly accessible trial data exists.
 *
 * This scraper returns empty results until NADAC fixes their calendar
 * or provides an alternative public data source.
 */
export class NadacScraper extends BaseScraper {
  constructor() {
    super("nadac", {
      requestDelay: 2000,
      timeout: 30000,
    });
  }

  async scrape(): Promise<ScrapePageResult> {
    console.warn(
      "[nadac] NADAC trial calendar is currently broken (PHP MYSQL_ASSOC error). " +
        "No public data source available. Returning empty results."
    );

    // Return empty result — NADAC has no scrapeable public calendar
    return this.buildResult([]);
  }
}
