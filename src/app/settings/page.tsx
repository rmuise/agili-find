"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Save, Sun, Moon, Ruler } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/lib/theme-context";
import { usePreferences } from "@/lib/preferences-context";

interface NotificationPreferences {
  email_entry_close: boolean;
  email_new_trials: boolean;
  email_seminars: boolean;
  search_lat: number | null;
  search_lng: number | null;
  search_radius_miles: number;
}

// Reusable segmented control (Light/Dark, mi/km, etc.)
function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            value === opt.value
              ? "bg-[var(--agili-accent)] text-black shadow-sm"
              : "text-[var(--muted-text)] hover:text-[var(--cream)]"
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { distanceUnit, setDistanceUnit } = usePreferences();

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
    if (!user) {
      setIsLoading(false);
      return;
    }
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

  if (authLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg,var(--background))]">
      <PageHeader backLabel="Back" />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">

        {/* ── Display Preferences (no login required) ── */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--cream)] mb-1">
            Settings
          </h1>
          <p className="text-sm text-[var(--muted-text)] mb-6">
            Customize how AgiliFind looks and displays information.
          </p>

          <div className="bg-[var(--surface)] rounded-[14px] border border-[var(--border)] p-6 space-y-6">
            <h2 className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-widest">
              Display Preferences
            </h2>

            {/* Theme */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-[var(--cream)]">
                  Appearance
                </p>
                <p className="text-xs text-[var(--muted-text)] mt-0.5">
                  Choose a light or dark interface.
                </p>
              </div>
              <SegmentedControl
                value={theme}
                onChange={(v) => { if (v !== theme) toggleTheme(); }}
                options={[
                  { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
                  { value: "dark",  label: "Dark",  icon: <Moon className="h-3.5 w-3.5" /> },
                ]}
              />
            </div>

            {/* Distance unit */}
            <div className="flex items-center justify-between gap-4 flex-wrap border-t border-[var(--border)] pt-6">
              <div>
                <p className="text-sm font-medium text-[var(--cream)]">
                  Distance units
                </p>
                <p className="text-xs text-[var(--muted-text)] mt-0.5">
                  How distances are shown on trial and seminar cards.
                </p>
              </div>
              <SegmentedControl
                value={distanceUnit}
                onChange={setDistanceUnit}
                options={[
                  { value: "mi", label: "Miles",      icon: <Ruler className="h-3.5 w-3.5" /> },
                  { value: "km", label: "Kilometres", icon: <Ruler className="h-3.5 w-3.5" /> },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ── Notification Settings (login required) ── */}
        {!user ? (
          <div className="bg-[var(--surface)] rounded-[14px] border border-[var(--border)] p-6 text-center">
            <Bell className="h-8 w-8 text-[var(--muted-2)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--cream)] mb-1">
              Notification settings require an account
            </p>
            <p className="text-xs text-[var(--muted-text)] mb-4">
              Sign in to manage email alerts for trial closings and new trials near you.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-black bg-[var(--agili-accent)] rounded-md hover:brightness-110 transition-all"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-[var(--agili-accent)]" />
              <h2 className="text-lg font-bold text-[var(--cream)]">
                Notification Settings
              </h2>
            </div>

            {isLoading ? (
              <div className="bg-[var(--surface)] rounded-[14px] border border-[var(--border)] p-6 animate-pulse space-y-6">
                <div className="h-5 bg-[var(--surface-2)] rounded w-1/3" />
                <div className="h-4 bg-[var(--surface-3)] rounded w-2/3" />
                <div className="h-4 bg-[var(--surface-3)] rounded w-1/2" />
              </div>
            ) : (
              <div className="bg-[var(--surface)] rounded-[14px] border border-[var(--border)] p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--muted-text)] mb-4 uppercase tracking-widest">
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefs.email_entry_close}
                        onChange={(e) =>
                          setPrefs({ ...prefs, email_entry_close: e.target.checked })
                        }
                        className="rounded border-[var(--border)] text-[var(--agili-accent)] focus:ring-[var(--agili-accent)] mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-[var(--cream)]">
                          Entry close date reminders
                        </p>
                        <p className="text-xs text-[var(--muted-text)]">
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
                        className="rounded border-[var(--border)] text-[var(--agili-accent)] focus:ring-[var(--agili-accent)] mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-[var(--cream)]">
                          New trials near you
                        </p>
                        <p className="text-xs text-[var(--muted-text)]">
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
                        className="rounded border-[var(--border)] text-[var(--agili-accent)] focus:ring-[var(--agili-accent)] mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-[var(--cream)]">
                          New seminars
                        </p>
                        <p className="text-xs text-[var(--muted-text)]">
                          Get notified when new seminars are posted near you.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-6">
                  <h3 className="text-xs font-semibold text-[var(--muted-text)] mb-4 uppercase tracking-widest">
                    Notification Area
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-[var(--cream)] mb-1">
                      Search radius for notifications
                    </label>
                    <select
                      value={prefs.search_radius_miles}
                      onChange={(e) =>
                        setPrefs({ ...prefs, search_radius_miles: Number(e.target.value) })
                      }
                      className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--agili-accent)] focus:border-transparent"
                    >
                      <option value={25}>25 miles</option>
                      <option value={50}>50 miles</option>
                      <option value={100}>100 miles</option>
                      <option value={200}>200 miles</option>
                      <option value={500}>500 miles</option>
                    </select>
                    <p className="text-xs text-[var(--muted-text)] mt-1">
                      Set your location by searching from the main page. Your last search location will be used.
                    </p>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-black bg-[var(--agili-accent)] rounded-md hover:brightness-110 disabled:opacity-50 transition-all"
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
        )}
      </div>
    </div>
  );
}
