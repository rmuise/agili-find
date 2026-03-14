"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";

interface NotificationPreferences {
  email_entry_close: boolean;
  email_new_trials: boolean;
  email_seminars: boolean;
  search_lat: number | null;
  search_lng: number | null;
  search_radius_miles: number;
}

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email_entry_close: true,
    email_new_trials: true,
    email_seminars: false,
    search_lat: null,
    search_lng: null,
    search_radius_miles: 100,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) setPrefs(data.preferences);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        toast("Notification preferences saved", "success");
      } else {
        toast("Failed to save preferences", "error");
      }
    } catch {
      toast("Failed to save preferences", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader backLabel="Back" />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--cream)] flex items-center gap-2">
            <Bell className="h-6 w-6 text-[var(--accent)]" />
            Notification Settings
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Choose what email notifications you&apos;d like to receive.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 animate-pulse space-y-6">
            <div className="h-5 bg-[var(--surface-2)] rounded w-1/3" />
            <div className="h-4 bg-[var(--surface-3)] rounded w-2/3" />
            <div className="h-4 bg-[var(--surface-3)] rounded w-1/2" />
          </div>
        ) : (
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-[var(--cream)] mb-3 uppercase tracking-wide">
                Email Notifications
              </h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.email_entry_close}
                    onChange={(e) =>
                      setPrefs({ ...prefs, email_entry_close: e.target.checked })
                    }
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--cream)]">
                      Entry close date reminders
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Get notified 7 days and 3 days before entry closes for your saved trials.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.email_new_trials}
                    onChange={(e) =>
                      setPrefs({ ...prefs, email_new_trials: e.target.checked })
                    }
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--cream)]">
                      New trials near you
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Weekly digest of newly added trials within your search radius.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.email_seminars}
                    onChange={(e) =>
                      setPrefs({ ...prefs, email_seminars: e.target.checked })
                    }
                    className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--cream)]">
                      New seminars
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Get notified when new seminars are posted near you.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              <h2 className="text-sm font-semibold text-[var(--cream)] mb-3 uppercase tracking-wide">
                Notification Area
              </h2>
              <div>
                <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                  Search radius for notifications
                </label>
                <select
                  value={prefs.search_radius_miles}
                  onChange={(e) =>
                    setPrefs({ ...prefs, search_radius_miles: Number(e.target.value) })
                  }
                  className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  <option value={25}>25 miles</option>
                  <option value={50}>50 miles</option>
                  <option value={100}>100 miles</option>
                  <option value={200}>200 miles</option>
                  <option value={500}>500 miles</option>
                </select>
                <p className="text-xs text-[var(--muted-2)] mt-1">
                  Set your location by searching from the main page. Your last search location will be used.
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--black)] bg-[var(--accent)] rounded-md hover:bg-[var(--accent-dark)] disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
