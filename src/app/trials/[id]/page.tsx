'use client';

import { useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { OrgChip } from '@/components/ui/OrgChip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SaveButton } from '@/components/ui/SaveButton';
import { getTrialById, formatDateRange, daysUntil, fillPercent } from '@/lib/data';
import type { TrialClass } from '@/lib/types';

type Tab = 'overview' | 'schedule' | 'judges' | 'venue';

export default function TrialDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const trial = getTrialById(id);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
    new Set(trial?.classes.slice(0, 2).map((c) => c.name) ?? [])
  );

  if (!trial) return notFound();

  const {
    name, org, startDate, endDate, city, province, venueName, venueAddress,
    distanceKm, status, spotsTotal, spotsFilled, spotsRemaining,
    registrationCloses, levels, classes, rings, entryFee, entrySoftware,
    entryUrl, premiumUrl, judges, hostClub, surface, parking, crating,
  } = trial;

  const dateStr = formatDateRange(startDate, endDate);
  const daysLeft = registrationCloses ? daysUntil(registrationCloses) : null;
  const pct = fillPercent(spotsFilled, spotsTotal);

  const toggleClass = (className: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      next.has(className) ? next.delete(className) : next.add(className);
      return next;
    });
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'judges', label: 'Judges' },
    { id: 'venue', label: 'Venue' },
  ];

  return (
    <>
      <Navbar />

      {/* ── HERO STRIP ── */}
      <div className="border-b border-[var(--border)] px-5 md:px-8 pt-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(232,255,71,0.04)] to-transparent pointer-events-none" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[0.78rem] text-[var(--muted)] mb-4">
          <Link href="/" className="text-[var(--muted)] no-underline hover:text-cream transition-colors">Home</Link>
          <span className="text-[var(--muted-2)]">›</span>
          <Link href="/trials" className="text-[var(--muted)] no-underline hover:text-cream transition-colors">Trials</Link>
          <span className="text-[var(--muted-2)]">›</span>
          <span className="text-cream hidden sm:inline truncate max-w-[200px]">{name}</span>
        </div>

        <div className="flex items-start justify-between gap-6 mb-6 flex-wrap">
          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <OrgChip org={org} size="md" />
            </div>
            <h1 className="font-display text-[clamp(2rem,5vw,3.2rem)] tracking-[0.03em] leading-[0.92] text-cream mb-4">
              {name}
            </h1>
            <div className="flex flex-wrap gap-5">
              <MetaItem icon="calendar">{dateStr}</MetaItem>
              <MetaItem icon="pin">
                <strong className="text-cream font-medium">{city}, {province}</strong>
                {distanceKm !== undefined && <span> · {distanceKm} km away</span>}
              </MetaItem>
              <MetaItem icon="clock">
                {new Date(startDate).toDateString() === new Date(endDate).toDateString() ? '1 day' : '2 days'}
              </MetaItem>
              {rings && <MetaItem icon="ring">{rings} ring{rings > 1 ? 's' : ''}</MetaItem>}
            </div>
          </div>

          {/* Badges — desktop */}
          <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
            <StatusBadge status={status} spotsRemaining={spotsRemaining} />
            {registrationCloses && daysLeft !== null && (
              <div className="text-[0.72rem] text-[var(--muted)] text-right">
                Registration closes{' '}
                <strong className="text-[#fac775] font-medium">
                  {new Date(registrationCloses).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-[var(--border)] -mx-5 md:-mx-8 px-5 md:px-8 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                text-[0.82rem] px-5 py-[0.875rem] border-b-2 transition-colors whitespace-nowrap cursor-pointer bg-transparent
                ${activeTab === id
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--muted)] border-transparent hover:text-cream'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_340px] items-start">

        {/* ── LEFT CONTENT ── */}
        <div className="px-5 md:px-8 py-8 border-r border-[var(--border)] min-w-0">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-10">

              {/* Event info grid */}
              <Section title="Event info">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Host club', val: hostClub || '—' },
                    { label: 'Entry fee', val: entryFee ? `$${entryFee} / run` : '—' },
                    { label: 'Entry software', val: entrySoftware || '—', link: entryUrl },
                    { label: 'Premium', val: premiumUrl ? 'Download PDF' : '—', link: premiumUrl },
                    { label: 'Measuring', val: 'Sat 7:00 AM' },
                    { label: 'Check-in', val: '7:30 AM · Both days' },
                  ].map(({ label, val, link }) => (
                    <div key={label} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[14px] px-4 py-[0.875rem]">
                      <div className="text-[0.65rem] font-medium tracking-[0.12em] uppercase text-[var(--muted)] mb-[0.4rem]">
                        {label}
                      </div>
                      {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-[0.88rem] font-medium text-[var(--accent)] no-underline">
                          {val} ↗
                        </a>
                      ) : (
                        <div className="text-[0.88rem] font-medium text-cream">{val}</div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>

              {/* Classes */}
              <Section title="Classes offered">
                <table className="w-full border-collapse text-[0.82rem]">
                  <thead>
                    <tr>
                      {['Class', 'Levels', 'Ring', 'Day'].map((h) => (
                        <th key={h} className="text-left text-[0.65rem] font-medium tracking-[0.12em] uppercase text-[var(--muted)] pb-3 pr-3 border-b border-[var(--border)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls: TrialClass) => (
                      <tr key={cls.name} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="py-3 pr-3">
                          <span className="text-[0.65rem] px-[0.5rem] py-[0.15rem] rounded-[5px] bg-[rgba(55,138,221,0.1)] text-[#85b7eb] border border-[rgba(55,138,221,0.18)]">
                            {cls.name}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-[var(--muted)] text-[0.78rem]">
                          {cls.levels.join(' · ')}
                        </td>
                        <td className="py-3 pr-3">
                          {cls.ring && (
                            <span className="text-[0.62rem] font-medium tracking-[0.06em] px-[0.55rem] py-[0.18rem] rounded-[5px] bg-[var(--surface-3)] text-[var(--muted)] border border-[var(--border)]">
                              Ring {cls.ring}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-[var(--muted)] text-[0.78rem]">Both</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              {/* Judges */}
              {judges && judges.length > 0 && (
                <Section title="Judges">
                  {judges.map((judge) => (
                    <div key={judge.id} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-b-0">
                      <div className="w-9 h-9 rounded-full bg-[var(--surface-3)] border border-[var(--border-2)] flex items-center justify-center text-[0.72rem] font-medium text-[var(--muted)] shrink-0">
                        {judge.initials}
                      </div>
                      <div>
                        <div className="text-[0.88rem] font-medium text-cream">
                          {judge.firstName} {judge.lastName}
                        </div>
                        <div className="text-[0.72rem] text-[var(--muted)] mt-[0.1rem]">
                          {judge.classes.join(' · ')}{judge.ring ? ` — Ring ${judge.ring}` : ''}{judge.days ? ` · ${judge.days}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* Venue preview */}
              <Section title="Venue">
                <MapPlaceholder name={venueName} address={venueAddress} />
                <VenueRows surface={surface} parking={parking} crating={crating} />
              </Section>

            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="flex flex-col gap-8">
              {[
                {
                  day: `Day 1 — ${new Date(startDate).toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })}`,
                  rows: [
                    { time: '7:30 AM', cls: 'Standard', level: 'Novice', ring: 1, heights: '8"–12"' },
                    { time: '7:30 AM', cls: 'JWW', level: 'Novice', ring: 2, heights: '8"–12"' },
                    { time: '~10:00', cls: 'Standard', level: 'Open', ring: 1, heights: 'All' },
                    { time: '~10:00', cls: 'JWW', level: 'Open', ring: 2, heights: 'All' },
                    { time: '~12:30', cls: 'Standard', level: 'Excellent', ring: 1, heights: 'All' },
                    { time: '~12:30', cls: 'FAST', level: 'All levels', ring: 2, heights: 'All' },
                    { time: '~2:30', cls: 'Standard', level: 'Premier', ring: 1, heights: 'Preferred' },
                  ],
                },
                {
                  day: `Day 2 — ${new Date(endDate).toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })}`,
                  rows: [
                    { time: '8:00 AM', cls: 'Standard', level: 'All levels', ring: 1, heights: 'All' },
                    { time: '8:00 AM', cls: 'JWW', level: 'All levels', ring: 2, heights: 'All' },
                    { time: '~11:00', cls: 'ISC', level: 'Open & Excellent', ring: 1, heights: 'All' },
                    { time: '~11:00', cls: 'T2B', level: 'All heights', ring: 2, heights: 'All' },
                    { time: '~1:30', cls: 'JWW', level: 'Premier', ring: 2, heights: 'Preferred' },
                  ],
                },
              ].map(({ day, rows }) => (
                <Section key={day} title={day}>
                  <table className="w-full border-collapse text-[0.82rem]">
                    <thead>
                      <tr>
                        {['Time', 'Class', 'Ring', 'Heights'].map((h) => (
                          <th key={h} className="text-left text-[0.65rem] font-medium tracking-[0.12em] uppercase text-[var(--muted)] pb-3 pr-3 border-b border-[var(--border)]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
                          <td className="py-3 pr-3 text-[var(--muted)] whitespace-nowrap">{row.time}</td>
                          <td className="py-3 pr-3 text-cream">
                            {row.cls} — <span className="text-[var(--muted)]">{row.level}</span>
                          </td>
                          <td className="py-3 pr-3">
                            <span className="text-[0.62rem] font-medium tracking-[0.06em] px-[0.55rem] py-[0.18rem] rounded-[5px] bg-[var(--surface-3)] text-[var(--muted)] border border-[var(--border)]">
                              Ring {row.ring}
                            </span>
                          </td>
                          <td className="py-3 text-[var(--muted)]">{row.heights}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              ))}
            </div>
          )}

          {/* JUDGES TAB */}
          {activeTab === 'judges' && (
            <Section title="Judges">
              {(judges ?? []).map((judge) => (
                <div key={judge.id} className="flex items-center gap-4 py-4 border-b border-[var(--border)] last:border-b-0">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-3)] border border-[var(--border-2)] flex items-center justify-center text-[0.85rem] font-medium text-[var(--muted)] shrink-0">
                    {judge.initials}
                  </div>
                  <div>
                    <div className="text-[0.95rem] font-medium text-cream">{judge.firstName} {judge.lastName}</div>
                    <div className="text-[0.78rem] text-[var(--muted)] mt-[0.25rem]">
                      AKC Approved Judge — {judge.classes.join(', ')}
                    </div>
                    <div className="text-[0.75rem] text-[var(--muted)] mt-[0.15rem]">
                      {judge.ring ? `Ring ${judge.ring}` : ''}{judge.days ? ` · ${judge.days}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* VENUE TAB */}
          {activeTab === 'venue' && (
            <div className="flex flex-col gap-8">
              <Section title="Venue details">
                <MapPlaceholder name={venueName} address={venueAddress} large />
                <VenueRows surface={surface} parking={parking} crating={crating} />
              </Section>
            </div>
          )}

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="hidden md:flex flex-col gap-4 px-5 py-6 sticky top-14">

          {/* Registration card */}
          <div className="bg-[var(--surface-2)] border border-[var(--border-2)] rounded-[20px] overflow-hidden">

            {/* Header */}
            <div className="px-5 py-[1.125rem] border-b border-[var(--border)]">
              <div className="font-display text-[1.15rem] tracking-[0.04em] mb-[0.25rem]">
                Register for this trial
              </div>
              <div className="text-[0.75rem] text-[var(--muted)]">
                Via {entrySoftware || 'host club'} · {org} event
              </div>
            </div>

            {/* Progress */}
            {spotsTotal && spotsFilled && (
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <div className="flex justify-between text-[0.72rem] text-[var(--muted)] mb-2">
                  <span>Spots filled</span>
                  <strong className="text-cream">{spotsFilled} / {spotsTotal}</strong>
                </div>
                <div className="h-1 bg-[var(--surface-3)] rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: pct > 85 ? '#f09595' : 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Deadline */}
            {registrationCloses && daysLeft !== null && (
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--border)] text-[0.78rem] text-[var(--muted)]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#fac775" strokeWidth="1.2" />
                  <path d="M6 3.5v2.5l1.5 1" stroke="#fac775" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Closes{' '}
                <strong className="text-[#fac775] font-medium">
                  {new Date(registrationCloses).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                </strong>
                &nbsp;— {daysLeft} days away
              </div>
            )}

            {/* Class selector */}
            <div className="px-5 py-4">
              <div className="text-[0.65rem] font-medium tracking-[0.12em] uppercase text-[var(--muted)] mb-3">
                Select classes
              </div>
              <div className="flex flex-col gap-[0.4rem] mb-4">
                {classes.map((cls: TrialClass) => {
                  const sel = selectedClasses.has(cls.name);
                  return (
                    <div
                      key={cls.name}
                      onClick={() => toggleClass(cls.name)}
                      className={`
                        flex items-center justify-between px-[0.875rem] py-[0.6rem]
                        rounded-[10px] border cursor-pointer transition-all duration-150 select-none
                        active:scale-[0.98]
                        ${sel
                          ? 'bg-[rgba(232,255,71,0.07)] border-[rgba(232,255,71,0.3)]'
                          : 'bg-[var(--surface-3)] border-[var(--border)] hover:border-[var(--border-2)]'
                        }
                      `}
                    >
                      <div>
                        <div className="text-[0.82rem] text-cream">{cls.name}</div>
                        <div className={`text-[0.7rem] mt-[0.1rem] ${cls.spotsRemaining && cls.spotsRemaining < 5 ? 'text-[#f09595]' : 'text-[var(--muted)]'}`}>
                          {cls.spotsRemaining && cls.spotsRemaining < 5
                            ? `${cls.spotsRemaining} spots left`
                            : 'Open'}
                        </div>
                      </div>
                      <div
                        className={`
                          w-4 h-4 rounded-[4px] border shrink-0 flex items-center justify-center transition-all
                          ${sel ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--surface-2)] border-[var(--border-2)]'}
                        `}
                      >
                        {sel && (
                          <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                            <path d="M1 2L3 4L7 1" stroke="#090909" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <a
                href={entryUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  block w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] active:scale-[0.98]
                  text-black text-center font-sans text-[0.9rem] font-medium
                  py-[0.875rem] rounded-[10px] transition-all no-underline
                "
                style={{ minHeight: 48 }}
              >
                Register on {entrySoftware || 'host site'} →
              </a>
              <p className="text-[0.7rem] text-[rgba(245,242,237,0.2)] text-center mt-[0.625rem] leading-[1.5]">
                You'll be taken to the host club's entry system to complete registration.
              </p>
            </div>
          </div>

          {/* Quick info */}
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[14px] overflow-hidden">
            {[
              { label: 'Dates', val: dateStr },
              { label: 'Location', val: `${city}, ${province}${distanceKm ? ` · ${distanceKm} km` : ''}` },
              { label: 'Entry fee', val: entryFee ? `$${entryFee} / run` : '—' },
              { label: 'Rings', val: rings ? `${rings} ring${rings > 1 ? 's' : ''}` : '—' },
              { label: 'Levels', val: levels.slice(0, 3).join(', ') + (levels.length > 3 ? '…' : '') },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-b-0 text-[0.8rem]">
                <span className="text-[var(--muted)]">{label}</span>
                <span className="text-cream text-right max-w-[160px] truncate">{val}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <SaveButton trialId={trial.id} className="flex-1 justify-center" />
            <button className="flex-1 flex items-center justify-center gap-2 text-[0.78rem] font-medium px-[0.875rem] py-[0.4rem] rounded-[10px] border border-[var(--border-2)] text-[var(--muted)] bg-transparent hover:bg-[var(--surface-2)] transition-all cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="2" cy="6" r="1.2" fill="currentColor" />
                <circle cx="6" cy="2" r="1.2" fill="currentColor" />
                <circle cx="10" cy="6" r="1.2" fill="currentColor" />
                <path d="M2 6L6 2M6 2L10 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Share
            </button>
          </div>

        </div>
      </div>

      {/* ── MOBILE STICKY CTA ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[rgba(9,9,9,0.95)] backdrop-blur-xl border-t border-[var(--border-2)] px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-[150] flex items-center justify-between gap-4">
        <div className="text-[0.78rem] text-[var(--muted)]">
          <strong className="text-cream text-[0.88rem] block font-medium">{name}</strong>
          {spotsRemaining ? `${spotsRemaining} spots` : 'Open'} · {registrationCloses ? `closes ${new Date(registrationCloses).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}` : ''}
        </div>
        <a
          href={entryUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-black font-sans text-[0.9rem] font-medium px-6 py-3 rounded-[10px] no-underline whitespace-nowrap active:scale-[0.96] transition-all"
          style={{ minHeight: 48 }}
        >
          Register →
        </a>
      </div>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 font-display text-[1.1rem] tracking-[0.06em] text-cream mb-4">
        {title}
        <span className="flex-1 h-px bg-[var(--border)]" />
      </div>
      {children}
    </div>
  );
}

function MetaItem({ icon, children }: { icon: string; children: React.ReactNode }) {
  const icons: Record<string, React.ReactNode> = {
    calendar: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1" y="2" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1 5h11" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 1v2M9 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    pin: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1C4.567 1 3 2.567 3 4.5c0 2.8 3.5 7 3.5 7S10 7.3 10 4.5C10 2.567 8.433 1 6.5 1z" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="6.5" cy="4.5" r="1.2" fill="currentColor" />
      </svg>
    ),
    clock: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6.5 3.5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    ring: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="2" y="4" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 4V3a1.5 1.5 0 013 0v1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-[0.4rem] text-[0.85rem] text-[var(--muted)]">
      <span className="opacity-60 shrink-0">{icons[icon]}</span>
      {children}
    </div>
  );
}

function MapPlaceholder({ name, address, large }: { name: string; address?: string; large?: boolean }) {
  return (
    <div
      className={`
        bg-[var(--surface-2)] border border-[var(--border-2)] rounded-[14px]
        flex flex-col items-center justify-center gap-3 cursor-pointer mb-4
        hover:border-[rgba(232,255,71,0.3)] transition-colors
        ${large ? 'h-48' : 'h-[200px]'}
      `}
    >
      <div className="w-10 h-10 bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.2)] rounded-[10px] flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1C6.24 1 4 3.24 4 6c0 3.75 5 11 5 11s5-7.25 5-11c0-2.76-2.24-5-5-5z" stroke="#e8ff47" strokeWidth="1.3" />
          <circle cx="9" cy="6" r="1.75" fill="#e8ff47" />
        </svg>
      </div>
      <div className="text-[0.82rem] text-[var(--muted)]">{name}</div>
      {address && <div className="text-[0.72rem] text-[var(--muted-2)]">Tap to open in Maps</div>}
    </div>
  );
}

function VenueRows({ surface, parking, crating }: { surface?: string; parking?: string; crating?: string }) {
  const rows = [
    { label: 'Surface', val: surface },
    { label: 'Parking', val: parking },
    { label: 'Crating', val: crating },
  ].filter((r) => r.val);

  return (
    <div>
      {rows.map(({ label, val }) => (
        <div key={label} className="flex items-start gap-3 py-[0.6rem] border-b border-[var(--border)] last:border-b-0">
          <span className="text-[0.72rem] text-[var(--muted)] w-[90px] shrink-0 pt-[1px]">{label}</span>
          <span className="text-[0.82rem] text-cream leading-[1.5]">{val}</span>
        </div>
      ))}
    </div>
  );
}
