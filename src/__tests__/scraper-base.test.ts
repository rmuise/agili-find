import { describe, it, expect } from "vitest";
import { BaseScraper } from "@/lib/scrapers/base";
import type { ScrapePageResult } from "@/types/scraper";

class TestScraper extends BaseScraper {
  constructor() {
    super("akc", { requestDelay: 0 });
  }

  async scrape(): Promise<ScrapePageResult> {
    return this.buildResult([]);
  }

  // Expose protected methods for testing
  public testParseDate(dateStr: string) {
    return this.parseDate(dateStr);
  }

  public testBuildResult(trials: [], cursor?: unknown) {
    return this.buildResult(trials, cursor);
  }
}

describe("BaseScraper", () => {
  const scraper = new TestScraper();

  describe("parseDate", () => {
    it("parses ISO date strings", () => {
      expect(scraper.testParseDate("2026-03-15")).toBe("2026-03-15");
    });

    it("parses date strings with time", () => {
      expect(scraper.testParseDate("2026-03-15T10:00:00Z")).toBe("2026-03-15");
    });

    it("parses common US date formats", () => {
      expect(scraper.testParseDate("March 15, 2026")).toBe("2026-03-15");
    });

    it("returns null for invalid dates", () => {
      expect(scraper.testParseDate("not a date")).toBeNull();
    });

    it("handles whitespace", () => {
      expect(scraper.testParseDate("  2026-03-15  ")).toBe("2026-03-15");
    });
  });

  describe("buildResult", () => {
    it("returns correct structure with no cursor", () => {
      const result = scraper.testBuildResult([]);
      expect(result.trials).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.cursor).toBeUndefined();
      expect(result.scrapedAt).toBeDefined();
    });

    it("returns hasMore=true when cursor is provided", () => {
      const result = scraper.testBuildResult([], { page: 2 });
      expect(result.hasMore).toBe(true);
      expect(result.cursor).toEqual({ page: 2 });
    });
  });

  describe("scrape", () => {
    it("returns empty results by default", async () => {
      const result = await scraper.scrape();
      expect(result.trials).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });
});
