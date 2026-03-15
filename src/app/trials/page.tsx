'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { FilterSidebar } from '@/components/trials/FilterSidebar';
import { FilterDrawer } from '@/components/trials/FilterDrawer';
import { ResultsList } from '@/components/search/results-list';
import { geocodeLocation } from '@/lib/geocoding/client';
import { SORT_LABELS } from '@/lib/constants';
import { DEFAULT_FILTERS } from '@/types/filters';
import type { SearchFilters, SortOption } from '@/types/filters';
import type { TrialResult } from '@/types/search';

export default function TrialsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--black)]" />}>
      <TrialsPageContent />
    </Suspense>
  );
}

function TrialsPageContent() {
  const searchParams = useSearchParams();
  const initialLocation = searchParams?.get('location') || '';

  const [searchInput, setSearchInput] = useState(initialLocation);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    location: initialLocation,
  });
  const [page, setPage] = useState(1);
  const [trials, setTrials] = useState<TrialResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const RESULTS_PER_PAGE = 25;

  const doSearch = useCallback(async (f: SearchFilters, pageNum: number) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();

      // Geocode location
      if (f.location.trim()) {
        const geo = await geocodeLocation(f.location);
        if (geo) {
          params.set('lat', String(geo.lat));
          params.set('lng', String(geo.lng));
          params.set('radius', String(f.distanceKm > 400 ? '' : Math.round(f.distanceKm * 0.621371)));
        }
      }

      // Org filter
      if (f.orgs.length > 0 && f.orgs.length < 9) {
        params.set('orgs', f.orgs.join(','));
      }

      // Date filter
      if (f.dateFrom) params.set('startDate', f.dateFrom);
      if (f.dateTo) params.set('endDate', f.dateTo);

      // Pagination
      params.set('limit', String(RESULTS_PER_PAGE));
      params.set('page', String(pageNum));

      const res = await fetch(`/api/trials?${params.toString()}`);
      const data = await res.json();

      if (data.error) {
        console.error('Search error:', data.error);
        setTrials([]);
        setTotal(0);
      } else {
        setTrials(data.trials || []);
        setTotal(data.total || data.trials?.length || 0);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setTrials([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = () => {
    const newFilters = { ...filters, location: searchInput };
    setFilters(newFilters);
    setPage(1);
    doSearch(newFilters, 1);
  };

  const handleFilterChange = (f: SearchFilters) => {
    setFilters(f);
    setPage(1);
    if (hasSearched) {
      doSearch(f, 1);
    }
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    doSearch(filters, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.max(1, Math.ceil(total / RESULTS_PER_PAGE));

  // Active filter chips
  const activeChips: string[] = [];
  if (filters.location) activeChips.push(filters.location);
  if (filters.distanceKm < 500) activeChips.push(`Within ${filters.distanceKm} km`);
  if (filters.dateFrom && filters.dateTo) {
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
    activeChips.push(`${fmt(filters.dateFrom)} – ${fmt(filters.dateTo)}`);
  }
  filters.orgs.slice(0, 2).forEach((o) => activeChips.push(o.toUpperCase()));

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
          <FilterSidebar filters={filters} onChange={handleFilterChange} />
        </div>

        {/* Results */}
        <main className="px-4 md:px-8 py-6 min-w-0">

          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="text-[0.82rem] text-[var(--muted-text)]">
              {hasSearched ? (
                <>
                  <strong className="text-cream font-medium">{total} trial{total !== 1 ? 's' : ''}</strong>{' '}
                  {filters.location ? `near ${filters.location}` : 'found'}
                </>
              ) : (
                'Enter a location to search for trials'
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[0.78rem] text-[var(--muted-text)] hidden sm:block">Sort</span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value as SortOption })}
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
                  className="flex items-center gap-[0.4rem] text-[0.72rem] px-3 py-[0.3rem] bg-[var(--surface-2)] border border-[var(--border-2)] rounded-full text-cream"
                >
                  {chip}
                </div>
              ))}
              <button
                onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                className="text-[0.72rem] text-[var(--muted-text)] bg-transparent border-none cursor-pointer hover:text-[var(--accent)] transition-colors px-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Trial results */}
          <ResultsList
            trials={trials}
            isLoading={isLoading}
            hasSearched={hasSearched}
          />

          {/* Pagination */}
          {hasSearched && totalPages > 1 && (
            <div className="flex items-center justify-center gap-[0.4rem] py-8">
              <PageBtn
                label="←"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              />
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <PageBtn
                  key={p}
                  label={String(p)}
                  active={p === page}
                  onClick={() => handlePageChange(p)}
                />
              ))}
              {totalPages > 5 && <span className="text-[var(--muted-text)] text-[0.82rem] px-1">…</span>}
              {totalPages > 5 && (
                <PageBtn
                  label={String(totalPages)}
                  active={page === totalPages}
                  onClick={() => handlePageChange(totalPages)}
                />
              )}
              <PageBtn
                label="→"
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
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
        onChange={handleFilterChange}
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
