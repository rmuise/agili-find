"use client";

import { Search } from "lucide-react";
import type { TrialResult } from "@/types/search";
import { TrialCard } from "./trial-card";

interface ResultsListProps {
  trials: TrialResult[];
  isLoading: boolean;
  hasSearched: boolean;
}

export function ResultsList({ trials, isLoading, hasSearched }: ResultsListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Searching for trials...</p>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Search for agility trials
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Enter your location and set your search radius to find upcoming dog
          agility trials near you across all major organizations.
        </p>
      </div>
    );
  }

  if (trials.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No trials found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Try expanding your search radius or adjusting your filters to find
          more trials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trials.map((trial) => (
        <TrialCard key={trial.id} trial={trial} />
      ))}
    </div>
  );
}
