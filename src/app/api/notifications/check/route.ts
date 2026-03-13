import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Cron endpoint: check for upcoming entry close dates and send notifications
// Called via Vercel cron or GitHub Actions
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Get users with entry close notifications enabled
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("user_id, search_lat, search_lng, search_radius_miles, email_entry_close, email_new_trials")
    .eq("email_entry_close", true);

  if (!prefs || prefs.length === 0) {
    return NextResponse.json({ message: "No users with notifications enabled", sent: 0 });
  }

  let totalNotifications = 0;

  for (const pref of prefs) {
    // Get user's saved trials with upcoming close dates
    const { data: savedTrials } = await supabase
      .from("saved_trials")
      .select(`
        trial_id,
        trials!inner (
          id,
          title,
          entry_close_date,
          start_date
        )
      `)
      .eq("user_id", pref.user_id);

    if (!savedTrials) continue;

    const closingSoon = savedTrials.filter((st) => {
      const trial = st.trials as unknown as { entry_close_date: string | null };
      if (!trial.entry_close_date) return false;
      const closeDate = new Date(trial.entry_close_date);
      return closeDate >= now && closeDate <= sevenDaysFromNow;
    });

    if (closingSoon.length === 0) continue;

    // Check if we already sent a notification for these
    for (const st of closingSoon) {
      const trial = st.trials as unknown as { id: string; title: string; entry_close_date: string };
      const { data: existing } = await supabase
        .from("notification_log")
        .select("id")
        .eq("user_id", pref.user_id)
        .eq("notification_type", "entry_close")
        .eq("reference_id", trial.id)
        .single();

      if (existing) continue;

      const closeDate = new Date(trial.entry_close_date);
      const isUrgent = closeDate <= threeDaysFromNow;

      // Get user email
      const { data: { user } } = await supabase.auth.admin.getUserById(pref.user_id);
      if (!user?.email) continue;

      // Log the notification (in production, integrate with email service like Resend/SendGrid)
      await supabase.from("notification_log").insert({
        user_id: pref.user_id,
        notification_type: "entry_close",
        reference_id: trial.id,
      });

      console.log(
        `[Notification] ${isUrgent ? "URGENT" : "Reminder"}: Entry closing for "${trial.title}" on ${trial.entry_close_date} - notify ${user.email}`
      );

      totalNotifications++;
    }
  }

  return NextResponse.json({
    message: `Processed notifications`,
    sent: totalNotifications,
  });
}
