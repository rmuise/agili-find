import { BaseScraper } from "./base";
import { ScrapePageResult } from "@/types/scraper";

/**
 * NADAC (North American Dog Agility Council) scraper.
 *
 * NADAC's trial calendar is managed through their Retool-based portal
 * (nadac.retool.com) and doesn't expose a publicly scrapeable event listing.
 * The /play/ page on nadac.com loads content dynamically via JavaScript
 * which requires a headless browser to scrape.
 *
 * This is a placeholder scraper that logs a warning.
 * TODO: Implement using Puppeteer/Playwright when headless browser support
 * is available, or find an alternative data source.
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
      "[nadac] NADAC scraper is not yet implemented. " +
        "NADAC events are managed through their Retool portal and " +
        "don't expose a publicly scrapeable listing."
    );

    // Return empty result — no trials scraped
    return this.buildResult([]);
  }
}
