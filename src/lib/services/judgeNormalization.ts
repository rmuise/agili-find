/**
 * judgeNormalization.ts
 *
 * Normalizes judge names extracted by scrapers into canonical judge records.
 *
 * Problem: Scrapers extract judge names in inconsistent formats:
 *   "Jane Smith", "J. Smith", "J Smith", "JANE SMITH", "Smith, Jane"
 * This service resolves all of these to a single canonical judge record.
 *
 * Strategy:
 *   1. Normalize the raw name (trim, collapse whitespace, title-case)
 *   2. Exact match against judges.name and judges.name_variants
 *   3. If no exact match, fuzzy match using Levenshtein distance
 *   4. If confidence > 85%, link to existing judge
 *   5. Otherwise, create a new judge record and log for admin review
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Levenshtein distance (pure implementation — no external dependency needed)
// ---------------------------------------------------------------------------

/**
 * Computes the Levenshtein edit distance between two strings.
 * Returns 0 for identical strings, higher values for more different strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Allocate a flat array rather than a 2D array for performance
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
            dp[(i - 1) * (n + 1) + j],     // deletion
            dp[i * (n + 1) + (j - 1)],     // insertion
            dp[(i - 1) * (n + 1) + (j - 1)] // substitution
          );
      }
    }
  }

  return dp[m * (n + 1) + n];
}

/**
 * Returns a similarity score 0–100 based on Levenshtein distance.
 * 100 = identical, 0 = completely different.
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(a, b);
  return Math.round(((maxLen - dist) / maxLen) * 100);
}

// ---------------------------------------------------------------------------
// Name normalization helpers
// ---------------------------------------------------------------------------

/**
 * Normalizes a raw name string for comparison:
 *   - Trims and collapses whitespace
 *   - Title-cases each word
 *   - Strips honorifics that sometimes appear in scraper output
 */
function normalizeName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    // Strip common honorifics/suffixes that scrapers sometimes include
    .replace(/\b(jr\.?|sr\.?|ii|iii|iv|dr\.?|mr\.?|mrs\.?|ms\.?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    // Title-case
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Confidence threshold (0–100) above which we link to an existing judge */
const MATCH_THRESHOLD = 85;

interface ExistingJudge {
  id: string;
  name: string;
  name_variants: string[];
}

/**
 * findOrCreateJudge
 *
 * Given a raw judge name from a scraper, finds or creates the canonical
 * judge record. Returns the judge's UUID.
 *
 * Algorithm:
 *   1. Normalize the raw name
 *   2. Exact match in judges.name or judges.name_variants
 *   3. Fuzzy match all judges by Levenshtein similarity
 *   4. If best match > MATCH_THRESHOLD, return existing judge and record variant
 *   5. Otherwise create new judge, log for admin review
 */
export async function findOrCreateJudge(rawName: string): Promise<string> {
  const supabase = createAdminClient();
  const normalized = normalizeName(rawName);

  if (!normalized) {
    throw new Error("Judge name cannot be empty after normalization");
  }

  // --- Step 1: Exact match on canonical name ---
  const { data: exactMatch } = await supabase
    .from("judges")
    .select("id, name, name_variants")
    .eq("name", normalized)
    .single();

  if (exactMatch) {
    // Record the raw variant if it differs from the canonical name
    if (rawName !== exactMatch.name) {
      await mergeJudgeVariants(exactMatch.id, rawName);
    }
    return exactMatch.id;
  }

  // --- Step 2: Exact match inside name_variants ---
  const { data: variantMatches } = await supabase
    .from("judges")
    .select("id, name, name_variants")
    .contains("name_variants", [rawName]);

  if (variantMatches && variantMatches.length > 0) {
    return variantMatches[0].id;
  }

  // --- Step 3: Fuzzy match across all judges ---
  const { data: allJudges } = await supabase
    .from("judges")
    .select("id, name, name_variants");

  let bestMatch: ExistingJudge | null = null;
  let bestScore = 0;

  for (const judge of allJudges || []) {
    // Score against canonical name
    const nameScore = similarity(normalized, normalizeName(judge.name));
    let topScore = nameScore;

    // Score against each stored variant
    for (const variant of judge.name_variants || []) {
      const varScore = similarity(normalized, normalizeName(variant));
      if (varScore > topScore) topScore = varScore;
    }

    if (topScore > bestScore) {
      bestScore = topScore;
      bestMatch = judge;
    }
  }

  if (bestMatch && bestScore >= MATCH_THRESHOLD) {
    // High-confidence match — link to existing judge
    await mergeJudgeVariants(bestMatch.id, rawName);
    return bestMatch.id;
  }

  // --- Step 4: No match — create new judge record ---
  const slug = slugify(normalized);
  const { data: newJudge, error } = await supabase
    .from("judges")
    .insert({
      name: normalized,
      slug,
      name_variants: rawName !== normalized ? [rawName] : [],
    })
    .select("id")
    .single();

  if (error || !newJudge) {
    // Slug collision is the most likely error; try with a timestamp suffix
    const { data: retried, error: retryError } = await supabase
      .from("judges")
      .insert({
        name: normalized,
        slug: `${slug}-${Date.now()}`,
        name_variants: rawName !== normalized ? [rawName] : [],
      })
      .select("id")
      .single();

    if (retryError || !retried) {
      throw new Error(`Failed to create judge "${normalized}": ${retryError?.message ?? error?.message}`);
    }

    console.log(`[judgeNormalization] New judge created (slug collision resolved): "${normalized}"`);
    return retried.id;
  }

  console.log(`[judgeNormalization] New judge created — needs admin review: "${normalized}" (raw: "${rawName}")`);
  return newJudge.id;
}

/**
 * mergeJudgeVariants
 *
 * Adds a new name variant to an existing judge record without duplicating.
 * Safe to call multiple times with the same variant.
 */
export async function mergeJudgeVariants(
  judgeId: string,
  variant: string
): Promise<void> {
  const supabase = createAdminClient();

  // Fetch current variants
  const { data: judge } = await supabase
    .from("judges")
    .select("name, name_variants")
    .eq("id", judgeId)
    .single();

  if (!judge) return;

  // Skip if variant is identical to the canonical name
  if (variant === judge.name) return;

  // Skip if already present
  const existing: string[] = judge.name_variants || [];
  if (existing.includes(variant)) return;

  await supabase
    .from("judges")
    .update({ name_variants: [...existing, variant] })
    .eq("id", judgeId);
}
