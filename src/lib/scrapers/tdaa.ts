import * as cheerio from "cheerio";
import { BaseScraper } from "./base";
import type { ScrapedTrial, ScrapePageResult } from "@/types/scraper";

/**
 * TDAA (Teacup Dogs Agility Association) scraper
 * Scrapes the TDAA event calendar from their website
 */
export class TdaaScraper extends BaseScraper {
  constructor() {
    super("tdaa", { requestDelay: 3000 });
  }

  async scrape(): Promise<ScrapePageResult> {
    const url = "https://k9tdaa.com/events/";
    const trials: ScrapedTrial[] = [];

    try {
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      // TDAA uses a WordPress events calendar plugin
      $(".tribe-events-calendar-list__event-row, .type-tribe_events, .tribe-events-list .tribe-events-loop .type-tribe_events, .event-item, article.post").each(
        (_, el) => {
          try {
            const $el = $(el);

            const titleEl = $el.find("h2 a, h3 a, .tribe-events-list-event-title a, .entry-title a").first();
            const title = titleEl.text().trim();
            const sourceUrl = titleEl.attr("href") || "";

            if (!title) return;

            // Extract date
            const dateText = $el
              .find(".tribe-events-schedule-details, .tribe-event-schedule-details, time, .event-date, .entry-date")
              .first()
              .text()
              .trim();

            // Extract location
            const venueText = $el
              .find(".tribe-venue, .tribe-events-venue-details, .event-venue, .event-location")
              .first()
              .text()
              .trim();

            const dates = this.parseDateRange(dateText);
            if (!dates) return;

            const location = this.parseLocation(venueText);

            const slug = sourceUrl.split("/").filter(Boolean).pop() ||
              title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

            trials.push({
              external_id: `tdaa-${slug}`,
              organization_id: "tdaa",
              title,
              hosting_club: null,
              start_date: dates.start,
              end_date: dates.end,
              entry_open_date: null,
              entry_close_date: null,
              classes: [],
              judges: [],
              secretary_name: null,
              source_url: sourceUrl.startsWith("http")
                ? sourceUrl
                : `https://k9tdaa.com${sourceUrl}`,
              venue: {
                name: location.venue,
                address_raw: venueText,
                city: location.city,
                state: location.state,
                postal_code: null,
                country: "US",
                lat: null,
                lng: null,
              },
              raw_data: { dateText, venueText },
            });
          } catch (err) {
            console.warn("[tdaa] Failed to parse trial entry:", err);
          }
        }
      );
    } catch (error) {
      console.error("[tdaa] Scrape failed:", error);
    }

    return this.buildResult(trials);
  }

  private parseDateRange(
    text: string
  ): { start: string; end: string } | null {
    if (!text) return null;

    // Range: "March 15 - 17, 2026"
    const rangeMatch = text.match(
      /(\w+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s*(\d{4})/
    );
    if (rangeMatch) {
      const [, month, startDay, endDay, year] = rangeMatch;
      const start = this.parseDate(`${month} ${startDay}, ${year}`);
      const end = this.parseDate(`${month} ${endDay}, ${year}`);
      if (start && end) return { start, end };
    }

    // Cross-month: "March 30 - April 1, 2026"
    const crossMatch = text.match(
      /(\w+)\s+(\d{1,2})\s*[-–]\s*(\w+)\s+(\d{1,2}),?\s*(\d{4})/
    );
    if (crossMatch) {
      const [, m1, d1, m2, d2, year] = crossMatch;
      const start = this.parseDate(`${m1} ${d1}, ${year}`);
      const end = this.parseDate(`${m2} ${d2}, ${year}`);
      if (start && end) return { start, end };
    }

    // Single: "March 15, 2026"
    const singleMatch = text.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
    if (singleMatch) {
      const date = this.parseDate(singleMatch[0]);
      if (date) return { start: date, end: date };
    }

    return null;
  }

  private parseLocation(text: string): {
    venue: string;
    city: string;
    state: string;
  } {
    const csMatch = text.match(/([A-Za-z\s.]+),\s*([A-Z]{2})/);
    const city = csMatch ? csMatch[1].trim() : "";
    const state = csMatch ? csMatch[2] : "";
    const venue = text.split(",")[0].trim();
    return { venue: venue || "Unknown Venue", city, state };
  }
}
