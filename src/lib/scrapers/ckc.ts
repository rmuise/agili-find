import { BaseScraper } from "./base";
import { ScrapePageResult } from "@/types/scraper";

/**
 * CKC (Canadian Kennel Club) scraper.
 *
 * CKC's event calendar at ckc.ca/Event-Calendar/Default.aspx is a dynamic
 * ASP.NET form that requires JavaScript execution and postback handling
 * to retrieve event data. The page shows "No events found" until a search
 * is performed with specific criteria.
 *
 * This is a placeholder scraper that logs a warning.
 * TODO: Implement using the CKC search form or find an alternative source
 * like canuckdogs.com which aggregates CKC event data.
 */
export class CkcScraper extends BaseScraper {
  constructor() {
    super("ckc", {
      requestDelay: 2000,
      timeout: 30000,
    });
  }

  async scrape(): Promise<ScrapePageResult> {
    console.warn(
      "[ckc] CKC scraper is not yet implemented. " +
        "CKC's event calendar requires JavaScript/ASP.NET postback. " +
        "Consider scraping canuckdogs.com as an alternative data source."
    );

    // Return empty result — no trials scraped
    return this.buildResult([]);
  }
}
