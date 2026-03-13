'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { OrgChip } from '@/components/ui/OrgChip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MOCK_TRIALS, formatDateRange } from '@/lib/data';
import { MOCK_USER, MOCK_NOTIFICATIONS, formatRelativeTime } from '@/lib/user-data';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const TRIAL_DAYS = new Set([5, 6, 12, 13, 26, 27, 3]); // April days with trials

export default function DashboardPage() {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const savedTrials = MOCK_TRIALS.filter(
    (t) => MOCK_USER.savedTrialIds.includes(t.id) && !removedIds.has(t.id)
  );
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  const upcoming = savedTrials.filter((t) => new Date(t.startDate) >= new Date()).slice(0, 3);
  const closingSoon = savedTrials.filter((t) => t.status === 'low' || t.status === 'soon');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <Navbar />
      <div className="grid md:grid-cols-[220px_1fr] min-h-[calc(100vh-56px)] items-start">
        <DashboardSidebar />

        <main className="px-5 md:px-8 py-8 min-w-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-[2rem] tracking-[0.04em] text-cream mb-1">
              {greeting}, {MOCK_USER.firstName}
            </h1>
            <p className="text-[0.85rem] text-[var(--muted)] font-light">
              Here's what's happening with your trials this week.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Saved Trials', value: savedTrials.length, sub: `${closingSoon.length} closing soon`, accent: false },
              { label: 'Upcoming', value: upcoming.length, sub: `Next: ${upcoming[0] ? new Date(upcoming[0].startDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'}`, accent: false },
              { label: 'Saved Searches', value: MOCK_USER.savedSearches.length, sub: MOCK_USER.homeLocation ?? '', accent: false },
              { label: 'Alerts', value: unreadCount, sub: 'New this week', accent: unreadCount > 0 },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[14px] px-5 py-4">
                <div className="text-[0.62rem] font-medium tracking-[0.12em] uppercase text-[var(--muted)] mb-[0.4rem]">
                  {label}
                </div>
                <div
                  className="font-display text-[2rem] leading-none tracking-[0.04em] mb-[0.25rem]"
                  style={{ color: accent ? '#f09595' : 'var(--cream)' }}
                >
                  {value}
                </div>
                <div className="text-[0.72rem] text-[var(--muted)]">{sub}</div>
              </div>
            ))}
          </div>

          {/* Two column layout */}
          <div className="grid lg:grid-cols-2 gap-8">

            {/* LEFT — saved trials + alerts */}
            <div className="flex flex-col gap-8">

              {/* Saved trials */}
              <div>
                <SectionHeader title="Saved Trials" action={{ label: 'View all →', href: '/dashboard/saved' }} />
                <div className="flex flex-col gap-[0.625rem]">
                  {savedTrials.slice(0, 4).map((trial) => (
                    <div
                      key={trial.id}
                      className={`
                        bg-[var(--surface-2)] border rounded-[14px] px-5 py-4
                        grid grid-cols-[1fr_auto] gap-3
                        transition-all duration-150
                        ${trial.status === 'low' ? 'border-[rgba(232,255,71,0.3)]' : 'border-[var(--border)]'}
                      `}
                    >
                      <div className="min-w-0">
                        <Link href={`/trials/${trial.id}`} className="text-[0.92rem] font-medium text-cream no-underline hover:text-[var(--accent)] transition-colors block mb-[0.25rem] truncate">
                          {trial.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[0.75rem] text-[var(--muted)] flex-wrap">
                          <span>{formatDateRange(trial.startDate, trial.endDate)}</span>
                          <span className="w-[2.5px] h-[2.5px] rounded-full bg-[var(--muted-2)] inline-block" />
                          <span>{trial.city}, {trial.province}</span>
                          {trial.distanceKm && (
                            <>
                              <span className="w-[2.5px] h-[2.5px] rounded-full bg-[var(--muted-2)] inline-block" />
                              <span>{trial.distanceKm} km</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <OrgChip orgId={trial.org} />
                        <StatusBadge status={trial.status} spotsRemaining={trial.spotsRemaining} />
                        <button
                          onClick={() => setRemovedIds((prev) => new Set([...prev, trial.id]))}
                          className="text-[0.68rem] text-[var(--muted)] bg-transparent border-none cursor-pointer hover:text-[#f09595] transition-colors p-0"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {savedTrials.length === 0 && (
                    <EmptyState
                      title="No saved trials"
                      sub="Browse trials and save ones you're interested in."
                      action={{ label: 'Browse trials', href: '/trials' }}
                    />
                  )}
                </div>
              </div>

              {/* Recent alerts */}
              <div>
                <SectionHeader title="Recent Alerts" action={{ label: 'View all →', href: '/alerts' }} />
                <div className="flex flex-col gap-[0.5rem]">
                  {MOCK_NOTIFICATIONS.slice(0, 3).map((notif) => (
                    <div
                      key={notif.id}
                      className={`
                        flex items-center gap-4 px-4 py-[0.875rem]
                        bg-[var(--surface-2)] border rounded-[12px]
                        ${!notif.read ? 'border-[rgba(232,255,71,0.18)]' : 'border-[var(--border)]'}
                      `}
                    >
                      <NotifIcon type={notif.type} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.82rem] font-medium text-cream mb-[0.1rem] truncate">
                          {notif.title}
                        </div>
                        <div className="text-[0.72rem] text-[var(--muted)] line-clamp-1">
                          {notif.body}
                        </div>
                      </div>
                      <div className="text-[0.68rem] text-[var(--muted-2)] shrink-0 whitespace-nowrap">
                        {formatRelativeTime(notif.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — calendar + upcoming + saved searches */}
            <div className="flex flex-col gap-8">

              {/* Mini calendar */}
              <div>
                <SectionHeader title="April 2026" />
                <MiniCalendar trialDays={TRIAL_DAYS} />
              </div>

              {/* Coming up */}
              <div>
                <SectionHeader title="Coming Up" />
                <div className="divide-y divide-[var(--border)]">
                  {upcoming.map((trial, i) => {
                    const d = new Date(trial.startDate);
                    return (
                      <div key={trial.id} className={`flex items-center gap-4 py-3 ${i === 0 ? 'pt-0' : ''}`}>
                        <div className="text-center min-w-[48px] shrink-0">
                          <div className="font-display text-[0.65rem] tracking-[0.1em] text-[var(--accent)]">
                            {d.toLocaleDateString('en-CA', { month: 'short' }).toUpperCase()}
                          </div>
                          <div className="font-display text-[1.2rem] leading-none tracking-[0.04em] text-cream">
                            {d.getDate()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/trials/${trial.id}`} className="text-[0.85rem] font-medium text-cream no-underline hover:text-[var(--accent)] transition-colors block truncate mb-[0.15rem]">
                            {trial.name}
                          </Link>
                          <div className="text-[0.72rem] text-[var(--muted)]">
                            {trial.city}, {trial.province}
                          </div>
                        </div>
                        <OrgChip orgId={trial.org} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Saved searches */}
              <div>
                <SectionHeader title="Saved Searches" action={{ label: '+ Add', href: '/alerts/searches' }} />
                <div className="flex flex-col gap-[0.5rem]">
                  {MOCK_USER.savedSearches.map((search) => (
                    <Link
                      key={search.id}
                      href={`/trials?location=${encodeURIComponent(search.location)}`}
                      className="
                        flex items-center justify-between gap-4
                        bg-[var(--surface-2)] border border-[var(--border)]
                        rounded-[12px] px-4 py-[0.875rem]
                        no-underline cursor-pointer hover:border-[var(--border-2)] transition-colors
                      "
                    >
                      <div>
                        <div className="text-[0.85rem] font-medium text-cream mb-[0.15rem] flex items-center gap-2">
                          {search.label}
                          {search.newMatchCount && (
                            <span className="text-[0.62rem] bg-[rgba(232,255,71,0.1)] text-[var(--accent)] border border-[rgba(232,255,71,0.2)] px-[0.55rem] py-[0.15rem] rounded-full">
                              {search.newMatchCount} new
                            </span>
                          )}
                        </div>
                        <div className="text-[0.72rem] text-[var(--muted)]">
                          {search.orgs.join(' · ')} · {search.distanceKm} km
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--muted)] shrink-0">
                        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3 font-display text-[1.1rem] tracking-[0.06em] text-cream flex-1">
        {title}
        <span className="flex-1 h-px bg-[var(--border)]" />
      </div>
      {action && (
        <Link href={action.href} className="text-[0.75rem] text-[var(--muted)] no-underline hover:text-[var(--accent)] transition-colors ml-3 shrink-0">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function EmptyState({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-[var(--border-2)] rounded-[14px] gap-3">
      <div className="text-[0.88rem] font-medium text-cream">{title}</div>
      <div className="text-[0.78rem] text-[var(--muted)] max-w-[200px] leading-[1.6]">{sub}</div>
      {action && (
        <Link href={action.href} className="text-[0.78rem] bg-[var(--accent)] text-black font-medium px-4 py-[0.45rem] rounded-[8px] no-underline hover:bg-[var(--accent-dark)] transition-colors mt-1">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function NotifIcon({ type }: { type: string }) {
  const configs: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    closing: {
      bg: 'rgba(240,149,149,0.1)', border: 'rgba(240,149,149,0.18)',
      icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#f09595" strokeWidth="1.2"/><path d="M6.5 4v3" stroke="#f09595" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6.5" cy="9" r=".7" fill="#f09595"/></svg>,
    },
    'new-trial': {
      bg: 'rgba(232,255,71,0.08)', border: 'rgba(232,255,71,0.18)',
      icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5A4.5 4.5 0 0111 6c0 1.75.5 3 .9 4H1.1C1.5 9 2 7.75 2 6a4.5 4.5 0 014.5-4.5z" stroke="#e8ff47" strokeWidth="1.2"/><path d="M5.5 10a1 1 0 002 0" stroke="#e8ff47" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
    'reg-open': {
      bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.18)',
      icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5l3 3 5.5-6" stroke="#5dcaa5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    reminder: {
      bg: 'rgba(93,202,165,0.1)', border: 'rgba(93,202,165,0.18)',
      icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5l3 3 5.5-6" stroke="#5dcaa5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
  };
  const c = configs[type] ?? configs['reg-open'];
  return (
    <div
      className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
      style={{ background: c.bg, border: `0.5px solid ${c.border}` }}
    >
      {c.icon}
    </div>
  );
}

function MiniCalendar({ trialDays }: { trialDays: Set<number> }) {
  const today = new Date().getDate();
  // April 2026 starts on Wednesday (index 3)
  const startPad = 3;
  const daysInMonth = 30;
  const cells: { day: number | null; prevMonth?: boolean; nextMonth?: boolean }[] = [];

  for (let i = 0; i < startPad; i++) cells.push({ day: 30 - startPad + i + 1, prevMonth: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  const remaining = 35 - cells.length;
  for (let i = 1; i <= remaining; i++) cells.push({ day: i, nextMonth: true });

  return (
    <div>
      <div className="grid grid-cols-7 gap-[0.375rem] mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[0.62rem] font-medium tracking-[0.08em] uppercase text-[var(--muted)] py-[0.375rem]">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[0.375rem]">
        {cells.map((cell, i) => {
          const isTrial = !cell.prevMonth && !cell.nextMonth && cell.day !== null && trialDays.has(cell.day);
          const isToday = !cell.prevMonth && !cell.nextMonth && cell.day === today;
          return (
            <div
              key={i}
              className={`
                aspect-square flex items-center justify-center text-[0.78rem]
                rounded-[8px] cursor-pointer transition-all duration-150 relative
                ${cell.prevMonth || cell.nextMonth ? 'text-[rgba(245,242,237,0.15)]' : ''}
                ${isToday ? 'bg-[rgba(232,255,71,0.1)] text-[var(--accent)] font-medium' : ''}
                ${!isToday && !cell.prevMonth && !cell.nextMonth ? 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-cream' : ''}
                ${isTrial && !isToday ? 'text-cream font-medium' : ''}
              `}
            >
              {cell.day}
              {isTrial && (
                <span className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full bg-[var(--accent)]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
