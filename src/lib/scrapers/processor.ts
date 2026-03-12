import { createServerClient } from "@/db";
import { getOrCreateVenue } from "@/lib/geocoding/venue-cache";
import { ScrapedTrial, ScrapeRunStats } from "@/types/scraper";
import { OrganizationId } from "@/types/trial";
import { BaseScraper } from "./base";

/**
 * Process a single scraper run: fetch trials, upsert venues, upsert trials.
 * Handles one "page" (chunk) of results per invocation for Vercel timeout safety.
 */
export async function processScraperChunk(
  scraper: BaseScraper,
  orgId: OrganizationId,
  cursor?: unknown
): Promise<{
  stats: ScrapeRunStats;
  nextCursor?: unknown;
  hasMore: boolean;
}> {
  const startTime = Date.now();
  const errors: Array<{ message: string; trial_id?: string }> = [];
  let trialsAdded = 0;
  let trialsUpdated = 0;

  const supabase = createServerClient();

  // 1. Run the scraper for one chunk
  const result = await scraper.scrape(cursor);
  console.log(
    `[${orgId}] Scraped ${result.trials.length} trials (hasMore: ${result.hasMore})`
  );

  // 2. Process each trial
  for (const trial of result.trials) {
    try {
      // 2a. Get or create venue
      const venueId = await getOrCreateVenue({
        name: trial.venue.name,
        addressRaw: trial.venue.address_raw,
        city: trial.venue.city,
        state: trial.venue.state,
        postalCode: trial.venue.postal_code,
        country: trial.venue.country,
        lat: trial.venue.lat,
        lng: trial.venue.lng,
      });

      if (!venueId) {
        errors.push({
          message: `Failed to create venue for trial ${trial.external_id}`,
          trial_id: trial.external_id,
        });
        continue;
      }

      // 2b. Upsert trial
      const trialData = mapTrialToRow(trial, venueId);
      const { data, error } = await supabase
        .from("trials")
        .upsert(trialData, {
          onConflict: "organization_id,external_id",
        })
        .select("id, created_at, updated_at")
        .single();

      if (error) {
        errors.push({
          message: `DB error for trial ${trial.external_id}: ${error.message}`,
          trial_id: trial.external_id,
        });
        continue;
      }

      // Determine if this was an insert or update
      if (data) {
        const isNew = data.created_at === data.updated_at;
        if (isNew) {
          trialsAdded++;
        } else {
          trialsUpdated++;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({
        message: `Error processing trial ${trial.external_id}: ${msg}`,
        trial_id: trial.external_id,
      });
    }
  }

  const stats: ScrapeRunStats = {
    organization_id: orgId,
    trials_found: result.trials.length,
    trials_added: trialsAdded,
    trials_updated: trialsUpdated,
    errors,
    duration_ms: Date.now() - startTime,
  };

  console.log(
    `[${orgId}] Chunk complete: ${trialsAdded} added, ${trialsUpdated} updated, ${errors.length} errors in ${stats.duration_ms}ms`
  );

  return {
    stats,
    nextCursor: result.cursor,
    hasMore: result.hasMore,
  };
}

function mapTrialToRow(trial: ScrapedTrial, venueId: string) {
  return {
    organization_id: trial.organization_id,
    venue_id: venueId,
    external_id: trial.external_id,
    title: trial.title,
    hosting_club: trial.hosting_club,
    start_date: trial.start_date,
    end_date: trial.end_date,
    entry_open_date: trial.entry_open_date,
    entry_close_date: trial.entry_close_date,
    classes: trial.classes,
    judges: trial.judges,
    secretary_name: trial.secretary_name,
    source_url: trial.source_url,
    raw_data: trial.raw_data,
  };
}
