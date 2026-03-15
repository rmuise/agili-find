import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { BaseScraper } from "./base";
import { ScrapedTrial, ScrapePageResult } from "@/types/scraper";

/**
 * CKC / Canadian agility scraper via CanuckDogs.com.
 *
 * CanuckDogs aggregates Canadian agility trial data for CKC, AAC, NADAC, and UKI
 * events across 5 regions: Atlantic, Quebec, Ontario, Prairies, BC & Yukon.
 *
 * CanuckDogs is behind Cloudflare, so we use Playwright (headless Chromium)
 * to fetch the HTML, then parse with Cheerio. This scraper is designed to
 * run via GitHub Actions (not Vercel) since it needs a headless browser.
 *
 * Each region page lists all agility events for the current year with:
 * dates, club name, location (city, province), judges, entry dates, secretary info.
 */

const CANUCKDOGS_BASE =
  "https://www.canuckdogs.com/index.php?PageKey=f26933f4-6fbb-102d-a31e-4ebaba77265a&Type=4";

// RegionKey values for each Canadian region
const REGIONS: { name: string; key: string }[] = [
  { name: "Ontario", key: "e4c2f4a1-0b66-11df-b8b7-8ac0277f09ae" },
  { name: "BC & Yukon", key: "e4c30234-0b66-11df-b8b7-8ac0277f09ae" },
  { name: "Prairies", key: "e4c2fb70-0b66-11df-b8b7-8ac0277f09ae" },
  { name: "Quebec", key: "e4c2ecde-0b66-11df-b8b7-8ac0277f09ae" },
  { name: "Atlantic", key: "e4c2e56e-0b66-11df-b8b7-8ac0277f09ae" },
];

// Map Canadian province names to 2-letter codes
const PROVINCE_MAP: Record<string, string> = {
  ontario: "ON",
  "british columbia": "BC",
  alberta: "AB",
  saskatchewan: "SK",
  manitoba: "MB",
  quebec: "QC",
  "new brunswick": "NB",
  "nova scotia": "NS",
  "prince edward island": "PE",
  newfoundland: "NL",
  "newfoundland and labrador": "NL",
  yukon: "YT",
  "northwest territories": "NT",
  nunavut: "NU",
};

export class CkcScraper extends BaseScraper {
  constructor() {
    super("ckc", {
      requestDelay: 3000,
      timeout: 60000,
    });
  }

  async scrape(cursor?: unknown): Promise<ScrapePageResult> {
    // Use cursor to track which region we're on (0-4)
    const regionIndex = typeof cursor === "number" ? cursor : 0;

    if (regionIndex >= REGIONS.length) {
      return this.buildResult([]);
    }

    const region = REGIONS[regionIndex];
    const url = `${CANUCKDOGS_BASE}&RegionKey=${region.key}`;

    console.log(
      `[ckc] Fetching CanuckDogs ${region.name} (region ${regionIndex + 1}/${REGIONS.length})...`
    );

    // Use Playwright to bypass Cloudflare
    const html = await this.fetchWithPlaywright(url);
    const trials = this.parseRegionPage(html, region.name, url);

    console.log(`[ckc] Parsed ${trials.length} trials from ${region.name}`);

    const nextIndex = regionIndex + 1;
    const hasMore = nextIndex < REGIONS.length;

    return {
      trials,
      hasMore,
      cursor: hasMore ? nextIndex : undefined,
      scrapedAt: new Date().toISOString(),
    };
  }

  /**
   * Fetch HTML using Playwright headless Chromium to bypass Cloudflare.
   * Falls back to regular fetch if Playwright is not available.
   */
  private async fetchWithPlaywright(url: string): Promise<string> {
    try {
      // Dynamic import so it doesn't break the build if playwright isn't installed
      const { chromium } = await import("playwright");

      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });
      const page = await context.newPage();

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
        // Wait a bit for any dynamic content
        await page.waitForTimeout(2000);
        const html = await page.content();
        return html;
      } finally {
        await browser.close();
      }
    } catch (err) {
      console.error(
        "[ckc] Playwright not available or failed, trying direct fetch:",
        err instanceof Error ? err.message : err
      );
      // Fallback to direct fetch (will likely fail with Cloudflare)
      return this.fetchHtml(url);
    }
  }

  private parseRegionPage(
    html: string,
    regionName: string,
    pageUrl: string
  ): ScrapedTrial[] {
    const $ = cheerio.load(html);
    const trials: ScrapedTrial[] = [];
    const now = new Date();

    // Events are in <font> tags inside .column-2
    // Header format: "Month DD to Month DD, YYYY City, Province (Indoors/Outdoors)CLUB NAME [TYPE]"
    const allFonts = $("font");

    allFonts.each((_i, el) => {
      try {
        const text = $(el).text().trim();

        // Match event header
        const headerMatch = text.match(
          /^(\w+ \d{1,2}) to (\w+ \d{1,2}, \d{4})\s+(.+?)\s*\((\w+)\)\s*(.+)$/
        );
        if (!headerMatch) return;

        const startDateStr = headerMatch[1];
        const endDateStr = headerMatch[2];
        const locationStr = headerMatch[3].trim();
        const indoorOutdoor = headerMatch[4];
        const clubAndType = headerMatch[5].trim();

        // Extract year from end date
        const yearMatch = endDateStr.match(/(\d{4})/);
        if (!yearMatch) return;
        const year = yearMatch[1];

        // Parse dates
        const startDate = this.parseCanuckDate(startDateStr, year);
        const endDate = this.parseCanuckDate(endDateStr, "");
        if (!startDate || !endDate) return;

        // Skip past events
        if (new Date(endDate) < now) return;

        // Parse location
        const { city, province } = this.parseCanuckLocation(locationStr);

        // Parse club name and event type
        const typeMatch = clubAndType.match(/^(.+?)\s*\[(.+?)\]$/);
        const clubName = typeMatch ? typeMatch[1].trim() : clubAndType;
        const eventType = typeMatch ? typeMatch[2].trim() : "AGILITY";

        // Find sibling elements for details
        const parentEl = $(el).parent();
        const nextElements = parentEl.nextAll().slice(0, 10);

        // Extract judges
        const judges = this.extractJudges($, nextElements);

        // Extract entry dates
        const { openDate, closeDate } = this.extractEntryDates($, nextElements);

        // Extract secretary name
        const secretaryName = this.extractSecretary($, nextElements);

        // Extract source URL
        const sourceUrl = this.extractSourceUrl($, nextElements) || pageUrl;

        // Skip UKI-sanctioned events — the UKI scraper covers them independently
        // (CanuckDogs lists dual-sanctioned events under CKC, causing duplicates)
        if (eventType === "UKI") return;

        // Build external ID
        const externalId = `canuckdogs-${startDate}-${clubName
          .replace(/\s+/g, "-")
          .toLowerCase()
          .substring(0, 40)}`;

        // Build title — only append event type tag for non-standard agility events
        const title = `${clubName}${eventType !== "AGILITY" ? ` [${eventType}]` : ""}`;

        trials.push({
          external_id: externalId,
          organization_id: "ckc",
          title,
          hosting_club: clubName,
          start_date: startDate,
          end_date: endDate,
          entry_open_date: openDate,
          entry_close_date: closeDate,
          classes: [eventType, indoorOutdoor].filter(Boolean),
          judges,
          secretary_name: secretaryName,
          source_url: sourceUrl,
          venue: {
            name: clubName,
            address_raw: `${city}, ${province}, Canada`,
            city,
            state: province,
            postal_code: null,
            country: "CA",
            lat: null,
            lng: null,
          },
          raw_data: {
            region: regionName,
            headerText: text,
            indoorOutdoor,
            eventType,
          },
        });
      } catch (err) {
        console.error("[ckc] Error parsing event:", err);
      }
    });

    return trials;
  }

  private parseCanuckDate(dateStr: string, fallbackYear: string): string | null {
    const cleaned = dateStr.replace(/,/g, "").trim();
    const match = cleaned.match(/^(\w+)\s+(\d{1,2})\s*(\d{4})?$/);
    if (!match) return null;

    const monthName = match[1];
    const day = parseInt(match[2], 10);
    const year = match[3] || fallbackYear;
    if (!year) return null;

    const monthIndex = this.monthToNumber(monthName);
    if (monthIndex < 0) return null;

    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  private monthToNumber(month: string): number {
    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december",
    ];
    return months.indexOf(month.toLowerCase());
  }

  private parseCanuckLocation(location: string): {
    city: string;
    province: string;
  } {
    const parts = location.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      const city = parts[0];
      const provRaw = parts[parts.length - 1].toLowerCase();
      const province = PROVINCE_MAP[provRaw] || parts[parts.length - 1].toUpperCase();
      return { city, province };
    }
    return { city: location, province: "" };
  }

  private extractJudges(
    $: cheerio.CheerioAPI,
    siblings: cheerio.Cheerio<AnyNode>
  ): string[] {
    const judges: string[] = [];

    siblings.each((_i, el) => {
      const text = $(el).text();
      if (text.includes("Judging Panel:")) {
        const matches = text.matchAll(
          /Agility Trial\s*-\s*([A-Z][^A-Z\n]*?)(?=Agility Trial|Premium|$)/g
        );
        for (const m of matches) {
          const name = m[1].trim();
          if (name && name.length > 2 && name.length < 60) {
            judges.push(name);
          }
        }
      }
    });

    return [...new Set(judges)];
  }

  private extractEntryDates(
    $: cheerio.CheerioAPI,
    siblings: cheerio.Cheerio<AnyNode>
  ): { openDate: string | null; closeDate: string | null } {
    let openDate: string | null = null;
    let closeDate: string | null = null;

    siblings.each((_i, el) => {
      const text = $(el).text();

      const openMatch = text.match(
        /Opening Date:\s*\w+,\s*(\w+ \d{1,2}, \d{4})/
      );
      if (openMatch && !openDate) {
        openDate = this.parseCanuckDate(openMatch[1], "") || null;
      }

      const closeMatch = text.match(
        /Closing Date:\s*\w+,\s*(\w+ \d{1,2}, \d{4})/
      );
      if (closeMatch && !closeDate) {
        closeDate = this.parseCanuckDate(closeMatch[1], "") || null;
      }
    });

    return { openDate, closeDate };
  }

  private extractSecretary(
    $: cheerio.CheerioAPI,
    siblings: cheerio.Cheerio<AnyNode>
  ): string | null {
    let secretary: string | null = null;

    siblings.each((_i, el) => {
      const text = $(el).text();
      const match = text.match(
        /Show Secretary\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
      );
      if (match && !secretary) {
        secretary = match[1].trim();
      }
    });

    return secretary;
  }

  private extractSourceUrl(
    $: cheerio.CheerioAPI,
    siblings: cheerio.Cheerio<AnyNode>
  ): string | null {
    let url: string | null = null;

    siblings.each((_i, el) => {
      $(el)
        .find("a")
        .each((_j, a) => {
          const href = $(a).attr("href");
          const text = $(a).text().trim();
          if (
            href &&
            (text.includes("See all event details") ||
              text.includes("Online Entry"))
          ) {
            url = href.startsWith("http")
              ? href
              : `https://www.canuckdogs.com/${href.replace(/^\//, "")}`;
          }
        });
    });

    return url;
  }
}
