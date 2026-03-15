import * as cheerio from "cheerio";
import { BaseScraper } from "./base";
import { ScrapedTrial, ScrapePageResult } from "@/types/scraper";

const USDAA_CALENDAR_URL =
  "https://www.usdaa.com/events/event-calendar.cfm";

/**
 * USDAA Event Calendar scraper.
 * Scrapes the HTML table at the USDAA events calendar page.
 * The table has columns: Dates, Event/Host, Event Location, Event Type.
 * All events are on a single page (no pagination needed).
 */
export class UsdaaScraper extends BaseScraper {
  constructor() {
    super("usdaa", {
      requestDelay: 2000,
      timeout: 30000,
    });
  }

  async scrape(): Promise<ScrapePageResult> {
    console.log("[usdaa] Fetching event calendar...");
    const html = await this.fetchHtml(USDAA_CALENDAR_URL);
    const $ = cheerio.load(html);

    const trials: ScrapedTrial[] = [];
    const rows = $("table tbody tr");

    console.log(`[usdaa] Found ${rows.length} table rows`);

    rows.each((_i, row) => {
      try {
        const cells = $(row).find("td");
        if (cells.length < 4) return;

        const datesText = $(cells[0]).text().trim();
        const eventHostCell = $(cells[1]);
        const locationText = $(cells[2]).text().trim();
        const eventType = $(cells[3]).text().trim();

        // Parse dates: "MM/DD/YYYY - MM/DD/YYYY" or "MM/DD/YYYY"
        const { startDate, endDate } = this.parseDateRange(datesText);
        if (!startDate) return;

        // Event host — may contain a link to event details
        const hostLink = eventHostCell.find("a").first();
        const hostName = hostLink.length
          ? hostLink.text().trim()
          : eventHostCell.text().trim();
        const eventUrl = hostLink.attr("href") || null;

        // Location format: "ST, City" (e.g., "FL, Apopka")
        const { state, city } = this.parseLocation(locationText);

        // Build external ID from date + host
        const externalId = `usdaa-${startDate}-${hostName
          .replace(/\s+/g, "-")
          .toLowerCase()
          .substring(0, 40)}`;

        const sourceUrl = eventUrl
          ? eventUrl.startsWith("http")
            ? eventUrl
            : `https://www.usdaa.com${eventUrl}`
          : USDAA_CALENDAR_URL;

        trials.push({
          external_id: externalId,
          organization_id: "usdaa",
          title: hostName,
          hosting_club: hostName,
          start_date: startDate,
          end_date: endDate || startDate,
          entry_open_date: null,
          entry_close_date: null,
          classes: eventType ? [eventType] : [],
          judges: [],
          secretary_name: null,
          source_url: sourceUrl,
          venue: {
            name: hostName,
            address_raw: `${city}, ${state}`,
            city: city || "",
            state: state || "",
            postal_code: null,
            country: "US",
            lat: null,
            lng: null,
          },
          raw_data: {
            dates: datesText,
            host: hostName,
            location: locationText,
            eventType,
          },
        });
      } catch (err) {
        console.error("[usdaa] Error parsing row:", err);
      }
    });

    console.log(`[usdaa] Parsed ${trials.length} trials`);
    return this.buildResult(trials);
  }

  private parseDateRange(text: string): {
    startDate: string | null;
    endDate: string | null;
  } {
    // Format: "03/13/2026 - 03/15/2026" or "03/13/2026"
    const parts = text.split("-").map((p) => p.trim());
    const startDate = this.parseUsDate(parts[0]);
    const endDate = parts[1] ? this.parseUsDate(parts[1]) : null;
    return { startDate, endDate };
  }

  private parseUsDate(text: string): string | null {
    // MM/DD/YYYY → YYYY-MM-DD
    const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return null;
    return `${match[3]}-${match[1]}-${match[2]}`;
  }

  private parseLocation(text: string): { state: string; city: string } {
    // Format: "FL, Apopka" or "CA, Santa Rosa"
    const parts = text.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      const candidate = parts[0];
      // Validate: state should be a 2-letter uppercase code
      if (/^[A-Z]{2}$/.test(candidate)) {
        return { state: candidate, city: parts.slice(1).join(", ") };
      }
      // Fields may be swapped or malformed — log and skip coordinates
      console.warn(`[usdaa] Unexpected location format: "${text}" — state candidate "${candidate}" is not a 2-letter code`);
    }
    return { state: "", city: text };
  }
}
