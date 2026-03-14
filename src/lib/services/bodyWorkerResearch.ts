/**
 * bodyWorkerResearch.ts
 *
 * Web research service for K9 body worker profiles.
 *
 * When a body worker profile is first created (via admin or scraper), this
 * service can search for publicly available information to suggest profile
 * fields. Results are NEVER auto-applied — they are returned as suggestions
 * for admin review only.
 *
 * Supported search backends:
 *   - Brave Search API (BRAVE_SEARCH_KEY env var)
 *   - SerpApi / Google Search (SERPAPI_KEY env var)
 *
 * ⚠️  FLAG: Both BRAVE_SEARCH_KEY and SERPAPI_KEY must be added to .env.
 * The service gracefully degrades if neither key is present.
 *
 * TODO (admin UI): Build an admin interface to review and accept/reject
 * research suggestions before they are applied to practitioner profiles.
 * Endpoint placeholder: GET /api/admin/body-workers/research-queue
 */

// ---------------------------------------------------------------------------
// Known booking platform URL patterns
// ---------------------------------------------------------------------------

const BOOKING_PLATFORM_PATTERNS = [
  /calendly\.com\/[^\s"'>]+/gi,
  /[a-z0-9-]+\.janeapp\.com\/[^\s"'>]*/gi,
  /janeapp\.com\/[^\s"'>]+/gi,
  /square\.site\/[^\s"'>]+/gi,
  /acuityscheduling\.com\/[^\s"'>]+/gi,
  /vagaro\.com\/[^\s"'>]+/gi,
  /booksy\.com\/[^\s"'>]+/gi,
  /schedulicity\.com\/[^\s"'>]+/gi,
];

/**
 * extractBookingUrl
 *
 * Scans arbitrary text for known booking platform URLs.
 * Returns the first match found, or null if none.
 *
 * Supported platforms: Calendly, Jane App, Square, Acuity Scheduling,
 * Vagaro, Booksy, Schedulicity.
 */
export function extractBookingUrl(text: string): string | null {
  for (const pattern of BOOKING_PLATFORM_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      let url = match[0];
      // Ensure URL has a scheme
      if (!url.startsWith("http")) {
        url = `https://${url}`;
      }
      return url;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Research result types
// ---------------------------------------------------------------------------

export interface ResearchResult {
  /** Suggested website URL found in search results */
  website_url: string | null;
  /** Suggested booking URL (extracted from search result text) */
  booking_url: string | null;
  /** Instagram profile URL if found */
  instagram_url: string | null;
  /** Facebook profile URL if found */
  facebook_url: string | null;
  /** Short bio snippet extracted from search results */
  bio_snippet: string | null;
  /** Any certification strings found (e.g. "CCMT", "CVT") */
  certifications_found: string[];
  /** The raw search queries used — useful for admin audit trail */
  queries_used: string[];
  /** Raw search result snippets for admin review */
  raw_snippets: string[];
}

// ---------------------------------------------------------------------------
// Search strategy helpers
// ---------------------------------------------------------------------------

/**
 * Builds the set of search queries to use for a given body worker.
 */
function buildSearchQueries(name: string, businessName?: string): string[] {
  const queries: string[] = [
    `"${name}" canine massage`,
    `"${name}" K9 body work`,
    `"${name}" dog agility body worker`,
  ];
  if (businessName) {
    queries.push(`"${businessName}"`);
  }
  return queries;
}

/** Extracts social media URLs from a block of text. */
function extractSocialUrls(text: string): {
  instagram_url: string | null;
  facebook_url: string | null;
} {
  const igMatch = text.match(/instagram\.com\/[a-zA-Z0-9_.]+/);
  const fbMatch = text.match(/facebook\.com\/[a-zA-Z0-9_.]+/);
  return {
    instagram_url: igMatch ? `https://${igMatch[0]}` : null,
    facebook_url: fbMatch ? `https://${fbMatch[0]}` : null,
  };
}

/** Extracts certification codes commonly seen in canine body work. */
function extractCertifications(text: string): string[] {
  const certPattern =
    /\b(CCMT|LMT|CVT|CCRP|CVSMT|DC|DACVSMR|PT|PTA|CCSP|CVMRT)\b/g;
  const matches = text.match(certPattern) ?? [];
  return [...new Set(matches)]; // deduplicate
}

// ---------------------------------------------------------------------------
// Backend: Brave Search
// ---------------------------------------------------------------------------

async function searchViaBrave(query: string): Promise<string[]> {
  const apiKey = process.env.BRAVE_SEARCH_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "5");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!res.ok) {
    console.warn(
      `[bodyWorkerResearch] Brave Search returned ${res.status} for query: ${query}`
    );
    return [];
  }

  const json = await res.json();
  const results = json?.web?.results ?? [];
  return results.map(
    (r: { description?: string; url?: string }) =>
      `${r.description ?? ""} ${r.url ?? ""}`
  );
}

// ---------------------------------------------------------------------------
// Backend: SerpApi (Google)
// ---------------------------------------------------------------------------

async function searchViaSerpApi(query: string): Promise<string[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", "5");
  url.searchParams.set("output", "json");

  const res = await fetch(url.toString());

  if (!res.ok) {
    console.warn(
      `[bodyWorkerResearch] SerpApi returned ${res.status} for query: ${query}`
    );
    return [];
  }

  const json = await res.json();
  const organicResults = json?.organic_results ?? [];
  return organicResults.map(
    (r: { snippet?: string; link?: string }) =>
      `${r.snippet ?? ""} ${r.link ?? ""}`
  );
}

/**
 * Run a single query through whichever search backend is configured.
 * Prefers Brave Search (cheaper, no RPS limits on paid plans) over SerpApi.
 */
async function runSearch(query: string): Promise<string[]> {
  // Try Brave first
  if (process.env.BRAVE_SEARCH_KEY) {
    return searchViaBrave(query);
  }
  // Fall back to SerpApi
  if (process.env.SERPAPI_KEY) {
    return searchViaSerpApi(query);
  }
  // No keys configured — log and return empty
  console.warn(
    "[bodyWorkerResearch] No search API key configured. " +
      "Set BRAVE_SEARCH_KEY or SERPAPI_KEY in .env to enable web research."
  );
  return [];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * researchBodyWorker
 *
 * Performs web research on a body worker to suggest profile fields.
 * Results are returned as suggestions ONLY — never auto-applied.
 * All research runs are logged for admin audit trail.
 *
 * @param name          Practitioner's full name
 * @param businessName  Optional business name (improves search accuracy)
 * @returns             ResearchResult with suggestions (all fields nullable)
 */
export async function researchBodyWorker(
  name: string,
  businessName?: string
): Promise<ResearchResult> {
  const result: ResearchResult = {
    website_url: null,
    booking_url: null,
    instagram_url: null,
    facebook_url: null,
    bio_snippet: null,
    certifications_found: [],
    queries_used: [],
    raw_snippets: [],
  };

  const queries = buildSearchQueries(name, businessName);
  const allSnippets: string[] = [];

  console.log(
    `[bodyWorkerResearch] Starting research for "${name}"${businessName ? ` / "${businessName}"` : ""} — ${queries.length} queries`
  );

  for (const query of queries) {
    result.queries_used.push(query);
    try {
      const snippets = await runSearch(query);
      allSnippets.push(...snippets);
    } catch (err) {
      console.warn(
        `[bodyWorkerResearch] Query failed: "${query}"`,
        err
      );
    }
  }

  result.raw_snippets = allSnippets;

  // Aggregate the combined text from all snippets
  const combinedText = allSnippets.join(" ");

  // Extract booking URL
  result.booking_url = extractBookingUrl(combinedText);

  // Extract social URLs
  const socials = extractSocialUrls(combinedText);
  result.instagram_url = socials.instagram_url;
  result.facebook_url = socials.facebook_url;

  // Extract certifications
  result.certifications_found = extractCertifications(combinedText);

  // Extract bio snippet — take the longest snippet under 500 chars that
  // mentions the practitioner's name
  const nameLower = name.toLowerCase();
  const bioCandidate = allSnippets
    .filter(
      (s) => s.toLowerCase().includes(nameLower) && s.length <= 500
    )
    .sort((a, b) => b.length - a.length)[0];
  result.bio_snippet = bioCandidate ?? null;

  // Extract website URL — look for non-social non-booking URLs in snippets
  const websiteMatch = combinedText.match(
    /https?:\/\/(?!(?:www\.)?(facebook|instagram|calendly|janeapp|square|acuityscheduling|vagaro|booksy|schedulicity|google|yelp)\.)[a-z0-9][a-z0-9-]+\.[a-z]{2,}[^\s"'>]*/i
  );
  result.website_url = websiteMatch ? websiteMatch[0] : null;

  console.log(
    `[bodyWorkerResearch] Research complete for "${name}": ` +
      `booking=${result.booking_url ?? "none"}, ` +
      `certs=${result.certifications_found.join(",") || "none"}, ` +
      `snippets=${allSnippets.length}`
  );

  // TODO (admin UI): Persist research results to a `body_worker_research_queue` table
  // so admins can review and accept/reject suggestions before applying to profiles.
  // See GET /api/admin/body-workers/research-queue (not yet built).

  return result;
}
