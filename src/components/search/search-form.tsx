"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { Search, MapPin, Calendar, Filter, Loader2, X, User } from "lucide-react";
import type { OrganizationId } from "@/types/trial";
import { CLASS_DATA, type ClassInfo } from "@/lib/class-data";
import { ORGANIZATIONS, ORG_NAMES } from "@/lib/constants";
import { OrgBadge } from "@/components/ui/org-badge";
import type { JudgeSearchResult } from "@/types/judge";
import { usePreferences } from "@/lib/preferences-context";

/** Radius options — values are always in miles (what the API expects).
 *  Labels are rendered dynamically based on the user's distance unit preference. */
const RADIUS_MILES = [25, 50, 100, 200] as const;

export interface SearchFormValues {
  location: string;
  radius: string;
  orgs: OrganizationId[];
  startDate: string;
  endDate: string;
  judge: string;
  judgeResult: JudgeSearchResult | null;
  classes: string[];
}

interface SearchFormProps {
  onSearch: (values: SearchFormValues) => void;
  isLoading: boolean;
}

interface GroupedClass {
  orgId: string;
  orgName: string;
  info: ClassInfo;
  /** composite key for deduplication: "orgId:className" */
  key: string;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const { distanceUnit } = usePreferences();
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("100");
  const [selectedOrgs, setSelectedOrgs] = useState<Set<OrganizationId>>(
    new Set(ORGANIZATIONS.map((o) => o.id))
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [judge, setJudge] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const classInputRef = useRef<HTMLInputElement>(null);

  // Judge autocomplete state — debounced search against /api/judges/search
  const [judgeResults, setJudgeResults] = useState<JudgeSearchResult[]>([]);
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedJudgeResult, setSelectedJudgeResult] = useState<JudgeSearchResult | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const judgeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build org-linked class list based on selected orgs
  const availableClasses: GroupedClass[] = useMemo(() => {
    const result: GroupedClass[] = [];
    for (const orgId of selectedOrgs) {
      const classes = CLASS_DATA[orgId];
      if (!classes) continue;
      for (const info of classes) {
        result.push({
          orgId,
          orgName: ORG_NAMES[orgId] || orgId.toUpperCase(),
          info,
          key: `${orgId}:${info.name}`,
        });
      }
    }
    return result;
  }, [selectedOrgs]);

  // Filtered classes for dropdown (based on text filter + not already selected)
  const filteredClasses = useMemo(() => {
    const query = classFilter.toLowerCase().trim();
    return availableClasses.filter((c) => {
      if (selectedClasses.has(c.info.name)) return false;
      if (!query) return true;
      return (
        c.info.name.toLowerCase().includes(query) ||
        c.orgName.toLowerCase().includes(query) ||
        c.info.category.toLowerCase().includes(query)
      );
    });
  }, [classFilter, availableClasses, selectedClasses]);

  // Group filtered classes by org for display
  const groupedFilteredClasses = useMemo(() => {
    const groups: Record<string, GroupedClass[]> = {};
    for (const cls of filteredClasses) {
      if (!groups[cls.orgId]) groups[cls.orgId] = [];
      groups[cls.orgId].push(cls);
    }
    return Object.entries(groups);
  }, [filteredClasses]);


  // Close class dropdown on outside click
  useClickOutside(
    [classDropdownRef, classInputRef],
    useCallback(() => setShowClassDropdown(false), [])
  );

  const toggleClass = useCallback((cls: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(cls)) {
        next.delete(cls);
      } else {
        next.add(cls);
      }
      return next;
    });
    setClassFilter("");
  }, []);

  // Debounced judge search — hits /api/judges/search?q= instead of loading all names
  useEffect(() => {
    if (judgeDebounceRef.current) clearTimeout(judgeDebounceRef.current);

    if (!judge.trim()) {
      setJudgeResults([]);
      return;
    }

    judgeDebounceRef.current = setTimeout(async () => {
      setJudgeLoading(true);
      try {
        const res = await fetch(
          `/api/judges/search?q=${encodeURIComponent(judge.trim())}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setJudgeResults(data.judges ?? []);
          setHighlightIndex(-1);
        }
      } catch {
        // Silently fail — search is best-effort
      } finally {
        setJudgeLoading(false);
      }
    }, 250);

    return () => {
      if (judgeDebounceRef.current) clearTimeout(judgeDebounceRef.current);
    };
  }, [judge]);

  // Close judge dropdown on outside click
  useClickOutside(
    dropdownRef,
    useCallback(() => setShowDropdown(false), [])
  );

  const selectJudge = useCallback((result: JudgeSearchResult) => {
    setJudge(result.name);
    setSelectedJudgeResult(result);
    setShowDropdown(false);
    setJudgeResults([]);
  }, []);

  const clearJudge = useCallback(() => {
    setJudge("");
    setSelectedJudgeResult(null);
    setShowDropdown(false);
    setJudgeResults([]);
    inputRef.current?.focus();
  }, []);

  const handleJudgeKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || judgeResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < judgeResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : judgeResults.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectJudge(judgeResults[highlightIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const toggleOrg = useCallback((orgId: OrganizationId) => {
    setSelectedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  }, []);

  // Clear class selections that are no longer available when orgs change
  useEffect(() => {
    const availableNames = new Set(availableClasses.map((c) => c.info.name));
    setSelectedClasses((prev) => {
      const next = new Set<string>();
      for (const cls of prev) {
        if (availableNames.has(cls)) next.add(cls);
      }
      if (next.size !== prev.size) return next;
      return prev;
    });
  }, [availableClasses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    setShowClassDropdown(false);
    onSearch({
      location,
      radius,
      orgs: [...selectedOrgs],
      startDate,
      endDate,
      judge,
      judgeResult: selectedJudgeResult,
      classes: [...selectedClasses],
    });
  };

  const totalClasses = availableClasses.filter(
    (c) => !selectedClasses.has(c.info.name)
  ).length;

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--surface-2)] border border-[var(--border-2)] rounded-[14px] p-6 space-y-4">
      {/* 1. Organization Filters */}
      <div className="flex flex-wrap gap-2">
        {ORGANIZATIONS.map((org) => (
          <label
            key={org.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              selectedOrgs.has(org.id)
                ? "border-[rgba(232,255,71,0.4)] bg-[rgba(232,255,71,0.08)]"
                : "border-[var(--border-2)] bg-[var(--surface)] hover:border-[rgba(255,255,255,0.2)]"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedOrgs.has(org.id)}
              onChange={() => toggleOrg(org.id)}
              className="rounded border-[var(--border-2)] text-[var(--agili-accent)] focus:ring-[var(--agili-accent)] bg-transparent accent-[var(--agili-accent)]"
            />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `var(--${org.id})` }}></span>
            <span className="text-sm font-medium text-[var(--cream)]">
              {org.name}
            </span>
          </label>
        ))}
      </div>

      {/* 2. Date Range */}
      <div className="flex gap-2 sm:max-w-md">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-text)]" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="From"
            title="Start date"
            className="w-full pl-10 pr-2 py-3 rounded-lg border border-[var(--border-2)] bg-transparent text-[var(--cream)] focus:ring-2 focus:ring-[var(--agili-accent)] focus:border-[rgba(232,255,71,0.5)] outline-none text-sm"
          />
        </div>
        <span className="self-center text-[var(--muted-text)] text-sm flex-shrink-0">to</span>
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-text)]" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            placeholder="To"
            title="End date"
            className="w-full pl-10 pr-2 py-3 rounded-lg border border-[var(--border-2)] bg-transparent text-[var(--cream)] focus:ring-2 focus:ring-[var(--agili-accent)] focus:border-[rgba(232,255,71,0.5)] outline-none text-sm"
          />
        </div>
      </div>

      {/* 3. Location + Radius (City) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-text)]" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state, or zip code..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border-2)] bg-transparent text-[var(--cream)] focus:ring-2 focus:ring-[var(--agili-accent)] focus:border-[rgba(232,255,71,0.5)] outline-none"
          />
        </div>
        <select
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="px-4 py-3 rounded-lg border border-[var(--border-2)] bg-transparent text-[var(--cream)] focus:ring-2 focus:ring-[var(--agili-accent)] focus:border-[rgba(232,255,71,0.5)] outline-none"
        >
          {RADIUS_MILES.map((mi) => (
            <option key={mi} value={String(mi)}>
              {distanceUnit === "km"
                ? `${Math.round(mi * 1.60934)} km`
                : `${mi} mi`}
            </option>
          ))}
          <option value="any">Any distance</option>
        </select>
      </div>

      {/* 4. Class/Run Filter — org-grouped */}
      <div>
        {/* Selected classes as chips */}
        {selectedClasses.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[...selectedClasses].map((cls) => (
              <span
                key={cls}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.2)] rounded-md text-xs font-medium text-[var(--agili-accent)]"
              >
                {cls}
                <button
                  type="button"
                  onClick={() => toggleClass(cls)}
                  className="text-[var(--agili-accent)] hover:text-[var(--accent-dark)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setSelectedClasses(new Set())}
              className="text-xs text-[var(--muted-text)] hover:text-[var(--cream)] px-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Class search input */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-text)]" />
          <input
            ref={classInputRef}
            type="text"
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setShowClassDropdown(true);
            }}
            onFocus={() => setShowClassDropdown(true)}
            placeholder={`Filter by class/run type (${totalClasses} available)...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border-2)] bg-transparent text-[var(--cream)] focus:ring-2 focus:ring-[var(--agili-accent)] focus:border-[rgba(232,255,71,0.5)] outline-none text-sm"
            autoComplete="off"
          />

          {/* Class dropdown — grouped by org */}
          {showClassDropdown && groupedFilteredClasses.length > 0 && (
            <div
              ref={classDropdownRef}
              className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border-2)] rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              {groupedFilteredClasses.map(([orgId, classes]) => (
                <div key={orgId}>
                  {/* Org header */}
                  <div className="px-3 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center gap-1.5 sticky top-0">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: `var(--${orgId})` }}
                    />
                    <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wide">
                      {ORG_NAMES[orgId] || orgId.toUpperCase()}
                    </span>
                  </div>
                  {/* Classes under this org */}
                  {classes.map((cls) => (
                    <button
                      key={cls.key}
                      type="button"
                      onClick={() => {
                        toggleClass(cls.info.name);
                        setShowClassDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[rgba(232,255,71,0.05)] transition-colors group"
                    >
                      <span className="text-sm font-medium text-[var(--cream)] group-hover:text-[var(--agili-accent)]">
                        {cls.info.name}
                      </span>
                      <span className="text-xs text-[var(--muted-2)] ml-2">
                        {cls.info.category}
                      </span>
                      {cls.info.description && (
                        <p className="text-xs text-[var(--muted-2)] mt-0.5 line-clamp-1">
                          {cls.info.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Judge + Search */}
      <div className="flex gap-3 flex-wrap">
        {/* Judge Autocomplete — debounced search via /api/judges/search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]" ref={dropdownRef}>
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-text)]" />
          <input
            ref={inputRef}
            type="text"
            value={judge}
            onChange={(e) => {
              setJudge(e.target.value);
              setSelectedJudgeResult(null);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (judge.trim()) setShowDropdown(true);
            }}
            onKeyDown={handleJudgeKeyDown}
            placeholder="Filter by judge name..."
            className="w-full pl-10 pr-10 py-3 rounded-lg border border-[var(--border-2)] bg-transparent text-[var(--cream)] focus:ring-2 focus:ring-[var(--agili-accent)] focus:border-[rgba(232,255,71,0.5)] outline-none"
            autoComplete="off"
          />
          {judgeLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-text)] animate-spin" />
          )}
          {judge && !judgeLoading && (
            <button
              type="button"
              onClick={clearJudge}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)] hover:text-[var(--cream)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Enriched dropdown — shows org badges + location */}
          {showDropdown && judgeResults.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border-2)] rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {judgeResults.map((result, i) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => selectJudge(result)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
                    i === highlightIndex
                      ? "bg-[rgba(232,255,71,0.07)]"
                      : "hover:bg-[rgba(232,255,71,0.04)]"
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex-shrink-0 flex items-center justify-center">
                    {result.photo_url ? (
                      <img src={result.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--agili-accent)]">
                        {result.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--cream)] truncate">
                      <HighlightMatch text={result.name} query={judge} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {result.location && (
                        <span className="text-[10px] text-[var(--muted-2)]">{result.location}</span>
                      )}
                      {result.organizations.map((org) => (
                        <OrgBadge key={org} orgId={org} />
                      ))}
                    </div>
                  </div>
                  {result.trial_count > 0 && (
                    <span className="text-[10px] text-[var(--muted-2)] flex-shrink-0">
                      {result.trial_count} upcoming
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {showDropdown && !judgeLoading && judge.trim().length > 1 && judgeResults.length === 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border-2)] rounded-lg shadow-lg">
              <div className="px-4 py-3 text-sm text-[var(--muted-text)]">
                No judges matching &ldquo;{judge}&rdquo;
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-[var(--agili-accent)] text-black rounded-lg font-display tracking-wide hover:bg-[var(--accent-dark)] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </button>
      </div>
    </form>
  );
}

/** Highlights the matching portion of the judge name */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const idx = lowerText.indexOf(lowerQuery);

  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-[var(--agili-accent)]">
        {text.slice(idx, idx + lowerQuery.length)}
      </span>
      {text.slice(idx + lowerQuery.length)}
    </>
  );
}
