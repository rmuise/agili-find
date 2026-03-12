import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/db";

type RouteContext = { params: Promise<{ shareId: string }> };

/**
 * GET /api/ical/[shareId]
 * Returns an iCal (.ics) feed for the user's saved trials.
 * Subscribe to this URL in any calendar app (Google Calendar, Apple Calendar, etc.)
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { shareId } = await context.params;
  const supabase = createServerClient();

  // Look up user by share token
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("share_token", shareId)
    .single();

  if (profileError || !profile) {
    return new NextResponse("Calendar not found", { status: 404 });
  }

  // Fetch saved trials
  const { data: savedTrials, error: trialsError } = await supabase
    .from("saved_trials")
    .select(
      `
      status,
      trials:trial_id (
        id,
        title,
        hosting_club,
        organization_id,
        start_date,
        end_date,
        source_url,
        venues:venue_id (
          name,
          city,
          state,
          country
        )
      )
    `
    )
    .eq("user_id", profile.id);

  if (trialsError) {
    return new NextResponse("Error fetching calendar", { status: 500 });
  }

  const events = (savedTrials || [])
    .filter((row: Record<string, unknown>) => row.trials)
    .map((row: Record<string, unknown>) => {
      const trial = row.trials as Record<string, unknown>;
      const venue = trial.venues as Record<string, unknown> | null;
      const status = row.status as string;

      const startDate = String(trial.start_date).replace(/-/g, "");
      const endDate = String(trial.end_date).replace(/-/g, "");
      // iCal all-day events: end date should be day AFTER the last day
      const endParts = String(trial.end_date).split("-").map(Number);
      const endDt = new Date(endParts[0], endParts[1] - 1, endParts[2] + 1);
      const endDateExcl = `${endDt.getFullYear()}${String(endDt.getMonth() + 1).padStart(2, "0")}${String(endDt.getDate()).padStart(2, "0")}`;

      const location = venue
        ? `${venue.name || ""}, ${venue.city || ""}, ${venue.state || ""}`
        : "";

      const statusLabel =
        status === "attending"
          ? "Attending"
          : status === "registered"
          ? "Registered"
          : "Interested";

      const orgId = String(trial.organization_id).toUpperCase();
      const summary = escapeIcal(`${orgId}: ${trial.title}`);
      const description = escapeIcal(
        `Status: ${statusLabel}${trial.hosting_club ? `\\nClub: ${trial.hosting_club}` : ""}\\n${trial.source_url}`
      );

      return [
        "BEGIN:VEVENT",
        `UID:${trial.id}@agilifind`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDateExcl}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${escapeIcal(location)}`,
        `URL:${trial.source_url}`,
        "END:VEVENT",
      ].join("\r\n");
    });

  const displayName = profile.display_name || "AgiliFind User";

  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AgiliFind//Schedule//EN",
    `X-WR-CALNAME:${escapeIcal(displayName)}'s Agility Schedule`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="agilifind-schedule.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

/** Escape special characters for iCal format */
function escapeIcal(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
