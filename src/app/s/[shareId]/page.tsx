"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  ExternalLink,
  CalendarPlus,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const ORG_COLORS: Record<string, string> = {
  akc: "bg-blue-500",
  usdaa: "bg-red-500",
  cpe: "bg-green-500",
  nadac: "bg-purple-500",
  uki: "bg-orange-500",
  ckc: "bg-pink-500",
  aac: "bg-teal-500",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  interested: { label: "Interested", color: "text-blue-700 bg-blue-50" },
  registered: { label: "Registered", color: "text-green-700 bg-green-50" },
  attending: { label: "Attending", color: "text-purple-700 bg-purple-50" },
};

interface PublicTrial {
  id: string;
  title: string;
  hosting_club: string | null;
  organization_id: string;
  organization_name: string;
  start_date: string;
  end_date: string;
  entry_close_date: string | null;
  source_url: string;
  venue_name: string;
  city: string;
  state: string;
  country: string;
  status: string;
}

export default function PublicSchedulePage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [displayName, setDisplayName] = useState<string>("");
  const [trials, setTrials] = useState<PublicTrial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareId) return;

    fetch(`/api/schedule/${shareId}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setDisplayName(data.displayName || "");
          setTrials(data.trials || []);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [shareId]);

  // Sort by start date, upcoming first
  const sortedTrials = useMemo(() => {
    const upcoming = trials
      .filter((t) => !isPast(parseISO(t.end_date)))
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
    const past = trials
      .filter((t) => isPast(parseISO(t.end_date)))
      .sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
    return { upcoming, past };
  }, [trials]);

  // Group by month
  const groupByMonth = (items: PublicTrial[]) => {
    const groups: Record<string, PublicTrial[]> = {};
    for (const trial of items) {
      const key = format(parseISO(trial.start_date), "MMMM yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push(trial);
    }
    return groups;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (startDate === endDate) return format(start, "EEE, MMM d, yyyy");
    if (start.getMonth() === end.getMonth())
      return `${format(start, "EEE, MMM d")} – ${format(end, "d, yyyy")}`;
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  };

  const icalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/ical/${shareId}`
      : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading schedule...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Schedule not found
          </h1>
          <p className="text-gray-500 mb-4">
            This schedule link may be invalid or expired.
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:underline font-medium text-sm"
          >
            Go to AgiliFind
          </Link>
        </div>
      </div>
    );
  }

  const upcomingGroups = groupByMonth(sortedTrials.upcoming);
  const pastGroups = groupByMonth(sortedTrials.past);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AgiliFind</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Search trials
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {displayName ? `${displayName}'s` : ""} Agility Schedule
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-gray-500">
              {sortedTrials.upcoming.length} upcoming trial
              {sortedTrials.upcoming.length !== 1 ? "s" : ""}
            </p>
            {icalUrl && (
              <a
                href={icalUrl}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Subscribe to calendar
              </a>
            )}
          </div>
        </div>

        {trials.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No trials on this schedule
            </h3>
            <p className="text-sm text-gray-500">
              This user hasn&apos;t saved any trials yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming */}
            {sortedTrials.upcoming.length > 0 && (
              <div>
                {Object.entries(upcomingGroups).map(([month, items]) => (
                  <div key={month} className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      {month}
                    </h2>
                    <div className="space-y-2">
                      {items.map((trial) => (
                        <TrialRow
                          key={trial.id}
                          trial={trial}
                          formatDateRange={formatDateRange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Past */}
            {sortedTrials.past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 border-t border-gray-200 pt-6">
                  Past Trials
                </h2>
                {Object.entries(pastGroups).map(([month, items]) => (
                  <div key={month} className="mb-4">
                    <h3 className="text-xs font-medium text-gray-400 mb-2">
                      {month}
                    </h3>
                    <div className="space-y-2">
                      {items.map((trial) => (
                        <TrialRow
                          key={trial.id}
                          trial={trial}
                          formatDateRange={formatDateRange}
                          isPast
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TrialRow({
  trial,
  formatDateRange,
  isPast = false,
}: {
  trial: PublicTrial;
  formatDateRange: (s: string, e: string) => string;
  isPast?: boolean;
}) {
  const orgColor = ORG_COLORS[trial.organization_id] || "bg-gray-500";
  const statusInfo = STATUS_LABELS[trial.status];

  return (
    <div
      className={`bg-white rounded-lg border p-3 sm:p-4 ${
        isPast ? "opacity-50 border-gray-100" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
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
          </div>
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
        <div className="flex items-center gap-2 flex-shrink-0">
          {statusInfo && (
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          )}
          <a
            href={trial.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
