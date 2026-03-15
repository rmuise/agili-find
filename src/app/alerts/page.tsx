'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DEFAULT_ALERT_PREFS } from '@/types/filters';
import type { AlertPreferences } from '@/types/filters';
import { useAuth } from '@/lib/supabase/auth-context';

type Tab = 'notifications' | 'preferences';

export default function AlertsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [prefs, setPrefs] = useState<AlertPreferences>(DEFAULT_ALERT_PREFS);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'notifications', label: 'Notifications' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <>
      <Navbar />
      <div className="grid md:grid-cols-[220px_1fr] min-h-[calc(100vh-56px)] items-start">
        <DashboardSidebar />

        <main className="px-5 md:px-8 py-8 min-w-0 max-w-[760px]">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="font-display text-[2rem] tracking-[0.04em] text-cream mb-1">Alerts</h1>
              <p className="text-[0.85rem] text-[var(--muted-text)] font-light">
                Notifications and alert preferences.
              </p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-[var(--border)] mb-6">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  text-[0.82rem] px-5 py-[0.875rem] border-b-2 transition-colors cursor-pointer
                  bg-transparent whitespace-nowrap
                  ${activeTab === id
                    ? 'text-[var(--accent)] border-[var(--accent)]'
                    : 'text-[var(--muted-text)] border-transparent hover:text-cream'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="font-display text-[1.5rem] tracking-[0.04em] text-cream mb-2">All caught up</div>
              <p className="text-[0.85rem] text-[var(--muted-text)] max-w-xs">
                Real-time notifications for registration deadlines, new trials, and spot alerts are coming soon.
              </p>
            </div>
          )}

          {/* ── PREFERENCES ── */}
          {activeTab === 'preferences' && (
            <PreferencesPanel prefs={prefs} onChange={setPrefs} />
          )}

        </main>
      </div>
    </>
  );
}

// ── Preferences Panel ────────────────────────────────────────

const PREF_OPTIONS: { key: keyof AlertPreferences; label: string; sub: string }[] = [
  { key: 'closingSoon', label: 'Registration closing soon', sub: 'Get notified 7 and 3 days before a saved trial closes' },
  { key: 'newTrials', label: 'New trials near you', sub: 'When new trials match your saved searches' },
  { key: 'regOpen', label: 'Registration now open', sub: 'When a saved trial opens for registration' },
  { key: 'spotsFilling', label: 'Spots filling fast', sub: 'When a saved trial has fewer than 20 spots remaining' },
  { key: 'weeklyDigest', label: 'Weekly digest', sub: 'A summary of upcoming trials near you every Monday' },
];

function PreferencesPanel({
  prefs,
  onChange,
}: {
  prefs: AlertPreferences;
  onChange: (p: AlertPreferences) => void;
}) {
  const toggle = (key: keyof AlertPreferences) => {
    onChange({ ...prefs, [key]: !prefs[key] });
  };

  return (
    <div className="flex flex-col gap-4 max-w-[520px]">
      <div className="text-[0.62rem] font-medium tracking-[0.14em] uppercase text-[var(--muted-text)] mb-1">
        Email notifications
      </div>

      {PREF_OPTIONS.map(({ key, label, sub }) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 px-4 py-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-[12px]"
        >
          <div>
            <div className="text-[0.85rem] font-medium text-cream mb-[0.15rem]">{label}</div>
            <div className="text-[0.72rem] text-[var(--muted-text)]">{sub}</div>
          </div>
          <button
            onClick={() => toggle(key)}
            className={`
              w-[38px] h-[22px] rounded-full border-none cursor-pointer relative shrink-0 transition-colors duration-200
              ${prefs[key] ? 'bg-[var(--accent)]' : 'bg-[var(--surface-3)]'}
            `}
            aria-label={`${prefs[key] ? 'Disable' : 'Enable'} ${label}`}
          >
            <span
              className="absolute top-[3px] w-4 h-4 rounded-full bg-black transition-transform duration-200"
              style={{ transform: prefs[key] ? 'translateX(19px)' : 'translateX(3px)' }}
            />
          </button>
        </div>
      ))}

      <div className="text-[0.62rem] font-medium tracking-[0.14em] uppercase text-[var(--muted-text)] mt-2 mb-1">
        Notification frequency
      </div>

      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[12px] px-4 py-4">
        <div className="text-[0.82rem] text-[var(--muted-text)] mb-3">Send me alerts</div>
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { val: 'immediate', label: 'As they happen' },
              { val: 'daily', label: 'Daily digest' },
              { val: 'weekly', label: 'Weekly only' },
            ] as { val: AlertPreferences['frequency']; label: string }[]
          ).map(({ val, label }) => (
            <button
              key={val}
              onClick={() => onChange({ ...prefs, frequency: val })}
              className={`
                text-[0.78rem] px-[0.875rem] py-[0.4rem] rounded-[8px] border-none
                cursor-pointer transition-all duration-150
                ${prefs.frequency === val
                  ? 'bg-[var(--accent)] text-black font-medium'
                  : 'bg-[var(--surface-3)] text-[var(--muted-text)] hover:text-cream'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button className="flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-dark)] active:scale-[0.98] text-black text-[0.88rem] font-medium py-[0.875rem] rounded-[10px] border-none cursor-pointer transition-all mt-2">
        Save preferences
      </button>
    </div>
  );
}
