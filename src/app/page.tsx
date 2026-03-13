'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MOCK_TRIALS } from '@/lib/data';
import { OrgChip } from '@/components/ui/OrgChip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Navbar } from '@/components/layout/Navbar';
import type { OrgId } from '@/lib/types';
import { formatDateRange } from '@/lib/data';

const ALL_ORGS: OrgId[] = ['AKC', 'USDAA', 'CPE', 'NADAC', 'UKI', 'CKC'];

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<OrgId | 'all'>('all');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (selectedOrg !== 'all') params.set('org', selectedOrg);
    router.push(`/trials?${params.toString()}`);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const featuredTrials = MOCK_TRIALS.slice(0, 6);

  return (
    <>
      <Navbar />
      <main>
        {/* ── HERO ── */}
        <section className="grid md:grid-cols-2 min-h-[calc(100vh-56px)] border-b border-[var(--border)]">

          {/* Left */}
          <div className="flex flex-col justify-center px-5 md:px-12 py-10 border-b md:border-b-0 md:border-r border-[var(--border)]">
            <div className="flex items-center gap-3 text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[var(--accent)] mb-5">
              <span className="w-6 h-px bg-[var(--accent)] block shrink-0" />
              Dog agility trial finder
            </div>

            <h1 className="font-display text-[clamp(3.5rem,14vw,6.5rem)] leading-[0.9] tracking-[0.02em] mb-6">
              Find Your{' '}
              <span className="text-[var(--accent)] block">Next Run</span>
              Anywhere.
            </h1>

            <p className="text-[0.95rem] font-light text-[var(--muted)] leading-[1.75] max-w-md mb-8">
              AKC, USDAA, CPE, NADAC, UKI, and CKC — every trial, one search.
              Stop jumping between six different websites and start spending more
              time at the start line.
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row bg-[var(--surface-2)] border border-[var(--border-2)] rounded-[14px] overflow-hidden max-w-[480px] mb-5 focus-within:border-[rgba(232,255,71,0.5)] transition-colors">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={handleKey}
                placeholder="City, state, or postal code…"
                autoComplete="off"
                autoCorrect="off"
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-cream font-light text-[1rem] sm:text-[0.9rem] px-4 py-[0.9rem] placeholder:text-[var(--muted-2)]"
              />
              <div className="hidden sm:block w-px bg-[var(--border)] self-stretch shrink-0" />
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value as OrgId | 'all')}
                className="bg-transparent border-t sm:border-t-0 border-[var(--border)] outline-none text-[var(--muted)] font-sans text-[1rem] sm:text-[0.8rem] px-4 py-[0.9rem] cursor-pointer appearance-none"
              >
                <option value="all">All orgs</option>
                {ALL_ORGS.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] active:scale-[0.98] text-black font-display text-[1rem] tracking-[0.08em] px-6 py-[0.9rem] sm:py-0 transition-all border-none cursor-pointer"
                style={{ minHeight: 48 }}
              >
                Search →
              </button>
            </div>

            {/* Org pills */}
            <div className="flex gap-2 flex-wrap">
              <OrgPill
                label="All"
                active={selectedOrg === 'all'}
                onClick={() => setSelectedOrg('all')}
              />
              {ALL_ORGS.map((org) => (
                <OrgPill
                  key={org}
                  label={org}
                  active={selectedOrg === org}
                  onClick={() => setSelectedOrg(org)}
                />
              ))}
            </div>
          </div>

          {/* Right — trial preview cards */}
          <div className="flex flex-col justify-center px-5 md:px-8 py-6 gap-3">
            <div className="text-[0.65rem] font-medium tracking-[0.14em] uppercase text-[var(--muted)] mb-1">
              Upcoming near Ottawa, ON
            </div>
            {featuredTrials.map((trial) => (
              <Link key={trial.id} href={`/trials/${trial.id}`} className="block no-underline">
                <div
                  className={`
                    bg-[var(--surface-2)] border rounded-[14px] px-4 py-[0.875rem]
                    flex justify-between items-start gap-3
                    cursor-pointer transition-all duration-150
                    hover:bg-[rgba(232,255,71,0.03)] hover:border-[rgba(232,255,71,0.3)]
                    active:scale-[0.98]
                    relative
                    ${trial.featured ? 'border-[rgba(232,255,71,0.4)]' : 'border-[var(--border)]'}
                  `}
                >
                  {trial.status === 'low' && (
                    <div className="absolute top-[0.75rem] right-[0.875rem] text-[0.58rem] font-medium tracking-[0.1em] uppercase bg-[rgba(232,255,71,0.12)] text-[var(--accent)] border border-[rgba(232,255,71,0.3)] px-2 py-[0.15rem] rounded-full">
                      Open
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-[0.9rem] font-medium text-cream mb-[0.25rem] pr-14">
                      {trial.name}
                    </div>
                    <div className="flex items-center gap-2 text-[0.75rem] text-[var(--muted)] flex-wrap">
                      <span>{formatDateRange(trial.startDate, trial.endDate)}</span>
                      <span className="w-[2.5px] h-[2.5px] rounded-full bg-[var(--muted-2)] inline-block" />
                      <span>{trial.city}, {trial.province}</span>
                    </div>
                    {trial.status === 'low' && trial.spotsRemaining && (
                      <div className="text-[0.68rem] text-[#f09595] mt-[0.2rem]">
                        {trial.spotsRemaining} spots remaining
                      </div>
                    )}
                  </div>
                  <OrgChip org={trial.org} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[var(--border)]">
          {[
            { num: '2,400', label: 'Trials Listed' },
            { num: '6', label: 'Organizations' },
            { num: '38', label: 'States & Provinces' },
            { num: 'Daily', label: 'Data Refresh' },
          ].map(({ num, label }) => (
            <div key={label} className="py-8 text-center border-r border-[var(--border)] last:border-r-0 [&:nth-child(2)]:border-r-0 md:[&:nth-child(2)]:border-r [&:nth-child(3)]:border-t md:[&:nth-child(3)]:border-t-0">
              <div className="font-display text-[2.4rem] leading-none tracking-[0.04em] text-cream mb-[0.3rem]">
                <span className="text-[var(--accent)]">{num}</span>
              </div>
              <div className="text-[0.65rem] font-medium tracking-[0.1em] uppercase text-[var(--muted)]">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── FEATURES ── */}
        <section className="grid md:grid-cols-3 border-b border-[var(--border)]">
          {[
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#e8ff47" strokeWidth="1.4" />
                  <path d="M11 11l3 3" stroke="#e8ff47" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              ),
              title: 'One Search',
              body: 'Every org in a single unified view. No more tab-switching between six different club websites.',
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v4l2.5 1.5" stroke="#e8ff47" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="8" cy="8" r="6" stroke="#e8ff47" strokeWidth="1.4" />
                </svg>
              ),
              title: 'Smart Alerts',
              body: 'Get notified when trials open near you or when registration goes live for events on your watchlist.',
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 12l4-4 3 3 5-6" stroke="#e8ff47" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              title: 'Season Planner',
              body: 'Bookmark trials, build your calendar, and track entered events across every organization in one dashboard.',
            },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="px-8 py-10 border-r border-[var(--border)] last:border-r-0 border-b md:border-b-0"
            >
              <div className="w-[38px] h-[38px] bg-[rgba(232,255,71,0.07)] border border-[rgba(232,255,71,0.18)] rounded-[10px] flex items-center justify-center mb-5 shrink-0">
                {icon}
              </div>
              <h3 className="font-display text-[1.2rem] tracking-[0.04em] text-cream mb-2">
                {title}
              </h3>
              <p className="text-[0.82rem] font-light text-[var(--muted)] leading-[1.75]">
                {body}
              </p>
            </div>
          ))}
        </section>

        {/* ── FOOTER ── */}
        <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-8 py-5">
          <div className="font-display text-[1rem] tracking-[0.08em] text-[var(--muted)]">
            Agi<span className="text-[var(--accent)]">Find</span>
          </div>
          <ul className="flex gap-6 list-none flex-wrap">
            {['About', 'Submit a Trial', 'Contact', 'Privacy'].map((item) => (
              <li key={item}>
                <Link href="#" className="text-[0.72rem] text-[rgba(245,242,237,0.25)] no-underline hover:text-[var(--muted)] transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      </main>
    </>
  );
}

function OrgPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        text-[0.68rem] font-medium tracking-[0.06em] px-[0.9rem] py-[0.4rem]
        rounded-full border transition-all duration-150 cursor-pointer
        active:scale-[0.95]
        ${active
          ? 'bg-[var(--accent)] border-[var(--accent)] text-black'
          : 'bg-transparent border-[var(--border-2)] text-[var(--muted)]'
        }
      `}
      style={{ minHeight: 32 }}
    >
      {label}
    </button>
  );
}
