"use client";

import { useState, useCallback } from "react";
import { SearchForm, type SearchFormValues } from "@/components/search/search-form";
import { ResultsList } from "@/components/search/results-list";
import { TrialMap } from "@/components/map";
import { geocodeLocation } from "@/lib/geocoding/client";
import type { TrialResult } from "@/types/search";

export default function Home() {
  const [trials, setTrials] = useState<TrialResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | undefined>();

  const handleSearch = useCallback(async (values: SearchFormValues) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();

      // Geocode location if provided
      if (values.location.trim()) {
        const geo = await geocodeLocation(values.location);
        if (geo) {
          params.set("lat", String(geo.lat));
          params.set("lng", String(geo.lng));
          setSearchCenter({ lat: geo.lat, lng: geo.lng });
          if (values.radius !== "any") {
            params.set("radius", values.radius);
          }
        } else {
          setSearchCenter(undefined);
        }
      }

      // Org filter
      if (values.orgs.length > 0 && values.orgs.length < 6) {
        params.set("orgs", values.orgs.join(","));
      }

      // Date filter
      if (values.startDate) {
        params.set("startDate", values.startDate);
      }

      // Judge filter
      if (values.judge.trim()) {
        params.set("judge", values.judge.trim());
      }

      params.set("limit", "100");

      const response = await fetch(`/api/trials?${params.toString()}`);
      const data = await response.json();

      if (data.error) {
        console.error("Search error:", data.error);
        setTrials([]);
        setResultCount(0);
      } else {
        setTrials(data.trials);
        setResultCount(data.trials.length);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setTrials([]);
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">AgiliFind</h1>
          </div>
          <p className="text-sm text-gray-500 hidden sm:block">
            Search agility trials across all organizations
          </p>
        </div>
      </header>

      {/* Hero / Search Section */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Find Your Next Agility Trial
            </h2>
            <p className="text-gray-600">
              Search upcoming trials from AKC, USDAA, CPE, NADAC, UKI, and CKC
              in one place.
            </p>
          </div>

          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </div>

      {/* Results Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* View Toggle + Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {hasSearched
              ? `${resultCount} trial${resultCount !== 1 ? "s" : ""} found`
              : "Enter a location to search for upcoming trials"}
          </p>
          <div className="flex gap-1 bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "map"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <ResultsList
            trials={trials}
            isLoading={isLoading}
            hasSearched={hasSearched}
          />
        ) : hasSearched && trials.length > 0 ? (
          <TrialMap trials={trials} center={searchCenter} />
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
