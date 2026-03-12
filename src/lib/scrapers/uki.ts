import * as cheerio from "cheerio";
import { BaseScraper } from "./base";
import { ScrapedTrial, ScrapePageResult } from "@/types/scraper";

const UKI_DIARY_URL =
  "https://entries.ukagilityinternational.com/showdiary.aspx";

/**
 * UKI (UK Agility International) Show Diary scraper.
 * Scrapes the HTML table at entries.ukagilityinternational.com/showdiary.aspx
 * Columns: Trial Dates, Trial Name, Location, Entry Opens, Closes, Actions
 * All events are on a single page (no pagination needed).
 */
export class UkiScraper extends BaseScraper {
  constructor() {
    super("uki", {
      requestDelay: 2000,
      timeout: 30000,
    });
  }

  async scrape(): Promise<ScrapePageResult> {
    console.log("[uki] Fetching show diary...");
    const html = await this.fetchHtml(UKI_DIARY_URL);
    const $ = cheerio.load(html);

    const trials: ScrapedTrial[] = [];
    const rows = $("table tr");

    console.log(`[uki] Found ${rows.length} table rows`);

    // Skip header row(s)
    rows.each((_i, row) => {
      try {
        const cells = $(row).find("td");
        if (cells.length < 5) return;

        const datesText = $(cells[0]).text().trim();
        const trialName = $(cells[1]).text().trim();
        const locationText = $(cells[2]).text().trim();
        const entryOpensText = $(cells[3]).text().trim();
        const closesText = $(cells[4]).text().trim();

        // Skip header rows
        if (datesText === "Trial Dates" || !datesText) return;

        // Parse dates
        const { startDate, endDate } = this.parseDateRange(datesText);
        if (!startDate) return;

        // Skip past events
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const endDateObj = new Date((endDate || startDate) + "T00:00:00");
        if (endDateObj < now) return;

        // Parse location: "City, ST" (e.g., "Barto, PA")
        const { city, state } = this.parseLocation(locationText);

        // Parse entry dates
        const entryOpenDate = this.parseShortDate(entryOpensText);
        const entryCloseDate = this.parseShortDate(closesText);

        // Get Documents link for source URL
        const docsLink = $(cells[5])?.find("a").first().attr("href") || null;
        const sourceUrl = docsLink
          ? docsLink.startsWith("http")
            ? docsLink
            : `https://entries.ukagilityinternational.com/${docsLink}`
          : UKI_DIARY_URL;

        // Build external ID
        const externalId = `uki-${startDate}-${trialName
          .replace(/\s+/g, "-")
          .toLowerCase()
          .substring(0, 40)}`;

        trials.push({
          external_id: externalId,
          organization_id: "uki",
          title: trialName,
          hosting_club: trialName.replace(/\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i, ""),
          start_date: startDate,
          end_date: endDate || startDate,
          entry_open_date: entryOpenDate,
          entry_close_date: entryCloseDate,
          classes: [],
          judges: [],
          secretary_name: null,
          source_url: sourceUrl,
          venue: {
            name: trialName,
            address_raw: locationText,
            city,
            state,
            postal_code: null,
            country: "US",
            lat: null,
            lng: null,
          },
          raw_data: {
            dates: datesText,
            name: trialName,
            location: locationText,
            entryOpens: entryOpensText,
            closes: closesText,
          },
        });
      } catch (err) {
        console.error("[uki] Error parsing row:", err);
      }
    });

    console.log(`[uki] Parsed ${trials.length} upcoming trials`);
    return this.buildResult(trials);
  }

  private parseDateRange(text: string): {
    startDate: string | null;
    endDate: string | null;
  } {
    // Formats:
    //   "Jan 01, 2026"
    //   "Jan 02 - 04, 2026"
    //   "Mar 28 - Apr 01, 2026"

    // Single date
    const singleMatch = text.match(
      /^([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/
    );
    if (singleMatch) {
      const d = this.monthDayYearToIso(
        singleMatch[1],
        singleMatch[2],
        singleMatch[3]
      );
      return { startDate: d, endDate: d };
    }

    // Range within same month: "Jan 02 - 04, 2026"
    const sameMonthMatch = text.match(
      /^([A-Z][a-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2}),?\s+(\d{4})$/
    );
    if (sameMonthMatch) {
      const start = this.monthDayYearToIso(
        sameMonthMatch[1],
        sameMonthMatch[2],
        sameMonthMatch[4]
      );
      const end = this.monthDayYearToIso(
        sameMonthMatch[1],
        sameMonthMatch[3],
        sameMonthMatch[4]
      );
      return { startDate: start, endDate: end };
    }

    // Range across months: "Mar 28 - Apr 01, 2026"
    const crossMonthMatch = text.match(
      /^([A-Z][a-z]+)\s+(\d{1,2})\s*-\s*([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/
    );
    if (crossMonthMatch) {
      const start = this.monthDayYearToIso(
        crossMonthMatch[1],
        crossMonthMatch[2],
        crossMonthMatch[5]
      );
      const end = this.monthDayYearToIso(
        crossMonthMatch[3],
        crossMonthMatch[4],
        crossMonthMatch[5]
      );
      return { startDate: start, endDate: end };
    }

    return { startDate: null, endDate: null };
  }

  private parseShortDate(text: string): string | null {
    // Format: "Nov 07, 25" or "Dec 22, 25"
    const match = text.match(/([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{2})/);
    if (!match) return null;
    const year = parseInt(match[3]) < 50 ? `20${match[3]}` : `19${match[3]}`;
    return this.monthDayYearToIso(match[1], match[2], year);
  }

  private monthDayYearToIso(
    month: string,
    day: string,
    year: string
  ): string | null {
    const months: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04",
      May: "05", Jun: "06", Jul: "07", Aug: "08",
      Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    const mm = months[month];
    if (!mm) return null;
    return `${year}-${mm}-${day.padStart(2, "0")}`;
  }

  private parseLocation(text: string): { city: string; state: string } {
    // Format: "Barto, PA" or "San Francisco, CA"
    const parts = text.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      return {
        city: parts.slice(0, -1).join(", "),
        state: parts[parts.length - 1],
      };
    }
    return { city: text, state: "" };
  }
}
