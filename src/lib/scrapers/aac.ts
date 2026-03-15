import * as cheerio from "cheerio";
import { BaseScraper } from "./base";
import { ScrapedTrial, ScrapePageResult } from "@/types/scraper";

/**
 * AAC (Agility Association of Canada) scraper.
 *
 * Scrapes trial data from aactrialresults.com which lists all AAC-sanctioned
 * agility trials across Canadian provinces.
 *
 * Strategy:
 * 1. First call (no cursor): Fetch the "all trials" listing page to get
 *    trial IDs, dates, clubs, provinces, and locations.
 * 2. Subsequent calls (with cursor): Fetch individual trial detail pages
 *    in batches to get judges, classes, entry dates, and venue addresses.
 *
 * The cursor tracks which trial index we're on for detail fetching.
 */

const BASE_URL = "https://www.aactrialresults.com/approved";
const ALL_TRIALS_URL = `${BASE_URL}/approvedtrialsall.html`;

// Batch size for detail page fetches (stay under 60s timeout)
const DETAIL_BATCH_SIZE = 15;

// Map Canadian province abbreviations for consistency
const PROVINCE_MAP: Record<string, string> = {
  AB: "AB",
  BC: "BC",
  MB: "MB",
  NB: "NB",
  NL: "NL",
  NS: "NS",
  NT: "NT",
  NU: "NU",
  ON: "ON",
  PE: "PE",
  QC: "QC",
  SK: "SK",
  YT: "YT",
};

interface TrialListEntry {
  trialId: string; // e.g., "AT9430"
  date: string; // e.g., "14-Mar-26"
  club: string;
  province: string;
  location: string;
  detailUrl: string;
}

interface AacCursor {
  /** All trial entries from the listing page */
  entries: TrialListEntry[];
  /** Index of next trial to fetch details for */
  nextIndex: number;
}

export class AacScraper extends BaseScraper {
  constructor() {
    super("aac", {
      requestDelay: 1500,
      timeout: 30000,
    });
  }

  async scrape(cursor?: unknown): Promise<ScrapePageResult> {
    const aacCursor = cursor as AacCursor | undefined;

    if (!aacCursor) {
      // First call: fetch the listing page and return trial entries
      return this.fetchListingPage();
    }

    // Subsequent calls: fetch detail pages in batches
    return this.fetchDetailBatch(aacCursor);
  }

  /**
   * Step 1: Fetch the listing page with all trials.
   * Returns trials with basic info and sets up cursor for detail fetching.
   */
  private async fetchListingPage(): Promise<ScrapePageResult> {
    console.log("[aac] Fetching all-trials listing page...");

    const html = await this.fetchHtml(ALL_TRIALS_URL);
    const entries = this.parseListingPage(html);

    // Filter to future trials only
    const now = new Date();
    const futureEntries = entries.filter((e) => {
      const d = this.parseAacDate(e.date);
      return d && new Date(d) >= now;
    });

    console.log(
      `[aac] Found ${entries.length} total trials, ${futureEntries.length} upcoming`
    );

    if (futureEntries.length === 0) {
      return this.buildResult([]);
    }

    // Start fetching details from index 0
    const nextCursor: AacCursor = {
      entries: futureEntries,
      nextIndex: 0,
    };

    // Fetch the first batch of details immediately
    return this.fetchDetailBatch(nextCursor);
  }

  /**
   * Step 2: Fetch a batch of trial detail pages.
   */
  private async fetchDetailBatch(cursor: AacCursor): Promise<ScrapePageResult> {
    const { entries, nextIndex } = cursor;
    const endIndex = Math.min(nextIndex + DETAIL_BATCH_SIZE, entries.length);
    const batch = entries.slice(nextIndex, endIndex);

    console.log(
      `[aac] Fetching details for trials ${nextIndex + 1}-${endIndex} of ${entries.length}...`
    );

    const trials: ScrapedTrial[] = [];

    for (const entry of batch) {
      try {
        const trial = await this.fetchTrialDetail(entry);
        if (trial) {
          trials.push(trial);
        }
      } catch (err) {
        console.error(
          `[aac] Error fetching detail for ${entry.trialId}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    console.log(
      `[aac] Parsed ${trials.length} trials from batch (${nextIndex + 1}-${endIndex})`
    );

    const hasMore = endIndex < entries.length;
    const nextCursor: AacCursor | undefined = hasMore
      ? { entries, nextIndex: endIndex }
      : undefined;

    return {
      trials,
      hasMore,
      cursor: nextCursor,
      scrapedAt: new Date().toISOString(),
    };
  }

  /**
   * Parse the all-trials listing page HTML.
   */
  private parseListingPage(html: string): TrialListEntry[] {
    const $ = cheerio.load(html);
    const entries: TrialListEntry[] = [];

    // The page has a table with trial rows
    $("tr").each((_i, row) => {
      const cells = $(row).find("td");
      if (cells.length < 3) return;

      // Get date from first cell
      const dateText = $(cells[0]).text().trim();
      if (!dateText || dateText === "Trial Date") return; // Skip header

      // Get club name and link from second cell
      const clubLink = $(cells[1]).find("a");
      const club = clubLink.length
        ? clubLink.text().trim()
        : $(cells[1]).text().trim();
      const href = clubLink.attr("href") || "";

      // Extract trial ID from URL (e.g., "AT9430.html" -> "AT9430")
      const trialIdMatch = href.match(/(AT\d+)\.html/);
      const trialId = trialIdMatch ? trialIdMatch[1] : "";

      // Province is in 3rd cell (if 4 columns: date, club, province, location)
      let province = "";
      let location = "";

      if (cells.length >= 4) {
        province = $(cells[2]).text().trim();
        location = $(cells[3]).text().trim();
      } else {
        // 3 columns: date, club, location
        location = $(cells[2]).text().trim();
      }

      if (!dateText || !club) return;

      entries.push({
        trialId,
        date: dateText,
        club,
        province: PROVINCE_MAP[province] || province,
        location,
        detailUrl: trialId
          ? `${BASE_URL}/${trialId}.html`
          : "",
      });
    });

    return entries;
  }

  /**
   * Fetch and parse an individual trial detail page.
   */
  private async fetchTrialDetail(
    entry: TrialListEntry
  ): Promise<ScrapedTrial | null> {
    const startDate = this.parseAacDate(entry.date);
    if (!startDate) {
      console.warn(`[aac] Could not parse date: ${entry.date}`);
      return null;
    }

    // Default: single-day trial
    let endDate = startDate;
    let closeDate: string | null = null;
    let judges: string[] = [];
    let classes: string[] = [];
    let venueAddress = `${entry.location}, ${entry.province}, Canada`;
    let venueName = entry.club;
    let sourceUrl = entry.detailUrl || ALL_TRIALS_URL;

    // Fetch detail page if we have a trial ID
    if (entry.detailUrl) {
      try {
        const html = await this.fetchHtml(entry.detailUrl);
        const detail = this.parseDetailPage(html);

        if (detail.endDate) endDate = detail.endDate;
        if (detail.closeDate) closeDate = detail.closeDate;
        if (detail.judges.length > 0) judges = detail.judges;
        if (detail.classes.length > 0) classes = detail.classes;
        if (detail.venueAddress) venueAddress = detail.venueAddress;
        if (detail.venueName) venueName = detail.venueName;
      } catch (err) {
        console.warn(
          `[aac] Could not fetch detail page for ${entry.trialId}: ${err instanceof Error ? err.message : err}`
        );
        // Continue with basic data from listing
      }
    }

    const externalId = entry.trialId || `aac-${startDate}-${entry.club.replace(/\s+/g, "-").toLowerCase().substring(0, 40)}`;

    return {
      external_id: externalId,
      organization_id: "aac",
      title: entry.club,
      hosting_club: entry.club,
      start_date: startDate,
      end_date: endDate,
      entry_open_date: null,
      entry_close_date: closeDate,
      classes,
      judges,
      secretary_name: null,
      source_url: sourceUrl,
      venue: {
        name: venueName,
        address_raw: venueAddress,
        city: entry.location,
        state: entry.province,
        postal_code: null,
        country: "CA",
        lat: null,
        lng: null,
      },
      raw_data: {
        trialId: entry.trialId,
        dateRaw: entry.date,
        province: entry.province,
      },
    };
  }

  /**
   * Parse a trial detail page for judges, classes, dates, and venue.
   */
  private parseDetailPage(html: string): {
    endDate: string | null;
    closeDate: string | null;
    judges: string[];
    classes: string[];
    venueAddress: string | null;
    venueName: string | null;
  } {
    const $ = cheerio.load(html);
    const text = $("body").text();

    // Words that appear near judge names on AAC pages but are NOT judge names
    const JUDGE_DENYLIST = ["Website", "Premium", "Entry", "Form", "Results", "Map", "Contact", "Info"];

    function isValidJudgeName(name: string): boolean {
      // Must have at least 2 words (first + last name)
      const words = name.trim().split(/\s+/);
      if (words.length < 2) return false;
      // Reject if any word is in the denylist
      if (words.some((w) => JUDGE_DENYLIST.includes(w))) return false;
      // Reject names with embedded newlines or control characters
      if (/[\r\n\t]/.test(name)) return false;
      return true;
    }

    // Extract judges — look for "LastName, FirstName" patterns after "Judge" headings
    const judges: string[] = [];
    const judgeMatches = text.matchAll(
      /(?:Judge[s]?|Judging)[:\s]*([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
    );
    for (const m of judgeMatches) {
      const name = m[1].trim();
      // Convert "LastName, FirstName" to "FirstName LastName"
      const parts = name.split(",").map((p) => p.trim());
      const normalized = parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
      if (isValidJudgeName(normalized)) {
        judges.push(normalized);
      }
    }

    // Also try finding judges in table cells
    $("td").each((_i, el) => {
      const cellText = $(el).text().trim();
      // Match "LastName, FirstName" pattern that appears to be a judge
      const m = cellText.match(/^([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/);
      if (m) {
        const name = `${m[2]} ${m[1]}`;
        if (!judges.includes(name) && isValidJudgeName(name) && name.length > 4 && name.length < 50) {
          judges.push(name);
        }
      }
    });

    // Extract classes
    const classes: string[] = [];
    const classKeywords = [
      "Starters", "Advanced", "Masters", "Gamblers", "Jumpers",
      "Snooker", "Steeplechase", "Standard", "Junior",
    ];
    for (const kw of classKeywords) {
      if (text.includes(kw)) {
        classes.push(kw);
      }
    }

    // Extract closing date
    let closeDate: string | null = null;
    const closeMatch = text.match(
      /Clos(?:ing|e)[:\s]*(?:\w+,?\s*)?(\w+ \d{1,2},?\s*\d{4})/i
    );
    if (closeMatch) {
      closeDate = this.parseDate(closeMatch[1]);
    }

    // Extract end date (multi-day trials)
    let endDate: string | null = null;
    const multiDayMatch = text.match(
      /(\w+ \d{1,2})\s*[-–to]+\s*(\w+ \d{1,2},?\s*\d{4})/
    );
    if (multiDayMatch) {
      endDate = this.parseDate(multiDayMatch[2]);
    }

    // Extract venue address
    let venueAddress: string | null = null;
    let venueName: string | null = null;

    // Look for address-like text — street number followed by street name
    const addressMatch = text.match(
      /(\d+\s+[A-Z][a-zA-Z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Way|Boulevard|Blvd|Line|Concession|Highway|Hwy|County)[.,]?\s*(?:[A-Za-z\s,]+)?(?:[A-Z]{2})?)/
    );
    if (addressMatch) {
      venueAddress = addressMatch[1].trim().replace(/\s+/g, " ");
    }

    // Look for venue/site name
    const siteMatch = text.match(/Site[:\s]*([^\n]+)/i);
    if (siteMatch) {
      venueName = siteMatch[1].trim();
    }

    return {
      endDate,
      closeDate,
      judges: [...new Set(judges)],
      classes: [...new Set(classes)],
      venueAddress,
      venueName,
    };
  }

  /**
   * Parse AAC date format "DD-Mon-YY" to ISO date string.
   * e.g., "14-Mar-26" -> "2026-03-14"
   */
  private parseAacDate(dateStr: string): string | null {
    const match = dateStr.match(/^(\d{1,2})-(\w{3})-(\d{2})$/);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase();
    const year = 2000 + parseInt(match[3], 10);

    const months: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };

    const month = months[monthStr];
    if (!month) return null;

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
}
