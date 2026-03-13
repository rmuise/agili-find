"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Bookmark,
  Filter,
  ExternalLink,
  Share2,
  CalendarPlus,
  Check,
  Wrench,
  Eye,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { useAuth } from "@/lib/supabase/auth-context";
import { useSavedTrials } from "@/lib/hooks/saved-trials-context";
import { PageHeader } from "@/components/layout/page-header";
import { OrgBadge } from "@/components/ui/org-badge";
import { LoadingState } from "@/components/ui/loading-state";
import { STATUS_LABELS } from "@/lib/constants";
import { formatTrialDateRange } from "@/lib/utils";
import type { TrialResult } from "@/types/search";
import { MyTrialsPlanningCard } from "@/components/services/my-trials-planning-card";

type StatusFilter = "all" | "interested" | "registered" | "attending";
type TimeFilter = "upcoming" | "past" | "all";

interface SavedTrial extends TrialResult {
  saved_status: string;
  saved_at: string;
}


export default function SchedulePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toggleSave, updateStatus } = useSavedTrials();
  const router = useRouter();

  const [savedTrials, setSavedTrials] = useState<SavedTrial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "ical" | null>(null);
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

    // Also fetch share token
    fetch("/api/profile/share-token")
      .then((res) => res.json())
      .then((data) => {
        if (data.shareToken) setShareToken(data.shareToken);
      })
      .catch(console.error);
  }, [user]);

  const shareUrl =
    typeof window !== "undefined" && shareToken
      ? `${window.location.origin}/s/${shareToken}`
      : null;

  const icalUrl =
    typeof window !== "undefined" && shareToken
      ? `${window.location.origin}/api/ical/${shareToken}`
      : null;

  const copyToClipboard = async (text: string, type: "link" | "ical") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

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


  if (authLoading || (!user && !authLoading)) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader maxWidth="5xl" />

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

          {/* Share + iCal buttons */}
          {shareToken && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => shareUrl && copyToClipboard(shareUrl, "link")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {copied === "link" ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
                {copied === "link" ? "Copied!" : "Share schedule"}
              </button>
              <button
                onClick={() => icalUrl && copyToClipboard(icalUrl, "ical")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {copied === "ical" ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <CalendarPlus className="h-3.5 w-3.5" />
                )}
                {copied === "ical" ? "Copied!" : "Copy iCal URL"}
              </button>
              <Link
                href="/schedule/builder"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                <Wrench className="h-3.5 w-3.5" />
                Schedule Builder
              </Link>
            </div>
          )}
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
                              <OrgBadge orgId={trial.organization_id} />
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
                                {formatTrialDateRange(trial.start_date, trial.end_date)}
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

                            {/* View details */}
                            <Link
                              href={`/trials/${trial.id}`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View trial details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

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

                        {/* Planning card — only for "attending" trials */}
                        {trial.saved_status === "attending" && (
                          <MyTrialsPlanningCard
                            trialId={trial.id}
                            trialTitle={trial.title}
                            trialLat={trial.lat}
                            trialLng={trial.lng}
                          />
                        )}
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
