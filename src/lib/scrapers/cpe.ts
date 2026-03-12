import * as cheerio from "cheerio";
import { BaseScraper } from "./base";
import { ScrapedTrial, ScrapePageResult } from "@/types/scraper";

const CPE_EVENTS_URL = "https://cpe.dog/events-list/";

/**
 * CPE (Canine Performance Events) scraper.
 * Scrapes the events list at cpe.dog/events-list/
 *
 * Page structure uses Elementor with div.event-item containers:
 *   <div class="event-item">
 *     <h2>MM/DD/YYYY - MM/DD/YYYY</h2>
 *     <h3>(TYPE) ST: Club Name - STATUS</h3>
 *     <div class="location">
 *       <span class="city-state">City, ST</span>
 *       <span class="venue">(Indoors)</span>
 *     </div>
 *     <div class="info hide">
 *       <div><span class="label">Judges: </span><span class="data">...</span></div>
 *       <div><span class="label">Closing Date:</span><span class="data">MM/DD/YYYY</span></div>
 *       <div class="more">
 *         <div class="contact">...</div>
 *         <div class="website">...</div>
 *       </div>
 *     </div>
 *   </div>
 */
export class CpeScraper extends BaseScraper {
  constructor() {
    super("cpe", {
      requestDelay: 2000,
      timeout: 30000,
    });
  }

  async scrape(): Promise<ScrapePageResult> {
    console.log("[cpe] Fetching events list...");
    const html = await this.fetchHtml(CPE_EVENTS_URL);
    const $ = cheerio.load(html);

    const trials: ScrapedTrial[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const eventItems = $(".event-item");
    console.log(`[cpe] Found ${eventItems.length} event-item elements`);

    eventItems.each((_i, el) => {
      try {
        const trial = this.parseEventItem($, $(el), now);
        if (trial) {
          trials.push(trial);
        }
      } catch (err) {
        console.error("[cpe] Error parsing event-item:", err);
      }
    });

    console.log(`[cpe] Parsed ${trials.length} future trials`);
    return this.buildResult(trials);
  }

  private parseEventItem(
    $: cheerio.CheerioAPI,
    item: cheerio.Cheerio<cheerio.AnyNode>,
    now: Date
  ): ScrapedTrial | null {
    // Extract date range from <h2>
    const dateText = item.find("h2").first().text().trim();
    const dateMatch = dateText.match(
      /(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/
    );
    if (!dateMatch) return null;

    const startDate = `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`;
    const endDate = `${dateMatch[6]}-${dateMatch[4]}-${dateMatch[5]}`;

    // Skip past events
    if (new Date(endDate + "T00:00:00") < now) return null;

    // Extract event type, state, and club name from <h3>
    // Format: "(AG) NE: Club Name" or "(SW) CA: Club Name - TRIAL FULL"
    const titleText = item.find("h3").first().text().trim();
    const titleMatch = titleText.match(
      /\((\w+)\)\s*([A-Z]{2}):\s*(.*?)(?:\s*-\s*TRIAL FULL)?$/
    );

    const eventType = titleMatch ? titleMatch[1] : "";
    const stateFromTitle = titleMatch ? titleMatch[2] : "";
    let clubName = titleMatch ? titleMatch[3].trim() : titleText;

    // Clean up club name — remove trailing status markers
    clubName = clubName.replace(/\s*-\s*TRIAL FULL\s*$/i, "").trim();

    // Extract location from div.location
    const cityState = item.find(".location .city-state").text().trim();
    const venueType = item.find(".location .venue").text().trim();

    const locationMatch = cityState.match(/^(.+?),\s*([A-Z]{2})$/);
    const city = locationMatch ? locationMatch[1].trim() : cityState;
    const state = locationMatch ? locationMatch[2] : stateFromTitle;

    // Extract judges from info section
    const judges: string[] = [];
    item.find(".info div").each((_i, div) => {
      const label = $(div).find(".label").text().trim();
      if (label.match(/^judges?/i)) {
        const judgeText = $(div).find(".data").text().trim();
        if (judgeText) {
          judges.push(
            ...judgeText
              .split(/[,&]/)
              .map((j) => j.trim())
              .filter(Boolean)
          );
        }
      }
    });

    // Extract closing date
    let entryCloseDate: string | null = null;
    item.find(".info div").each((_i, div) => {
      const label = $(div).find(".label").text().trim();
      if (label.match(/closing\s*date/i)) {
        const closeText = $(div).find(".data").text().trim();
        entryCloseDate = this.parseUsDate(closeText);
      }
    });

    // Extract premium PDF URL
    const premiumUrl = item.find("a[href$='.pdf']").attr("href") || null;

    // Extract contact info
    let secretary: string | null = null;
    const contactDiv = item.find(".contact .data").text().trim();
    if (contactDiv) {
      // Take just the name part (before email/phone)
      const namePart = contactDiv.split(/[,@]/)[0].trim();
      if (namePart && namePart.length > 2) {
        secretary = namePart;
      }
    }

    if (!clubName && !city) return null;

    const externalId = `cpe-${startDate}-${(clubName || city)
      .replace(/\s+/g, "-")
      .toLowerCase()
      .substring(0, 40)}`;

    return {
      external_id: externalId,
      organization_id: "cpe",
      title: clubName || `CPE Trial in ${city}, ${state}`,
      hosting_club: clubName || null,
      start_date: startDate,
      end_date: endDate,
      entry_open_date: null,
      entry_close_date: entryCloseDate,
      classes: eventType ? [eventType] : [],
      judges,
      secretary_name: secretary,
      source_url: premiumUrl || CPE_EVENTS_URL,
      venue: {
        name: venueType
          ? `${city}, ${state} ${venueType}`
          : `${city}, ${state}`,
        address_raw: `${city}, ${state}`.replace(/^,\s*/, ""),
        city,
        state,
        postal_code: null,
        country: "US",
        lat: null,
        lng: null,
      },
      raw_data: {
        dateText,
        titleText,
        cityState,
        venueType,
      },
    };
  }

  private parseUsDate(text: string): string | null {
    const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return null;
    return `${match[3]}-${match[1]}-${match[2]}`;
  }
}
