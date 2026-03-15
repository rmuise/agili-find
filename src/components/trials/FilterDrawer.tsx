'use client';

import { ORG_HEX_COLORS, ALL_LEVELS } from '@/lib/constants';
import type { SearchFilters } from '@/types/filters';

const FILTER_ORGS = ['akc', 'usdaa', 'cpe', 'nadac', 'uki', 'ckc'] as const;

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export function FilterDrawer({ isOpen, onClose, filters, onChange }: FilterDrawerProps) {
  const toggleOrg = (org: string) => {
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

  const activeCount =
    (6 - filters.orgs.length === 0 ? 0 : 6 - filters.orgs.length) +
    (filters.distanceKm < 500 ? 1 : 0) +
    (filters.dateFrom ? 1 : 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Floating action button */}
      <button
        className={`
          md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
          bg-[var(--accent)] text-black border-none rounded-full
          text-[0.85rem] font-medium px-6 py-3
          flex items-center gap-2 transition-all duration-150
          active:scale-[0.96]
          shadow-[0_4px_24px_rgba(232,255,71,0.25)]
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        style={{ minHeight: 48 }}
        aria-label="Open filters"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Filters{activeCount > 0 ? ` · ${activeCount} active` : ''}
      </button>

      {/* Drawer */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border-2)]
          rounded-t-[20px] z-[400] max-h-[82vh] overflow-y-auto
          transition-transform duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)]
          md:hidden
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-[var(--surface-3)] rounded-sm mx-auto mt-[0.875rem] mb-5" />

        {/* Header */}
        <div className="flex justify-between items-center px-5 mb-6">
          <span className="font-display text-[1.3rem] tracking-[0.04em]">Filters</span>
          <button
            onClick={onClose}
            className="bg-[var(--accent)] text-black border-none rounded-[10px] text-[0.85rem] font-medium px-5 py-[0.55rem] cursor-pointer"
            style={{ minHeight: 44 }}
          >
            Apply
          </button>
        </div>

        <div className="px-5 pb-8 flex flex-col gap-6">

          {/* Orgs */}
          <div>
            <SectionLabel>Organization</SectionLabel>
            {FILTER_ORGS.map((org) => (
              <DrawerRow
                key={org}
                label={org.toUpperCase()}
                dot={ORG_HEX_COLORS[org]}
                checked={filters.orgs.includes(org)}
                onChange={() => toggleOrg(org)}
              />
            ))}
          </div>

          {/* Distance */}
          <div>
            <SectionLabel>Distance</SectionLabel>
            <div className="flex justify-between text-[0.78rem] text-[var(--muted-text)] mb-2">
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
          </div>

          {/* Levels */}
          <div>
            <SectionLabel>Level</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {ALL_LEVELS.slice(0, 6).map((level) => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={`
                    text-[0.72rem] font-medium px-[0.9rem] py-[0.45rem]
                    rounded-full border transition-all duration-150
                    ${filters.levels.includes(level)
                      ? 'bg-[var(--surface-3)] border-[var(--border-2)] text-cream'
                      : 'bg-transparent border-[var(--border-2)] text-[var(--muted-text)]'
                    }
                  `}
                  style={{ minHeight: 32 }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[0.62rem] font-medium tracking-[0.16em] uppercase text-[var(--muted-text)] mb-3">
      {children}
    </div>
  );
}

function DrawerRow({
  label, dot, checked, onChange,
}: {
  label: string;
  dot?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between py-3 cursor-pointer border-b border-[var(--border)] last:border-0 active:opacity-70"
      onClick={onChange}
      style={{ minHeight: 48 }}
    >
      <div className="flex items-center gap-3 text-[0.9rem] text-cream">
        {dot && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />}
        {label}
      </div>
      <div
        className={`
          w-[18px] h-[18px] rounded-[5px] border shrink-0 flex items-center justify-center transition-all
          ${checked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--surface-2)] border-[var(--border-2)]'}
        `}
      >
        {checked && (
          <svg width="9" height="5" viewBox="0 0 9 5" fill="none">
            <path d="M1 2.5L3.5 4.5L8 1" stroke="#090909" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
