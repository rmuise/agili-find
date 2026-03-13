import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/**
 * Vercel cron job: send pre-trial email digest 7 days before trial.
 * Runs daily at 2pm UTC (configured in vercel.json).
 *
 * For each trial starting in 7 days:
 *   - Find all users who saved it with status "attending"
 *   - Gather attending providers grouped by type
 *   - Log the digest (integrate with email service in production)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find trials starting exactly 7 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);
  const dateStr = targetDate.toISOString().split("T")[0];

  const { data: trials, error: trialsError } = await supabase
    .from("trials")
    .select(`
      id,
      title,
      start_date,
      end_date,
      venues!inner (name, city, state)
    `)
    .eq("start_date", dateStr);

  if (trialsError || !trials || trials.length === 0) {
    return NextResponse.json({
      message: trials?.length === 0
        ? "No trials starting in 7 days"
        : "Error fetching trials",
      sent: 0,
    });
  }

  let totalDigests = 0;

  for (const trial of trials) {
    const venue = trial.venues as unknown as {
      name: string;
      city: string;
      state: string;
    };

    // Find users who marked this trial as "attending"
    const { data: savedEntries } = await supabase
      .from("saved_trials")
      .select("user_id")
      .eq("trial_id", trial.id)
      .eq("status", "attending");

    if (!savedEntries || savedEntries.length === 0) continue;

    // Fetch attending providers for this trial
    const { data: associations } = await supabase
      .from("srv_trial_associations")
      .select(`
        is_attending,
        srv_providers (
          business_name,
          provider_type,
          phone,
          website_url
        )
      `)
      .eq("trial_id", trial.id)
      .eq("is_attending", true);

    const attendingProviders = (associations || [])
      .filter((a) => a.srv_providers)
      .map((a) => a.srv_providers as unknown as {
        business_name: string;
        provider_type: string;
        phone: string | null;
        website_url: string | null;
      });

    // Group providers by type
    const providersByType: Record<string, typeof attendingProviders> = {};
    for (const p of attendingProviders) {
      const type = p.provider_type;
      if (!providersByType[type]) providersByType[type] = [];
      providersByType[type].push(p);
    }

    // Send digest to each attending user
    for (const entry of savedEntries) {
      // Check if already sent
      const { data: existing } = await supabase
        .from("notification_log")
        .select("id")
        .eq("user_id", entry.user_id)
        .eq("notification_type", "pre_trial_digest")
        .eq("reference_id", trial.id)
        .maybeSingle();

      if (existing) continue;

      // Get user email
      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(entry.user_id);
      if (!user?.email) continue;

      // Log the notification
      await supabase.from("notification_log").insert({
        user_id: entry.user_id,
        notification_type: "pre_trial_digest",
        reference_id: trial.id,
      });

      const providerHtml = Object.entries(providersByType)
        .map(
          ([type, providers]) =>
            `<p><strong>${type.replace("_", " ")}:</strong> ${providers
              .map((p) =>
                p.website_url
                  ? `<a href="${p.website_url}">${p.business_name}</a>`
                  : p.business_name
              )
              .join(", ")}</p>`
        )
        .join("");

      await sendEmail({
        to: user.email,
        subject: `Your trial is in 7 days: ${trial.title}`,
        html: `
          <h2>${trial.title}</h2>
          <p><strong>Date:</strong> ${trial.start_date} – ${trial.end_date}</p>
          <p><strong>Venue:</strong> ${venue.name}, ${venue.city}, ${venue.state}</p>
          ${
            attendingProviders.length > 0
              ? `<h3>Service Providers Attending</h3>${providerHtml}`
              : ""
          }
          <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
            Sent by AgiliFind. <a href="https://agilifind.com/settings">Manage notifications</a>
          </p>
        `,
      });

      totalDigests++;
    }
  }

  return NextResponse.json({
    message: `Sent ${totalDigests} pre-trial digests`,
    trials_checked: trials.length,
    digests_sent: totalDigests,
  });
}
