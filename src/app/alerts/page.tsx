'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { MOCK_NOTIFICATIONS, MOCK_SAVED_SEARCHES, groupNotificationsByDate, formatRelativeTime } from '@/lib/user-data';
import { DEFAULT_ALERT_PREFS } from '@/lib/types';
import type { Notification, AlertPreferences, SavedSearch } from '@/lib/types';

type Tab = 'notifications' | 'searches' | 'preferences';

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(MOCK_SAVED_SEARCHES);
  const [prefs, setPrefs] = useState<AlertPreferences>(DEFAULT_ALERT_PREFS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleSearch = (id: string) => {
    setSavedSearches((prev) =>
      prev.map((s) => s.id === id ? { ...s, alertsEnabled: !s.alertsEnabled } : s)
    );
  };

  const groups = groupNotificationsByDate(notifications);

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'notifications', label: 'Notifications', badge: unreadCount },
    { id: 'searches', label: 'Saved Searches' },
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
              <p className="text-[0.85rem] text-[var(--muted)] font-light">
                Notifications, saved searches, and alert preferences.
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[0.78rem] bg-transparent border border-[var(--border-2)] rounded-[10px] text-cream px-[0.875rem] py-[0.4rem] cursor-pointer hover:bg-[var(--surface-2)] transition-all"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/alerts/searches/new"
                className="flex items-center gap-[0.4rem] bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-black text-[0.8rem] font-medium px-4 py-[0.45rem] rounded-[10px] no-underline transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                New alert
              </Link>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-[var(--border)] mb-6">
            {TABS.map(({ id, label, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  text-[0.82rem] px-5 py-[0.875rem] border-b-2 transition-colors cursor-pointer
                  bg-transparent whitespace-nowrap
                  ${activeTab === id
                    ? 'text-[var(--accent)] border-[var(--accent)]'
                    : 'text-[var(--muted)] border-transparent hover:text-cream'
                  }
                `}
              >
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className="ml-2 text-[0.68rem] bg-[rgba(240,149,149,0.15)] text-[#f09595] px-[0.45rem] py-[0.1rem] rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div>
              {groups.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="font-display text-[1.5rem] tracking-[0.04em] text-cream mb-2">All caught up</div>
                  <p className="text-[0.85rem] text-[var(--muted)]">No new notifications right now.</p>
                </div>
              )}
              {groups.map(({ label, items }) => (
                <div key={label} className="mb-6">
                  <div className="text-[0.62rem] font-medium tracking-[0.14em] uppercase text-[var(--muted)] mb-3">
                    {label}
                  </div>
                  <div className="flex flex-col gap-[0.5rem]">
                    {items.map((notif) => (
                      <NotificationRow
                        key={notif.id}
                        notif={notif}
                        onDismiss={() => dismissNotif(notif.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SAVED SEARCHES ── */}
          {activeTab === 'searches' && (
            <div>
              <div className="flex justify-end mb-4">
                <Link
                  href="/alerts/searches/new"
                  className="flex items-center gap-[0.4rem] bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-black text-[0.8rem] font-medium px-4 py-[0.45rem] rounded-[10px] no-underline transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  New saved search
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {savedSearches.map((search) => (
                  <SavedSearchCard
                    key={search.id}
                    search={search}
                    onToggle={() => toggleSearch(search.id)}
                  />
                ))}
              </div>
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

// ── Notification Row ─────────────────────────────────────────

const NOTIF_ICON_CONFIG: Record<string, { bg: string; border: string; color: string; path: React.ReactNode }> = {
  closing: {
    bg: 'rgba(240,149,149,0.1)', border: 'rgba(240,149,149,0.18)', color: '#f09595',
    path: <><circle cx="6.5" cy="6.5" r="5.5" stroke="#f09595" strokeWidth="1.2"/><path d="M6.5 4v3" stroke="#f09595" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6.5" cy="9" r=".7" fill="#f09595"/></>,
  },
  'new-trial': {
    bg: 'rgba(232,255,71,0.08)', border: 'rgba(232,255,71,0.18)', color: '#e8ff47',
    path: <><path d="M6.5 1.5A4.5 4.5 0 0111 6c0 1.75.5 3 .9 4H1.1C1.5 9 2 7.75 2 6a4.5 4.5 0 014.5-4.5z" stroke="#e8ff47" strokeWidth="1.2"/><path d="M5.5 10a1 1 0 002 0" stroke="#e8ff47" strokeWidth="1.2" strokeLinecap="round"/></>,
  },
  'reg-open': {
    bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.18)', color: '#5dcaa5',
    path: <path d="M2.5 6.5l3 3 5.5-6" stroke="#5dcaa5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>,
  },
  reminder: {
    bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.18)', color: '#5dcaa5',
    path: <path d="M2.5 6.5l3 3 5.5-6" stroke="#5dcaa5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>,
  },
};

function NotificationRow({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const cfg = NOTIF_ICON_CONFIG[notif.type] ?? NOTIF_ICON_CONFIG['reg-open'];
  return (
    <div
      className={`
        flex items-start gap-4 p-4 rounded-[14px] border transition-all relative
        ${!notif.read
          ? 'bg-[rgba(232,255,71,0.025)] border-[rgba(232,255,71,0.18)]'
          : 'bg-[var(--surface-2)] border-[var(--border)]'
        }
      `}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span className="absolute top-4 right-4 w-[7px] h-[7px] rounded-full bg-[var(--accent)]" />
      )}

      {/* Icon */}
      <div
        className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}` }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">{cfg.path}</svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="text-[0.85rem] font-medium text-cream mb-[0.2rem] leading-[1.4]">
          {notif.title}
        </div>
        <div className="text-[0.75rem] text-[var(--muted)] leading-[1.55] mb-[0.4rem]">
          {notif.body}
        </div>
        {notif.trialId && (
          <div className="flex gap-2 mt-[0.625rem]">
            <Link
              href={`/trials/${notif.trialId}`}
              className="text-[0.72rem] font-medium bg-[var(--accent)] text-black px-3 py-[0.3rem] rounded-[8px] no-underline hover:bg-[var(--accent-dark)] transition-colors"
            >
              View trial →
            </Link>
            <button
              onClick={onDismiss}
              className="text-[0.72rem] font-medium bg-[var(--surface-3)] text-[var(--muted)] border border-[var(--border)] px-3 py-[0.3rem] rounded-[8px] cursor-pointer hover:text-cream transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="text-[0.68rem] text-[var(--muted-2)] mt-[0.4rem]">
          {formatRelativeTime(notif.createdAt)}
        </div>
      </div>
    </div>
  );
}

// ── Saved Search Card ────────────────────────────────────────

function SavedSearchCard({ search, onToggle }: { search: SavedSearch; onToggle: () => void }) {
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[14px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div>
          <div className="text-[0.88rem] font-medium text-cream flex items-center gap-2 mb-[0.15rem]">
            {search.label}
            {search.newMatchCount && (
              <span className="text-[0.62rem] bg-[rgba(232,255,71,0.1)] text-[var(--accent)] border border-[rgba(232,255,71,0.2)] px-[0.55rem] py-[0.15rem] rounded-full">
                {search.newMatchCount} new
              </span>
            )}
          </div>
          <div className="text-[0.72rem] text-[var(--muted)]">
            Alerts {search.alertsEnabled ? 'on' : 'off'} · checking daily
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[0.72rem] bg-transparent border border-[var(--border-2)] rounded-[8px] text-cream px-3 py-[0.3rem] cursor-pointer hover:bg-[var(--surface-3)] transition-all">
            Edit
          </button>
          {/* Toggle */}
          <button
            onClick={onToggle}
            className={`
              w-[38px] h-[22px] rounded-full border-none cursor-pointer relative transition-colors duration-200
              ${search.alertsEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--surface-3)]'}
            `}
            aria-label={search.alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
          >
            <span
              className="absolute top-[3px] w-4 h-4 rounded-full bg-black transition-transform duration-200"
              style={{ transform: search.alertsEnabled ? 'translateX(19px)' : 'translateX(3px)' }}
            />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-5 py-3">
        {search.orgs.map((org) => (
          <span key={org} className="text-[0.68rem] px-[0.6rem] py-[0.2rem] rounded-[5px] bg-[var(--surface-3)] text-[var(--muted)] border border-[var(--border)]">
            {org}
          </span>
        ))}
        {search.levels.slice(0, 3).map((level) => (
          <span key={level} className="text-[0.68rem] px-[0.6rem] py-[0.2rem] rounded-[5px] bg-[var(--surface-3)] text-[var(--muted)] border border-[var(--border)]">
            {level}
          </span>
        ))}
        <span className="text-[0.68rem] px-[0.6rem] py-[0.2rem] rounded-[5px] bg-[var(--surface-3)] text-[var(--muted)] border border-[var(--border)]">
          {search.distanceKm} km radius
        </span>
      </div>
    </div>
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
      <div className="text-[0.62rem] font-medium tracking-[0.14em] uppercase text-[var(--muted)] mb-1">
        Email notifications
      </div>

      {PREF_OPTIONS.map(({ key, label, sub }) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 px-4 py-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-[12px]"
        >
          <div>
            <div className="text-[0.85rem] font-medium text-cream mb-[0.15rem]">{label}</div>
            <div className="text-[0.72rem] text-[var(--muted)]">{sub}</div>
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

      <div className="text-[0.62rem] font-medium tracking-[0.14em] uppercase text-[var(--muted)] mt-2 mb-1">
        Notification frequency
      </div>

      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[12px] px-4 py-4">
        <div className="text-[0.82rem] text-[var(--muted)] mb-3">Send me alerts</div>
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
                  : 'bg-[var(--surface-3)] text-[var(--muted)] hover:text-cream'
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
