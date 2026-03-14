'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { FilterSidebar } from '@/components/trials/FilterSidebar';
import { FilterDrawer } from '@/components/trials/FilterDrawer';
import { TrialCard } from '@/components/trials/TrialCard';
import { MOCK_TRIALS } from '@/lib/data';
import { DEFAULT_FILTERS, SORT_LABELS } from '@/lib/types';
import type { SearchFilters, SortOption } from '@/lib/types';

const RESULTS_PER_PAGE = 10;

export default function TrialsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--black)]" />}>
      <TrialsPageContent />
    </Suspense>
  );
}

function TrialsPageContent() {
  const searchParams = useSearchParams();
  const initialLocation = searchParams?.get('location') || 'Ottawa, ON';

  const [searchInput, setSearchInput] = useState(initialLocation);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    location: initialLocation,
  });
  const [page, setPage] = useState(1);

  // Filter + sort trials
  const filtered = useMemo(() => {
    return MOCK_TRIALS
      .filter((t) => filters.orgs.includes(t.org))
      .filter((t) => !filters.distanceKm || (t.distanceKm ?? 999) <= filters.distanceKm)
      .filter((t) => filters.statuses.includes(t.status))
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'distance-asc':
            return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
          case 'date-asc':
          default:
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
      });
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / RESULTS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);

  const handleSearch = () => {
    setFilters((f) => ({ ...f, location: searchInput }));
    setPage(1);
  };

  // Active filter chips for display
  const activeChips: string[] = [];
  if (filters.location) activeChips.push(filters.location);
  if (filters.distanceKm < 500) activeChips.push(`Within ${filters.distanceKm} km`);
  if (filters.dateFrom && filters.dateTo) {
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
    activeChips.push(`${fmt(filters.dateFrom)} – ${fmt(filters.dateTo)}`);
  }
  filters.orgs.slice(0, 2).forEach((o) => activeChips.push(o));

  return (
    <>
      <Navbar
        showSearch
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
      />

      <div className="grid md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr] min-h-[calc(100vh-56px)] items-start">

        {/* Sidebar — desktop only */}
        <div className="hidden md:block">
          <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
        </div>

        {/* Results */}
        <main className="px-4 md:px-8 py-6 min-w-0">

          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="text-[0.82rem] text-[var(--muted-text)]">
              <strong className="text-cream font-medium">{filtered.length} trials</strong>{' '}
              near {filters.location || 'your location'}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[0.78rem] text-[var(--muted-text)] hidden sm:block">Sort</span>
              <select
                value={filters.sortBy}
                onChange={(e) => { setFilters((f) => ({ ...f, sortBy: e.target.value as SortOption })); setPage(1); }}
                className="bg-[var(--surface-2)] border border-[var(--border-2)] rounded-[10px] text-cream font-sans text-[0.78rem] px-3 py-[0.4rem] outline-none cursor-pointer appearance-none"
              >
                {Object.entries(SORT_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-5">
              {activeChips.map((chip) => (
                <div
                  key={chip}
                  className="flex items-center gap-[0.4rem] text-[0.72rem] px-3 py-[0.3rem] bg-[var(--surface-2)] border border-[var(--border-2)] rounded-full text-cream cursor-pointer hover:border-[rgba(245,70,70,0.4)] transition-colors"
                >
                  {chip}
                  <span className="text-[0.65rem] text-[var(--muted-text)]">✕</span>
                </div>
              ))}
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-[0.72rem] text-[var(--muted-text)] bg-transparent border-none cursor-pointer hover:text-[var(--accent)] transition-colors px-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Trial cards */}
          {paginated.length > 0 ? (
            <div className="flex flex-col gap-3">
              {paginated.map((trial) => (
                <TrialCard key={trial.id} trial={trial} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="font-display text-[2rem] tracking-[0.04em] text-cream mb-2">
                No trials found
              </div>
              <p className="text-[0.9rem] text-[var(--muted-text)] max-w-xs">
                Try expanding your search area or adjusting the filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-[0.4rem] py-8">
              <PageBtn
                label="←"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              />
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <PageBtn
                  key={p}
                  label={String(p)}
                  active={p === page}
                  onClick={() => setPage(p)}
                />
              ))}
              {totalPages > 5 && <span className="text-[var(--muted-text)] text-[0.82rem] px-1">…</span>}
              {totalPages > 5 && (
                <PageBtn
                  label={String(totalPages)}
                  active={page === totalPages}
                  onClick={() => setPage(totalPages)}
                />
              )}
              <PageBtn
                label="→"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Mobile drawer */}
      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen((v) => !v)}
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
      />
    </>
  );
}

function PageBtn({
  label, active, disabled, onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        min-w-9 h-9 flex items-center justify-center px-3
        rounded-[10px] border text-[0.82rem] cursor-pointer transition-all duration-150
        disabled:opacity-30 disabled:cursor-default
        ${active
          ? 'bg-[var(--accent)] border-[var(--accent)] text-black font-medium'
          : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted-text)] hover:border-[var(--border-2)] hover:text-cream'
        }
      `}
    >
      {label}
    </button>
  );
}
