import { BaseScraper } from "./base";
import { ScrapedTrial, ScrapePageResult } from "@/types/scraper";

const AKC_API_URL =
  "https://webapps.akc.org/event-search/api/search/events";

/** Max events the AKC API returns per request */
const AKC_PAGE_LIMIT = 1000;

/** How many months to query per request to stay under the 1000 limit */
const MONTHS_PER_CHUNK = 2;

/** Total months to look ahead for upcoming trials */
const LOOKAHEAD_MONTHS = 12;

interface AkcCursor {
  /** Current chunk index (0-based) */
  chunkIndex: number;
}

// ─── AKC API response types ─────────────────────────────────────

interface AkcEvent {
  id: number;
  eventName: string;
  eventNumber: string;
  eventType: string;
  eventStatus: string;
  days: number;
  startDate: string;
  endDate: string;
  clubName: string;
  city: string;
  state: string;
  site: {
    id: number;
    name: string;
    location1: string | null;
    location2: string | null;
    location3: string | null;
    postalCode: string | null;
    coordinates: { lat: number; lon: number } | null;
  } | null;
  superintendentSecretary: {
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  isAcceptingOnlineEntries: boolean;
  items: AkcEventItem[];
  documents: AkcDocument[];
}

interface AkcEventItem {
  openingDate: number | null;
  closingDate: number | null;
  startDate: string;
  endDate: string;
  timeZone: string;
  entryFee: number[];
  insideOut: string;
  competitionGroupCode: string;
  competitionGroup: string;
  entryLimit: number | null;
  acceptance: string | null;
  competitionMethod: string;
  judges: Array<{ id: number; number: string | null; name: string | null }>;
  breeds: Array<{ number: string; description: string }>;
}

interface AkcDocument {
  name: string;
  code: string;
  keyBinary: number;
}

interface AkcSearchResponse {
  events: AkcEvent[];
}

// ─── Scraper ────────────────────────────────────────────────────

export class AkcScraper extends BaseScraper {
  constructor() {
    super("akc", {
      requestDelay: 2000, // Be respectful to AKC servers
      timeout: 45000, // AKC can be slow with large result sets
    });
  }

  async scrape(cursor?: AkcCursor): Promise<ScrapePageResult> {
    const chunkIndex = cursor?.chunkIndex ?? 0;
    const totalChunks = Math.ceil(LOOKAHEAD_MONTHS / MONTHS_PER_CHUNK);

    if (chunkIndex >= totalChunks) {
      return this.buildResult([], undefined);
    }

    const { from, to } = this.getDateRange(chunkIndex);
    console.log(
      `[akc] Scraping chunk ${chunkIndex + 1}/${totalChunks}: ${from} → ${to}`
    );

    const body = this.buildSearchPayload(from, to);

    const response = await this.fetchJson<AkcSearchResponse>(AKC_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const trials = response.events
      .filter((e) => e.eventStatus === "Approved")
      .map((event) => this.mapEvent(event))
      .filter((t): t is ScrapedTrial => t !== null);

    console.log(
      `[akc] Chunk ${chunkIndex + 1}: ${response.events.length} raw events → ${trials.length} approved agility trials`
    );

    // If we got exactly 1000, there might be more in this date range.
    // Log a warning but continue to next chunk.
    if (response.events.length >= AKC_PAGE_LIMIT) {
      console.warn(
        `[akc] WARNING: Got ${AKC_PAGE_LIMIT} events for ${from}→${to}. Some events may have been missed. Consider reducing MONTHS_PER_CHUNK.`
      );
    }

    const hasMore = chunkIndex + 1 < totalChunks;
    const nextCursor: AkcCursor | undefined = hasMore
      ? { chunkIndex: chunkIndex + 1 }
      : undefined;

    return this.buildResult(trials, nextCursor);
  }

  // ─── Private helpers ──────────────────────────────────────────

  private getDateRange(chunkIndex: number): { from: string; to: string } {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setMonth(fromDate.getMonth() + chunkIndex * MONTHS_PER_CHUNK);

    const toDate = new Date(fromDate);
    toDate.setMonth(toDate.getMonth() + MONTHS_PER_CHUNK);

    // Don't go past the lookahead limit
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + LOOKAHEAD_MONTHS);
    if (toDate > maxDate) {
      toDate.setTime(maxDate.getTime());
    }

    return {
      from: this.formatDate(fromDate),
      to: this.formatDate(toDate),
    };
  }

  private formatDate(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  private buildSearchPayload(from: string, to: string) {
    return {
      address: {
        eventSetting: {
          indoor: true,
          outdoor: true,
          outsideCovered: true,
        },
        location: {
          cityState: "",
          latitude: 0,
          longitude: 0,
          zipCode: null,
        },
        radius: "any",
        searchByState: false,
        searchByCity: false,
        searchText: "All Cities & States",
      },
      breedCode: "999",
      breedName: "Any AKC Recognized or FSS Breed",
      breedId: "ANY_AKC_FSS",
      dateRange: {
        from,
        to,
        type: "event",
      },
      competition: {
        items: [
          {
            selected: true,
            value: { compType: "AG" },
            label: "Agility (AG)",
          },
        ],
        filters: [],
      },
    };
  }

  private mapEvent(event: AkcEvent): ScrapedTrial | null {
    try {
      const site = event.site;
      const addressParts = [
        site?.location1,
        site?.location2,
        event.city,
        event.state,
        site?.postalCode,
      ].filter(Boolean);
      const addressRaw = addressParts.join(", ");

      // Extract judges from all items
      const judgeNames = new Set<string>();
      for (const item of event.items) {
        for (const judge of item.judges) {
          if (judge.name) {
            judgeNames.add(judge.name);
          }
        }
      }

      // Extract classes from items
      const classes = [
        ...new Set(event.items.map((i) => i.competitionMethod).filter(Boolean)),
      ];

      // Get earliest closing date across all items
      const closingDates = event.items
        .map((i) => i.closingDate)
        .filter((d): d is number => d !== null);
      const closingDate = closingDates.length
        ? new Date(Math.min(...closingDates)).toISOString().split("T")[0]
        : null;

      // Get earliest opening date across all items
      const openingDates = event.items
        .map((i) => i.openingDate)
        .filter((d): d is number => d !== null);
      const openingDate = openingDates.length
        ? new Date(Math.min(...openingDates)).toISOString().split("T")[0]
        : null;

      // Secretary info
      const secretary = event.superintendentSecretary?.name || null;

      return {
        external_id: event.eventNumber,
        organization_id: "akc",
        title: event.eventName,
        hosting_club: event.clubName,
        start_date: event.startDate,
        end_date: event.endDate,
        entry_open_date: openingDate,
        entry_close_date: closingDate,
        classes,
        judges: [...judgeNames],
        secretary_name: secretary,
        source_url: `https://webapps.akc.org/event-search/#/details/${event.id}`,
        venue: {
          name: site?.name || event.eventName,
          address_raw: addressRaw || `${event.city}, ${event.state}`,
          city: event.city,
          state: event.state,
          postal_code: site?.postalCode || null,
          country: "US",
          lat: site?.coordinates?.lat || null,
          lng: site?.coordinates?.lon || null,
        },
        raw_data: event as unknown as Record<string, unknown>,
      };
    } catch (error) {
      console.error(
        `[akc] Failed to map event ${event.eventNumber}:`,
        error
      );
      return null;
    }
  }
}
