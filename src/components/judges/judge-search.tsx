"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { OrgBadge } from "@/components/ui/org-badge";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import type { JudgeSearchResult } from "@/types/judge";

interface JudgeSearchProps {
  /** Optional placeholder text */
  placeholder?: string;
  /** Called when the user selects a judge (before navigation) */
  onSelect?: (judge: JudgeSearchResult) => void;
  /** Extra class names for the wrapper element */
  className?: string;
}

/**
 * JudgeSearch — Autocomplete input wired to GET /api/judges/search?q=
 *
 * Shows judge name + org certification badges in the dropdown.
 * Navigates to /judges/:slug on selection.
 */
export function JudgeSearch({
  placeholder = "Search judges…",
  onSelect,
  className = "",
}: JudgeSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JudgeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown when clicking outside
  useClickOutside(
    wrapperRef,
    useCallback(() => {
      setIsOpen(false);
      setActiveIndex(-1);
    }, []),
    isOpen
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/judges/search?q=${encodeURIComponent(trimmed)}&limit=8`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.judges ?? []);
          setIsOpen(true);
          setActiveIndex(-1);
        }
      } catch {
        // Silently fail — search is best-effort
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (judge: JudgeSearchResult) => {
    setQuery(judge.name);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect?.(judge);
    router.push(`/judges/${judge.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-2)] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--cream)] placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--agili-accent)] transition-colors"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-2)] animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[var(--surface)] border border-[var(--border-2)] rounded-lg shadow-xl overflow-hidden">
          {results.map((judge, i) => (
            <button
              key={judge.id}
              onClick={() => handleSelect(judge)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition-colors ${
                i === activeIndex
                  ? "bg-[rgba(232,255,71,0.07)]"
                  : "hover:bg-[rgba(232,255,71,0.04)]"
              }`}
            >
              {/* Avatar initials */}
              <div className="w-7 h-7 rounded-full bg-[var(--surface-3)] border border-[var(--border)] flex-shrink-0 flex items-center justify-center">
                {judge.photo_url ? (
                  <img
                    src={judge.photo_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-[var(--agili-accent)]">
                    {judge.name[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Name */}
                <div className="text-sm font-medium text-[var(--cream)] truncate">
                  {judge.name}
                </div>

                {/* Location + org badges */}
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {judge.location && (
                    <span className="text-[10px] text-[var(--muted-2)]">
                      {judge.location}
                    </span>
                  )}
                  {judge.organizations.length > 0 && (
                    <span className="flex items-center gap-1">
                      {judge.organizations.map((org) => (
                        <OrgBadge key={org} orgId={org} />
                      ))}
                    </span>
                  )}
                </div>
              </div>

              {/* Trial count */}
              {judge.trial_count > 0 && (
                <span className="text-[10px] text-[var(--muted-2)] flex-shrink-0">
                  {judge.trial_count} upcoming
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results state */}
      {isOpen && !isLoading && query.trim() && results.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[var(--surface)] border border-[var(--border-2)] rounded-lg shadow-xl px-3 py-4 text-center">
          <p className="text-sm text-[var(--muted-text)]">
            No judges found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
