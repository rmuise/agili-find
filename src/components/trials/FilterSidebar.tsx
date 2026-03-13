'use client';

import { useState } from 'react';
import type { SearchFilters, OrgId, TrialStatus } from '@/lib/types';
import { DEFAULT_FILTERS, ALL_LEVELS } from '@/lib/types';

const ORGS: { id: OrgId; count: number }[] = [
  { id: 'AKC', count: 142 },
  { id: 'USDAA', count: 88 },
  { id: 'CPE', count: 74 },
  { id: 'NADAC', count: 61 },
  { id: 'UKI', count: 43 },
  { id: 'CKC', count: 29 },
];

const ORG_DOT_COLORS: Record<OrgId, string> = {
  AKC: '#85b7eb',
  USDAA: '#e8ff47',
  CPE: '#5dcaa5',
  UKI: '#ed93b1',
  NADAC: '#fac775',
  CKC: '#afa9ec',
};

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const toggleOrg = (org: OrgId) => {
    const orgs = filters.orgs.includes(org)
      ? filters.orgs.filter((o) => o !== org)
      : [...filters.orgs, org];
    onChange({ ...filters, orgs });
  };

  const toggleLevel = (level: string) => {
    const levels = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];
    onChange({ ...filters, levels });
  };

  const toggleStatus = (status: TrialStatus) => {
    const statuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses });
  };

  const clearAll = () => onChange(DEFAULT_FILTERS);

  return (
    <aside className="border-r border-[var(--border)] px-6 py-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto flex flex-col gap-7 scrollbar-none">

      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-[0.62rem] font-medium tracking-[0.16em] uppercase text-[var(--muted)]">
          Filters
        </span>
        <button
          onClick={clearAll}
          className="text-[0.75rem] text-[var(--muted)] bg-transparent border-none cursor-pointer hover:text-[var(--accent)] transition-colors p-0"
        >
          Clear all
        </button>
      </div>

      {/* Organization */}
      <FilterGroup title="Organization">
        {ORGS.map(({ id, count }) => (
          <FilterRow
            key={id}
            label={id}
            count={count}
            checked={filters.orgs.includes(id)}
            onChange={() => toggleOrg(id)}
            dot={ORG_DOT_COLORS[id]}
          />
        ))}
      </FilterGroup>

      {/* Date range */}
      <FilterGroup title="Date range">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="bg-[var(--surface-2)] border border-[var(--border-2)] rounded-[10px] text-cream text-[0.78rem] px-3 py-[0.55rem] outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors w-full"
          />
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="bg-[var(--surface-2)] border border-[var(--border-2)] rounded-[10px] text-cream text-[0.78rem] px-3 py-[0.55rem] outline-none focus:border-[rgba(232,255,71,0.4)] transition-colors w-full"
          />
        </div>
      </FilterGroup>

      {/* Distance */}
      <FilterGroup title="Distance">
        <div className="flex justify-between text-[0.78rem] text-[var(--muted)] mb-2">
          <span>Within</span>
          <strong className="text-[var(--accent)] font-medium">{filters.distanceKm} km</strong>
        </div>
        <input
          type="range"
          min={25}
          max={500}
          step={25}
          value={filters.distanceKm}
          onChange={(e) => onChange({ ...filters, distanceKm: Number(e.target.value) })}
        />
      </FilterGroup>

      {/* Level */}
      <FilterGroup title="Level">
        <div className="flex flex-wrap gap-[0.4rem]">
          {ALL_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={`
                text-[0.7rem] font-medium tracking-[0.04em] px-[0.7rem] py-[0.3rem]
                rounded-full border transition-all duration-150 cursor-pointer
                ${filters.levels.includes(level)
                  ? 'bg-[var(--surface-3)] border-[var(--border-2)] text-cream'
                  : 'bg-transparent border-[var(--border-2)] text-[var(--muted)]'
                }
              `}
            >
              {level}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Status */}
      <FilterGroup title="Status">
        {(
          [
            { id: 'open' as TrialStatus, label: 'Open registration' },
            { id: 'low' as TrialStatus, label: 'Spots filling fast' },
            { id: 'soon' as TrialStatus, label: 'Opening soon' },
            { id: 'registering' as TrialStatus, label: 'Registering now' },
          ]
        ).map(({ id, label }) => (
          <FilterRow
            key={id}
            label={label}
            checked={filters.statuses.includes(id)}
            onChange={() => toggleStatus(id)}
          />
        ))}
      </FilterGroup>

    </aside>
  );
}

// ── Sub-components ─────────────────────────────────────────

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[0.62rem] font-medium tracking-[0.16em] uppercase text-[var(--muted)] mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

interface FilterRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
  dot?: string;
}

function FilterRow({ label, checked, onChange, count, dot }: FilterRowProps) {
  return (
    <div
      className="flex items-center justify-between py-2 cursor-pointer select-none active:opacity-70"
      onClick={onChange}
    >
      <div className="flex items-center gap-[0.6rem] text-[0.85rem] text-cream">
        {dot && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
        )}
        {label}
      </div>
      <div className="flex items-center gap-2">
        {count !== undefined && (
          <span className="text-[0.72rem] text-[var(--muted)]">{count}</span>
        )}
        <Checkbox checked={checked} />
      </div>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`
        w-[18px] h-[18px] rounded-[5px] border shrink-0 flex items-center justify-center transition-all duration-150
        ${checked
          ? 'bg-[var(--accent)] border-[var(--accent)]'
          : 'bg-[var(--surface-2)] border-[var(--border-2)]'
        }
      `}
    >
      {checked && (
        <svg width="9" height="5" viewBox="0 0 9 5" fill="none">
          <path d="M1 2.5L3.5 4.5L8 1" stroke="#090909" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
