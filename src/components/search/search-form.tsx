"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, Filter, Loader2, X } from "lucide-react";
import type { OrganizationId } from "@/types/trial";

const ORGANIZATIONS: Array<{
  id: OrganizationId;
  name: string;
  color: string;
}> = [
  { id: "akc", name: "AKC", color: "bg-blue-500" },
  { id: "usdaa", name: "USDAA", color: "bg-red-500" },
  { id: "cpe", name: "CPE", color: "bg-green-500" },
  { id: "nadac", name: "NADAC", color: "bg-purple-500" },
  { id: "uki", name: "UKI", color: "bg-orange-500" },
  { id: "ckc", name: "CKC", color: "bg-pink-500" },
  { id: "aac", name: "AAC", color: "bg-teal-500" },
];

const RADIUS_OPTIONS = [
  { value: "25", label: "25 mi" },
  { value: "50", label: "50 mi" },
  { value: "100", label: "100 mi" },
  { value: "200", label: "200 mi" },
  { value: "any", label: "Any" },
];

export interface SearchFormValues {
  location: string;
  radius: string;
  orgs: OrganizationId[];
  startDate: string;
  endDate: string;
  judge: string;
}

interface SearchFormProps {
  onSearch: (values: SearchFormValues) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("100");
  const [selectedOrgs, setSelectedOrgs] = useState<Set<OrganizationId>>(
    new Set(ORGANIZATIONS.map((o) => o.id))
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [judge, setJudge] = useState("");

  // Judge autocomplete state
  const [allJudges, setAllJudges] = useState<string[]>([]);
  const [filteredJudges, setFilteredJudges] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all judges on mount
  useEffect(() => {
    fetch("/api/judges")
      .then((res) => res.json())
      .then((data) => {
        if (data.judges) {
          setAllJudges(data.judges);
        }
      })
      .catch((err) => console.error("Failed to load judges:", err));
  }, []);

  // Filter judges as user types
  useEffect(() => {
    if (!judge.trim()) {
      setFilteredJudges([]);
      return;
    }
    const query = judge.toLowerCase();
    const matches = allJudges.filter((j) =>
      j.toLowerCase().includes(query)
    );
    setFilteredJudges(matches.slice(0, 20)); // Cap at 20 suggestions
    setHighlightIndex(-1);
  }, [judge, allJudges]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectJudge = useCallback((name: string) => {
    setJudge(name);
    setShowDropdown(false);
    setFilteredJudges([]);
  }, []);

  const clearJudge = useCallback(() => {
    setJudge("");
    setShowDropdown(false);
    setFilteredJudges([]);
    inputRef.current?.focus();
  }, []);

  const handleJudgeKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredJudges.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filteredJudges.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filteredJudges.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectJudge(filteredJudges[highlightIndex]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    onSearch({
      location,
      radius,
      orgs: [...selectedOrgs],
      startDate,
      endDate,
      judge,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 space-y-4">
      {/* Location + Radius Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state, or zip code..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {RADIUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Organization Filters */}
      <div className="flex flex-wrap gap-2">
        {ORGANIZATIONS.map((org) => (
          <label
            key={org.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              selectedOrgs.has(org.id)
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-white hover:border-gray-400"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedOrgs.has(org.id)}
              onChange={() => toggleOrg(org.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`w-2 h-2 rounded-full ${org.color}`}></span>
            <span className="text-sm font-medium text-gray-700">
              {org.name}
            </span>
          </label>
        ))}
      </div>

      {/* Date Range + Judge + Search */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From"
              title="Start date"
              className="w-full pl-10 pr-2 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <span className="self-center text-gray-400 text-sm flex-shrink-0">to</span>
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              placeholder="To"
              title="End date"
              className="w-full pl-10 pr-2 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Judge Autocomplete */}
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={judge}
            onChange={(e) => {
              setJudge(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (judge.trim()) setShowDropdown(true);
            }}
            onKeyDown={handleJudgeKeyDown}
            placeholder={`Judge name (${allJudges.length} available)...`}
            className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            autoComplete="off"
          />
          {judge && (
            <button
              type="button"
              onClick={clearJudge}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Dropdown */}
          {showDropdown && filteredJudges.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredJudges.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => selectJudge(name)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${
                    i === highlightIndex
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  <HighlightMatch text={name} query={judge} />
                </button>
              ))}
            </div>
          )}

          {/* No results message */}
          {showDropdown &&
            judge.trim().length > 0 &&
            filteredJudges.length === 0 &&
            allJudges.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
              >
                <div className="px-4 py-3 text-sm text-gray-500">
                  No judges matching &ldquo;{judge}&rdquo;
                </div>
              </div>
            )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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
      <span className="font-semibold text-blue-600">
        {text.slice(idx, idx + lowerQuery.length)}
      </span>
      {text.slice(idx + lowerQuery.length)}
    </>
  );
}
