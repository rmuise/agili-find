"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Bookmark,
  Filter,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { useAuth } from "@/lib/supabase/auth-context";
import { useSavedTrials } from "@/lib/hooks/saved-trials-context";
import type { TrialResult } from "@/types/search";

type StatusFilter = "all" | "interested" | "registered" | "attending";
type TimeFilter = "upcoming" | "past" | "all";

interface SavedTrial extends TrialResult {
  saved_status: string;
  saved_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  interested: { label: "Interested", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  registered: { label: "Registered", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  attending: { label: "Attending", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

const ORG_COLORS: Record<string, string> = {
  akc: "bg-blue-500",
  usdaa: "bg-red-500",
  cpe: "bg-green-500",
  nadac: "bg-purple-500",
  uki: "bg-orange-500",
  ckc: "bg-pink-500",
  aac: "bg-teal-500",
};

export default function SchedulePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toggleSave, updateStatus } = useSavedTrials();
  const router = useRouter();

  const [savedTrials, setSavedTrials] = useState<SavedTrial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch saved trials with full data
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    fetch("/api/saved-trials/full")
      .then((res) => res.json())
      .then((data) => {
        if (data.savedTrials) {
          setSavedTrials(data.savedTrials);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  // Filter and sort trials
  const filteredTrials = useMemo(() => {
    let trials = savedTrials;

    // Status filter
    if (statusFilter !== "all") {
      trials = trials.filter((t) => t.saved_status === statusFilter);
    }

    // Time filter
    if (timeFilter === "upcoming") {
      trials = trials.filter((t) => !isPast(parseISO(t.end_date)));
    } else if (timeFilter === "past") {
      trials = trials.filter((t) => isPast(parseISO(t.end_date)));
    }

    // Sort by start date ascending (nearest first)
    return [...trials].sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  }, [savedTrials, statusFilter, timeFilter]);

  // Group by month
  const groupedTrials = useMemo(() => {
    const groups: Record<string, SavedTrial[]> = {};
    for (const trial of filteredTrials) {
      const monthKey = format(parseISO(trial.start_date), "MMMM yyyy");
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(trial);
    }
    return groups;
  }, [filteredTrials]);

  const handleStatusChange = async (trialId: string, newStatus: string) => {
    await updateStatus(trialId, newStatus);
    // Update local state too
    setSavedTrials((prev) =>
      prev.map((t) =>
        t.id === trialId ? { ...t, saved_status: newStatus } : t
      )
    );
  };

  const handleUnsave = async (trialId: string) => {
    await toggleSave(trialId);
    setSavedTrials((prev) => prev.filter((t) => t.id !== trialId));
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (startDate === endDate) {
      return format(start, "EEE, MMM d, yyyy");
    }
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, "EEE, MMM d")} – ${format(end, "d, yyyy")}`;
    }
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AgiliFind</span>
            </Link>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Search
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            My Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {savedTrials.length} saved trial{savedTrials.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {(["all", "interested", "registered", "attending"] as StatusFilter[]).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === s
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {s === "all" ? "All" : STATUS_LABELS[s]?.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Time filter */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(["upcoming", "past", "all"] as TimeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeFilter === t
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "all" ? "All Time" : t === "upcoming" ? "Upcoming" : "Past"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredTrials.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            {savedTrials.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No saved trials yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Search for trials and tap the bookmark icon to save them here.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Search trials
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No matching trials
                </h3>
                <p className="text-sm text-gray-500">
                  Try changing your filters to see more results.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTrials).map(([month, trials]) => (
              <div key={month}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {month}
                </h2>
                <div className="space-y-2">
                  {trials.map((trial) => {
                    const orgColor =
                      ORG_COLORS[trial.organization_id] || "bg-gray-500";
                    const statusInfo = STATUS_LABELS[trial.saved_status];
                    const past = isPast(parseISO(trial.end_date));

                    return (
                      <div
                        key={trial.id}
                        className={`bg-white rounded-lg border p-4 transition-shadow hover:shadow-md ${
                          past ? "opacity-60 border-gray-100" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Title */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white ${orgColor}`}
                              >
                                {trial.organization_id.toUpperCase()}
                              </span>
                              <a
                                href={trial.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 hover:underline"
                              >
                                {trial.title}
                              </a>
                              {past && (
                                <span className="text-xs text-gray-400 font-medium">
                                  Past
                                </span>
                              )}
                            </div>

                            {/* Date + location */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                {formatDateRange(trial.start_date, trial.end_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                {trial.city}, {trial.state}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Status dropdown */}
                            <select
                              value={trial.saved_status}
                              onChange={(e) =>
                                handleStatusChange(trial.id, e.target.value)
                              }
                              className={`text-xs font-medium px-2 py-1 rounded border cursor-pointer ${
                                statusInfo?.bg || "bg-gray-50 border-gray-200"
                              } ${statusInfo?.color || "text-gray-600"}`}
                            >
                              <option value="interested">Interested</option>
                              <option value="registered">Registered</option>
                              <option value="attending">Attending</option>
                            </select>

                            {/* External link */}
                            <a
                              href={trial.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View on source"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>

                            {/* Remove */}
                            <button
                              onClick={() => handleUnsave(trial.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove from schedule"
                            >
                              <Bookmark
                                className="h-4 w-4"
                                fill="currentColor"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
