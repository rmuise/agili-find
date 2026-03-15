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
import { PageHeader } from "@/components/layout/page-header";
import { OrgChip as OrgBadge } from "@/components/ui/OrgChip";
import { LoadingState } from "@/components/ui/loading-state";
import { STATUS_LABELS } from "@/lib/constants";
import { formatTrialDateRange } from "@/lib/utils";

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
    if (!shareId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

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


  const icalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/ical/${shareId}`
      : "";

  if (isLoading) {
    return <LoadingState message="Loading schedule..." />;
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--cream)] mb-2">
            Schedule not found
          </h1>
          <p className="text-[var(--muted-text)] mb-4">
            This schedule link may be invalid or expired.
          </p>
          <Link
            href="/"
            className="text-[var(--accent)] hover:underline font-medium text-sm"
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
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader maxWidth="5xl" backLabel="Search trials" />

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--cream)]">
            {displayName ? `${displayName}'s` : ""} Agility Schedule
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-[var(--muted-text)]">
              {sortedTrials.upcoming.length} upcoming trial
              {sortedTrials.upcoming.length !== 1 ? "s" : ""}
            </p>
            {icalUrl && (
              <a
                href={icalUrl}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:opacity-80"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Subscribe to calendar
              </a>
            )}
          </div>
        </div>

        {trials.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 text-[var(--muted-2)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--cream)] mb-2">
              No trials on this schedule
            </h3>
            <p className="text-sm text-[var(--muted-text)]">
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
                    <h2 className="text-sm font-semibold text-[var(--muted-text)] uppercase tracking-wide mb-3">
                      {month}
                    </h2>
                    <div className="space-y-2">
                      {items.map((trial) => (
                        <TrialRow
                          key={trial.id}
                          trial={trial}
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
                <h2 className="text-sm font-semibold text-[var(--muted-2)] uppercase tracking-wide mb-3 border-t border-[var(--border)] pt-6">
                  Past Trials
                </h2>
                {Object.entries(pastGroups).map(([month, items]) => (
                  <div key={month} className="mb-4">
                    <h3 className="text-xs font-medium text-[var(--muted-2)] mb-2">
                      {month}
                    </h3>
                    <div className="space-y-2">
                      {items.map((trial) => (
                        <TrialRow
                          key={trial.id}
                          trial={trial}
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
  isPast = false,
}: {
  trial: PublicTrial;
  isPast?: boolean;
}) {
  const statusInfo = STATUS_LABELS[trial.status];

  return (
    <div
      className={`bg-[var(--surface)] rounded-lg border p-3 sm:p-4 ${
        isPast ? "opacity-50 border-[var(--border)]" : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <OrgBadge orgId={trial.organization_id} />
            <a
              href={trial.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[var(--cream)] truncate hover:text-[var(--accent)] hover:underline"
            >
              {trial.title}
            </a>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted-text)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[var(--muted-text)]" />
              {formatTrialDateRange(trial.start_date, trial.end_date)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[var(--muted-text)]" />
              {trial.city}, {trial.state}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {statusInfo && (
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusInfo.bg} ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          )}
          <a
            href={trial.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-[var(--muted-text)] hover:text-[var(--accent)] transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
