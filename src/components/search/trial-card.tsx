"use client";

import { MapPin, Calendar, User, ExternalLink } from "lucide-react";
import type { TrialResult } from "@/types/search";
import { format, parseISO } from "date-fns";

const ORG_COLORS: Record<string, string> = {
  akc: "bg-blue-500",
  usdaa: "bg-red-500",
  cpe: "bg-green-500",
  nadac: "bg-purple-500",
  uki: "bg-orange-500",
  ckc: "bg-pink-500",
  aac: "bg-teal-500",
};

interface TrialCardProps {
  trial: TrialResult;
}

export function TrialCard({ trial }: TrialCardProps) {
  const orgColor = ORG_COLORS[trial.organization_id] || "bg-gray-500";

  const formatDateRange = () => {
    const start = parseISO(trial.start_date);
    const end = parseISO(trial.end_date);
    if (trial.start_date === trial.end_date) {
      return format(start, "EEE, MMM d, yyyy");
    }
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, "EEE, MMM d")} – ${format(end, "d, yyyy")}`;
    }
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  };

  const closingDate = trial.entry_close_date
    ? format(parseISO(trial.entry_close_date), "MMM d")
    : null;

  const isClosingSoon =
    trial.entry_close_date &&
    parseISO(trial.entry_close_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title row */}
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
              className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 hover:underline transition-colors"
            >
              {trial.title}
            </a>
          </div>

          {/* Host club */}
          {trial.hosting_club && trial.hosting_club !== trial.title && (
            <a
              href={trial.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition-colors mb-2 block"
            >
              {trial.hosting_club}
            </a>
          )}

          {/* Info rows */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{formatDateRange()}</span>
              {closingDate && (
                <span
                  className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                    isClosingSoon
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Closes {closingDate}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>
                {trial.venue_name} — {trial.city}, {trial.state}
              </span>
              {trial.distance_miles !== null && (
                <span className="ml-1 text-xs text-gray-500">
                  ({trial.distance_miles} mi)
                </span>
              )}
            </div>

            {trial.judges.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {trial.judges.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Link to source */}
        <a
          href={trial.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title={`View on ${trial.organization_id.toUpperCase()}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
