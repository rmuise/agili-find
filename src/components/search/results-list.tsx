"use client";

import { Search } from "lucide-react";
import type { TrialResult } from "@/types/search";
import { TrialCard } from "./trial-card";
import { SeminarCard, type SeminarResult } from "./seminar-card";
import { ResultsListSkeleton } from "@/components/ui/skeleton";

interface ResultsListProps {
  trials: TrialResult[];
  seminars?: SeminarResult[];
  isLoading: boolean;
  hasSearched: boolean;
}

export function ResultsList({ trials, seminars = [], isLoading, hasSearched }: ResultsListProps) {
  if (isLoading) {
    return <ResultsListSkeleton count={6} />;
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
          agility trials and seminars near you.
        </p>
      </div>
    );
  }

  const totalCount = trials.length + seminars.length;

  if (totalCount === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No results found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Try expanding your search radius or adjusting your filters to find
          more trials and seminars.
        </p>
      </div>
    );
  }

  // Merge and sort by start_date
  type MergedItem =
    | { type: "trial"; data: TrialResult }
    | { type: "seminar"; data: SeminarResult };

  const merged: MergedItem[] = [
    ...trials.map((t) => ({ type: "trial" as const, data: t })),
    ...seminars.map((s) => ({ type: "seminar" as const, data: s })),
  ].sort(
    (a, b) =>
      new Date(a.data.start_date).getTime() -
      new Date(b.data.start_date).getTime()
  );

  return (
    <div className="space-y-3">
      {merged.map((item) =>
        item.type === "trial" ? (
          <TrialCard key={`trial-${item.data.id}`} trial={item.data} />
        ) : (
          <SeminarCard key={`seminar-${item.data.id}`} seminar={item.data} />
        )
      )}
    </div>
  );
}
