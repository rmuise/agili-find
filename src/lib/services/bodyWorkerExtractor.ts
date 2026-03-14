/**
 * bodyWorkerExtractor.ts
 *
 * Scraper hook for extracting K9 body worker mentions from trial listing pages.
 *
 * When scrapers process raw trial HTML, some pages mention on-site massage
 * therapists, chiropractors, or rehabilitation specialists. This service:
 *   1. Scans HTML for body-work-related keywords
 *   2. Attempts to extract practitioner names from surrounding text
 *   3. Finds or creates a body_worker record (with fuzzy name matching)
 *   4. Creates a body_worker_trial_appearances record (confirmed: false)
 *   5. Logs all extractions for admin review
 *
 * All scraped appearances are flagged confirmed: false until the practitioner
 * self-confirms via their profile or an admin approves the record.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Keywords that indicate a body worker may be mentioned nearby. */
const BODY_WORK_KEYWORDS = [
  "massage",
  "body work",
  "bodywork",
  "chiropractor",
  "chiropractic",
  "physical therapy",
  "physical therapist",
  "canine rehabilitation",
  "rehabilitation specialist",
  "k9 massage",
  "k9 bodywork",
  "canine massage",
  "myofascial",
  "acupuncture",
  "hydrotherapy",
  "cold laser",
];

/** Confidence threshold for fuzzy name matching (0–100). */
const MATCH_THRESHOLD = 85;

// ---------------------------------------------------------------------------
// Levenshtein helpers (same implementation as judgeNormalization.ts)
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = new Array((m + 1) * (n + 1)).fill(0);
  for (let i = 0; i <= m; i++) dp[i * (n + 1)] = i;
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i * (n + 1) + j] = dp[(i - 1) * (n + 1) + (j - 1)];
      } else {
        dp[i * (n + 1) + j] =
          1 +
          Math.min(
            dp[(i - 1) * (n + 1) + j],
            dp[i * (n + 1) + (j - 1)],
            dp[(i - 1) * (n + 1) + (j - 1)]
          );
      }
    }
  }
  return dp[m * (n + 1) + n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return Math.round(((maxLen - levenshtein(a, b)) / maxLen) * 100);
}

function normalizeName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b(jr\.?|sr\.?|ii|iii|iv|dr\.?|mr\.?|mrs\.?|ms\.?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Name extraction heuristics
// ---------------------------------------------------------------------------

/**
 * Attempts to extract a practitioner name from a snippet of text surrounding
 * a body-work keyword. Uses simple heuristics:
 *   - Looks for "Name, LMT", "Name Massage", "Name Bodywork" patterns
 *   - Captures Title Case two-to-three-word sequences near keywords
 *
 * Returns null if no confident name can be extracted.
 */
function extractNameFromSnippet(snippet: string): string | null {
  // Pattern: "Jane Smith, CCMT" or "Jane Smith LMT"
  const credentialPattern =
    /\b([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*,?\s*(?:CCMT|LMT|CVT|CCRP|DC|DVM|PT|PTA|CVSMT)\b/;
  const credMatch = snippet.match(credentialPattern);
  if (credMatch) return credMatch[1].trim();

  // Pattern: "by Jane Smith" or "with Jane Smith"
  const byPattern = /(?:by|with)\s+([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/;
  const byMatch = snippet.match(byPattern);
  if (byMatch) return byMatch[1].trim();

  // Pattern: Two- or three-word Title Case sequence ending with "Massage/Bodywork/Therapy"
  const servicePattern =
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:Massage|Bodywork|Therapy|Chiropractic|Acupuncture|Rehabilitation)/;
  const serviceMatch = snippet.match(servicePattern);
  if (serviceMatch) return serviceMatch[1].trim();

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * findOrCreateBodyWorker
 *
 * Given a raw practitioner name from a scraper, finds or creates the canonical
 * body_worker record. Returns the body_worker's UUID.
 *
 * Uses the same Levenshtein fuzzy matching approach as judgeNormalization.ts.
 */
export async function findOrCreateBodyWorker(rawName: string): Promise<string> {
  const supabase = createAdminClient();
  const normalized = normalizeName(rawName);

  if (!normalized) {
    throw new Error("Body worker name cannot be empty after normalization");
  }

  // --- Exact match on canonical name ---
  const { data: exactMatch } = await supabase
    .from("body_workers")
    .select("id, name")
    .eq("name", normalized)
    .single();

  if (exactMatch) return exactMatch.id;

  // --- Fuzzy match across all body workers ---
  const { data: allWorkers } = await supabase
    .from("body_workers")
    .select("id, name");

  let bestId: string | null = null;
  let bestScore = 0;

  for (const worker of allWorkers || []) {
    const score = similarity(normalized, normalizeName(worker.name));
    if (score > bestScore) {
      bestScore = score;
      bestId = worker.id;
    }
  }

  if (bestId && bestScore >= MATCH_THRESHOLD) {
    console.log(
      `[bodyWorkerExtractor] Fuzzy matched "${normalized}" to existing record (score: ${bestScore})`
    );
    return bestId;
  }

  // --- No match — create new scraped record ---
  const slug = slugify(normalized);
  const { data: newWorker, error } = await supabase
    .from("body_workers")
    .insert({
      name: normalized,
      slug,
      source: "scraped",
      is_claimed: false,
      modalities: [],
    })
    .select("id")
    .single();

  if (error || !newWorker) {
    // Handle slug collision with timestamp suffix
    const { data: retried, error: retryError } = await supabase
      .from("body_workers")
      .insert({
        name: normalized,
        slug: `${slug}-${Date.now()}`,
        source: "scraped",
        is_claimed: false,
        modalities: [],
      })
      .select("id")
      .single();

    if (retryError || !retried) {
      throw new Error(
        `Failed to create body worker "${normalized}": ${retryError?.message ?? error?.message}`
      );
    }

    console.log(
      `[bodyWorkerExtractor] New body worker created (slug collision resolved): "${normalized}"`
    );
    return retried.id;
  }

  console.log(
    `[bodyWorkerExtractor] New scraped body worker created — needs admin review: "${normalized}" (raw: "${rawName}")`
  );
  return newWorker.id;
}

/**
 * extractBodyWorkersFromTrialPage
 *
 * Scans raw HTML from a trial listing page for body-work-related keywords.
 * For any matches found, attempts to extract a practitioner name from
 * surrounding text and creates an unconfirmed trial appearance record.
 *
 * @param htmlContent  Raw HTML string from the trial page
 * @param trialId      UUID of the trial record in the database
 * @returns            Array of body_worker IDs that were found/created
 */
export async function extractBodyWorkersFromTrialPage(
  htmlContent: string,
  trialId: string
): Promise<string[]> {
  const supabase = createAdminClient();

  // Strip tags for easier text scanning while preserving whitespace structure
  const text = htmlContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const lower = text.toLowerCase();

  const foundWorkerIds: string[] = [];
  const processedNames = new Set<string>();

  for (const keyword of BODY_WORK_KEYWORDS) {
    let searchStart = 0;

    while (true) {
      const idx = lower.indexOf(keyword, searchStart);
      if (idx === -1) break;

      // Extract ~200 characters around the keyword for context
      const snippetStart = Math.max(0, idx - 100);
      const snippetEnd = Math.min(text.length, idx + keyword.length + 100);
      const snippet = text.slice(snippetStart, snippetEnd);

      const name = extractNameFromSnippet(snippet);

      if (name && !processedNames.has(name.toLowerCase())) {
        processedNames.add(name.toLowerCase());
        console.log(
          `[bodyWorkerExtractor] Found body worker candidate: "${name}" near keyword "${keyword}" in trial ${trialId}`
        );

        try {
          const bodyWorkerId = await findOrCreateBodyWorker(name);

          // Upsert appearance — avoid duplicates on re-scrape
          const { error: appearanceError } = await supabase
            .from("body_worker_trial_appearances")
            .upsert(
              {
                body_worker_id: bodyWorkerId,
                trial_id: trialId,
                confirmed: false,
                notes: `Extracted from trial listing page (keyword: "${keyword}")`,
              },
              { onConflict: "body_worker_id,trial_id", ignoreDuplicates: true }
            );

          if (appearanceError) {
            console.warn(
              `[bodyWorkerExtractor] Could not upsert appearance for ${bodyWorkerId} / ${trialId}: ${appearanceError.message}`
            );
          } else {
            foundWorkerIds.push(bodyWorkerId);
          }
        } catch (err) {
          console.error(
            `[bodyWorkerExtractor] Failed to process body worker "${name}":`,
            err
          );
        }
      }

      searchStart = idx + keyword.length;
    }
  }

  if (foundWorkerIds.length > 0) {
    console.log(
      `[bodyWorkerExtractor] Extracted ${foundWorkerIds.length} body worker(s) from trial ${trialId} — flagged for admin review`
    );
  }

  return foundWorkerIds;
}
