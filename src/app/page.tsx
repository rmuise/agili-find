"use client";

import { useState, useCallback } from "react";
import { SearchForm, type SearchFormValues } from "@/components/search/search-form";
import { ResultsList } from "@/components/search/results-list";
import { TrialMap } from "@/components/map";
import { UserMenu } from "@/components/auth/user-menu";
import { NavLinks } from "@/components/nav/nav-links";
import { geocodeLocation } from "@/lib/geocoding/client";
import { JudgeProfileCard } from "@/components/search/judge-profile-card";
import type { TrialResult } from "@/types/search";
import type { SeminarResult } from "@/components/search/seminar-card";
import type { JudgeSearchResult } from "@/types/judge";

export default function Home() {
  const [trials, setTrials] = useState<TrialResult[]>([]);
  const [seminars, setSeminars] = useState<SeminarResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeJudge, setActiveJudge] = useState<JudgeSearchResult | null>(null);

  const handleSearch = useCallback(async (values: SearchFormValues) => {
    setIsLoading(true);
    setHasSearched(true);
    setErrorMessage(null);
    setActiveJudge(values.judgeResult ?? null);

    try {
      const params = new URLSearchParams();
      const seminarParams = new URLSearchParams();

      // Geocode location if provided
      if (values.location.trim()) {
        const geo = await geocodeLocation(values.location);
        if (geo) {
          params.set("lat", String(geo.lat));
          params.set("lng", String(geo.lng));
          seminarParams.set("lat", String(geo.lat));
          seminarParams.set("lng", String(geo.lng));
          setSearchCenter({ lat: geo.lat, lng: geo.lng });
          if (values.radius !== "any") {
            params.set("radius", values.radius);
            seminarParams.set("radius", values.radius);
          }
        } else {
          setSearchCenter(undefined);
          setErrorMessage(
            `Could not find location "${values.location}". Try a different city, state, or zip code.`
          );
          setTrials([]);
          setSeminars([]);
          setResultCount(0);
          setIsLoading(false);
          return;
        }
      }

      // Org filter (trials only)
      if (values.orgs.length > 0 && values.orgs.length < 8) {
        params.set("orgs", values.orgs.join(","));
      }

      // Date filter
      if (values.startDate) {
        params.set("startDate", values.startDate);
        seminarParams.set("startDate", values.startDate);
      }
      if (values.endDate) {
        params.set("endDate", values.endDate);
        seminarParams.set("endDate", values.endDate);
      }

      // Judge filter (trials only)
      if (values.judge.trim()) {
        params.set("judge", values.judge.trim());
      }

      // Class filter (trials only)
      if (values.classes.length > 0) {
        params.set("classes", values.classes.join(","));
      }

      params.set("limit", "100");

      const [trialsRes, seminarsRes] = await Promise.all([
        fetch(`/api/trials?${params.toString()}`),
        fetch(`/api/seminars?${seminarParams.toString()}`),
      ]);

      const [trialsData, seminarsData] = await Promise.all([
        trialsRes.json(),
        seminarsRes.json(),
      ]);

      const fetchedTrials = trialsData.error ? [] : trialsData.trials || [];
      const fetchedSeminars = seminarsData.error ? [] : seminarsData.seminars || [];

      if (trialsData.error) {
        console.error("Trials search error:", trialsData.error);
      }
      if (seminarsData.error) {
        console.error("Seminars search error:", seminarsData.error);
      }

      if (trialsData.error && seminarsData.error) {
        setErrorMessage("Something went wrong with your search. Please try again.");
      }

      setTrials(fetchedTrials);
      setSeminars(fetchedSeminars);
      setResultCount(fetchedTrials.length + fetchedSeminars.length);
    } catch (err) {
      console.error("Search failed:", err);
      setErrorMessage("Unable to reach the server. Please check your connection and try again.");
      setTrials([]);
      setSeminars([]);
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trialCount = trials.length;
  const seminarCount = seminars.length;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl tracking-wide text-[var(--cream)]">
              Agili<span className="text-[var(--agili-accent)]">Find</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NavLinks />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero / Search */}
      <div className="border-b border-[var(--border)] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="font-display text-4xl sm:text-5xl tracking-wide text-[var(--cream)] mb-3">
              Find Your Next <span className="text-[var(--agili-accent)]">Run</span>
            </h2>
            <p className="text-[var(--muted-text)] text-sm sm:text-base">
              Search upcoming trials and seminars from AKC, USDAA, CPE, UKI, CKC, AAC, TDAA, and ISC in one place.
            </p>
          </div>
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-[rgba(240,149,149,0.08)] border border-[rgba(240,149,149,0.2)] rounded-[14px] flex items-start gap-3">
            <span className="text-[#f09595] text-lg flex-shrink-0">{"\u26A0"}</span>
            <p className="text-sm text-[#f09595]">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-[var(--muted-text)] hover:text-[var(--cream)] flex-shrink-0"
            >
              {"\u2715"}
            </button>
          </div>
        )}

        {/* View Toggle + Count */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-4">
          <p className="text-sm sm:text-base text-[var(--muted-text)] min-w-0">
            {hasSearched
              ? resultCount === 0
                ? "No results found"
                : `${resultCount} result${resultCount !== 1 ? "s" : ""} found${
                    trialCount > 0 && seminarCount > 0
                      ? ` (${trialCount} trial${trialCount !== 1 ? "s" : ""}, ${seminarCount} seminar${seminarCount !== 1 ? "s" : ""})`
                      : ""
                  }`
              : "Enter a location to search for upcoming trials"}
          </p>
          <div className="flex gap-1 bg-[var(--surface-2)] rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--agili-accent)] text-black"
                  : "text-[var(--muted-text)] hover:text-[var(--cream)]"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("map")}
              aria-pressed={viewMode === "map"}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "map"
                  ? "bg-[var(--agili-accent)] text-black"
                  : "text-[var(--muted-text)] hover:text-[var(--cream)]"
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {activeJudge && hasSearched && (
          <JudgeProfileCard judge={activeJudge} />
        )}

        {viewMode === "list" ? (
          <ResultsList
            trials={trials}
            seminars={seminars}
            isLoading={isLoading}
            hasSearched={hasSearched}
          />
        ) : hasSearched && (trials.length > 0 || seminars.length > 0) ? (
          <TrialMap trials={trials} seminars={seminars} center={searchCenter} />
        ) : (
          <ResultsList
            trials={[]}
            isLoading={isLoading}
            hasSearched={hasSearched}
          />
        )}
      </div>
    </div>
  );
}
