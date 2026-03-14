'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { OrgChip } from '@/components/ui/OrgChip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MOCK_TRIALS, formatDateRange } from '@/lib/data';
import type { Trial, OrgId } from '@/lib/types';

const ALL_ORGS: OrgId[] = ['AKC', 'USDAA', 'CPE', 'NADAC', 'UKI', 'CKC'];

// Approximate pin positions as % of a 600x400 map area (Ottawa region)
const PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  'trial-001': { x: 42, y: 44 },
  'trial-002': { x: 50, y: 40 },
  'trial-003': { x: 55, y: 65 },
  'trial-004': { x: 36, y: 34 },
  'trial-005': { x: 48, y: 55 },
  'trial-006': { x: 78, y: 62 },
  'trial-007': { x: 72, y: 52 },
};

export default function MapPage() {
  const [selectedId, setSelectedId] = useState<string | null>('trial-001');
  const [activeOrgs, setActiveOrgs] = useState<Set<OrgId>>(new Set(ALL_ORGS));
  const [searchInput, setSearchInput] = useState('Ottawa, ON');

  const toggleOrg = (org: OrgId) => {
    setActiveOrgs((prev) => {
      const next = new Set(prev);
      next.has(org) ? next.delete(org) : next.add(org);
      return next;
    });
  };

  const visibleTrials = MOCK_TRIALS.filter((t) => activeOrgs.has(t.org));
  const selectedTrial = MOCK_TRIALS.find((t) => t.id === selectedId);

  const ORG_COLORS: Record<OrgId, string> = {
    AKC: '#85b7eb', USDAA: '#e8ff47', CPE: '#5dcaa5',
    UKI: '#ed93b1', NADAC: '#fac775', CKC: '#afa9ec',
  };

  return (
    <>
      <Navbar
        showSearch
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={() => {}}
      />

      <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] overflow-hidden">

        {/* ── SIDE PANEL ── */}
        <div className="w-full md:w-[320px] border-r border-[var(--border)] flex flex-col shrink-0 h-[45vh] md:h-full">

          {/* Org filter pills */}
          <div className="px-4 py-3 border-b border-[var(--border)] flex gap-[0.35rem] flex-wrap">
            {ALL_ORGS.map((org) => (
              <button
                key={org}
                onClick={() => toggleOrg(org)}
                className={`
                  text-[0.65rem] font-medium tracking-[0.06em] px-[0.7rem] py-[0.28rem]
                  rounded-full border cursor-pointer transition-all duration-150
                  ${activeOrgs.has(org)
                    ? ''
                    : 'bg-transparent border-[var(--border)] text-[var(--muted-text)]'
                  }
                `}
                style={
                  activeOrgs.has(org)
                    ? {
                        background: `${ORG_COLORS[org]}18`,
                        borderColor: `${ORG_COLORS[org]}40`,
                        color: ORG_COLORS[org],
                      }
                    : {}
                }
              >
                {org}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="px-4 py-3 border-b border-[var(--border)] text-[0.78rem] text-[var(--muted-text)]">
            <strong className="text-cream font-medium">{visibleTrials.length} trials</strong> in this area
          </div>

          {/* Trial list */}
          <div className="flex-1 overflow-y-auto">
            {visibleTrials.map((trial) => (
              <button
                key={trial.id}
                onClick={() => setSelectedId(trial.id)}
                className={`
                  w-full text-left px-4 py-[0.875rem] border-b border-[var(--border)]
                  cursor-pointer transition-all duration-150 bg-transparent border-l-2
                  ${selectedId === trial.id
                    ? 'bg-[rgba(232,255,71,0.04)] border-l-[var(--accent)]'
                    : 'border-l-transparent hover:bg-[var(--surface-2)]'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2 mb-[0.25rem]">
                  <span className="text-[0.85rem] font-medium text-cream leading-snug">{trial.name}</span>
                  <OrgChip orgId={trial.org} />
                </div>
                <div className="flex items-center gap-2 text-[0.72rem] text-[var(--muted-text)] flex-wrap">
                  <span>{formatDateRange(trial.startDate, trial.endDate)}</span>
                  <span className="w-[2px] h-[2px] rounded-full bg-[var(--muted-2)] inline-block" />
                  <span>{trial.city}, {trial.province}</span>
                  {trial.distanceKm && (
                    <>
                      <span className="w-[2px] h-[2px] rounded-full bg-[var(--muted-2)] inline-block" />
                      <span>{trial.distanceKm} km</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── MAP AREA ── */}
        <div className="flex-1 relative bg-[var(--surface)] overflow-hidden">

          {/* Map placeholder — swap this for Mapbox/Google Maps */}
          <div className="absolute inset-0 flex items-center justify-center">
            <MapGraphic
              trials={visibleTrials}
              selectedId={selectedId}
              onSelect={setSelectedId}
              orgColors={ORG_COLORS}
            />
          </div>

          {/* Map attribution */}
          <div className="absolute bottom-4 left-4 text-[0.65rem] text-[var(--muted-2)] bg-[rgba(9,9,9,0.7)] px-2 py-1 rounded-[6px]">
            Map integration — connect Mapbox or Google Maps
          </div>

          {/* Selected trial card */}
          {selectedTrial && (
            <div className="absolute bottom-4 right-4 left-4 md:left-auto md:w-[320px] bg-[var(--surface)] border border-[var(--border-2)] rounded-[16px] p-4 shadow-none">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[0.92rem] font-medium text-cream mb-1 leading-snug">
                    {selectedTrial.name}
                  </div>
                  <div className="flex items-center gap-2 text-[0.75rem] text-[var(--muted-text)] flex-wrap">
                    <span>{formatDateRange(selectedTrial.startDate, selectedTrial.endDate)}</span>
                    <span className="w-[2px] h-[2px] rounded-full bg-[var(--muted-2)] inline-block" />
                    <span>{selectedTrial.city}, {selectedTrial.province}</span>
                  </div>
                </div>
                <OrgChip orgId={selectedTrial.org} size="md" />
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <StatusBadge status={selectedTrial.status} spotsRemaining={selectedTrial.spotsRemaining} />
                {selectedTrial.distanceKm && (
                  <span className="text-[0.72rem] text-[var(--muted-text)]">{selectedTrial.distanceKm} km away</span>
                )}
                {selectedTrial.rings && (
                  <span className="text-[0.72rem] text-[var(--muted-text)]">· {selectedTrial.rings} rings</span>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/trials/${selectedTrial.id}`}
                  className="flex-1 flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-black text-[0.82rem] font-medium py-[0.7rem] rounded-[10px] no-underline transition-all"
                >
                  View details →
                </Link>
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-10 flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] rounded-[10px] text-[var(--muted-text)] cursor-pointer hover:text-cream transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Inline SVG map graphic (replace with real map) ──────────

function MapGraphic({
  trials,
  selectedId,
  onSelect,
  orgColors,
}: {
  trials: Trial[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  orgColors: Record<OrgId, string>;
}) {
  return (
    <svg
      viewBox="0 0 600 400"
      className="w-full h-full opacity-90"
      style={{ maxHeight: '100%' }}
    >
      {/* Map background grid */}
      <rect width="600" height="400" fill="#111111" />
      {/* Grid lines */}
      {Array.from({ length: 12 }, (_, i) => (
        <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 50} x2="600" y2={i * 50} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}

      {/* Roads (stylized) */}
      <path d="M0 200 Q150 185 300 195 Q450 205 600 190" stroke="rgba(255,255,255,0.07)" strokeWidth="6" fill="none" />
      <path d="M280 0 Q290 100 295 200 Q300 300 310 400" stroke="rgba(255,255,255,0.07)" strokeWidth="4" fill="none" />
      <path d="M0 310 Q100 295 200 305 Q300 315 400 290 Q500 270 600 280" stroke="rgba(255,255,255,0.05)" strokeWidth="3" fill="none" />
      <path d="M100 0 Q120 100 110 200 Q100 300 115 400" stroke="rgba(255,255,255,0.04)" strokeWidth="2" fill="none" />

      {/* River */}
      <path d="M180 0 Q200 80 195 140 Q188 200 200 260 Q210 320 195 400" stroke="rgba(55,138,221,0.2)" strokeWidth="8" fill="none" strokeLinecap="round" />

      {/* City label */}
      <text x="300" y="205" fill="rgba(245,242,237,0.2)" fontSize="10" fontFamily="sans-serif" textAnchor="middle">Ottawa</text>
      <text x="200" y="200" fill="rgba(245,242,237,0.12)" fontSize="8" fontFamily="sans-serif" textAnchor="middle">Nepean</text>
      <text x="175" y="145" fill="rgba(245,242,237,0.12)" fontSize="8" fontFamily="sans-serif" textAnchor="middle">Gatineau</text>

      {/* Trial pins */}
      {trials.map((trial) => {
        const pos = PIN_POSITIONS[trial.id];
        if (!pos) return null;
        const cx = (pos.x / 100) * 600;
        const cy = (pos.y / 100) * 400;
        const color = orgColors[trial.org];
        const isSelected = trial.id === selectedId;
        const r = isSelected ? 10 : 7;

        return (
          <g key={trial.id} onClick={() => onSelect(trial.id)} style={{ cursor: 'pointer' }}>
            {isSelected && (
              <circle cx={cx} cy={cy} r={18} fill={`${color}22`} />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              stroke={isSelected ? '#090909' : 'rgba(9,9,9,0.6)'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={isSelected ? 1 : 0.85}
            />
            {isSelected && (
              <text x={cx} y={cy + 4} fill="#090909" fontSize="8" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">
                {trial.org.slice(0, 1)}
              </text>
            )}
          </g>
        );
      })}

      {/* Center/home marker */}
      <circle cx="288" cy="220" r="5" fill="none" stroke="rgba(232,255,71,0.6)" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="288" cy="220" r="2" fill="rgba(232,255,71,0.6)" />
    </svg>
  );
}
