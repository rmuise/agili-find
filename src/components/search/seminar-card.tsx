"use client";

import { MapPin, Calendar, User, ExternalLink, BookOpen, DollarSign } from "lucide-react";
import { formatTrialDateRange, formatDistance } from "@/lib/utils";
import { usePreferences } from "@/lib/preferences-context";

export interface SeminarResult {
  id: string;
  type: "seminar";
  title: string;
  description: string | null;
  instructor: string;
  start_date: string;
  end_date: string;
  venue_name: string;
  city: string;
  state: string;
  country: string;
  contact_email: string | null;
  contact_url: string | null;
  price: string | null;
  distance_miles: number | null;
}

interface SeminarCardProps {
  seminar: SeminarResult;
}

export function SeminarCard({ seminar }: SeminarCardProps) {
  const { distanceUnit } = usePreferences();
  const linkUrl = seminar.contact_url || (seminar.contact_email ? `mailto:${seminar.contact_email}` : null);

  return (
    <div className="bg-[var(--surface-2)] rounded-[14px] border border-[rgba(127,119,221,0.2)] p-4 hover:bg-[rgba(127,119,221,0.03)] hover:border-[rgba(127,119,221,0.35)] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[rgba(127,119,221,0.14)] text-[#afa9ec]">
              <BookOpen className="h-3 w-3" />
              SEMINAR
            </span>
            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[var(--cream)] truncate hover:text-[#afa9ec] hover:underline transition-colors"
              >
                {seminar.title}
              </a>
            ) : (
              <span className="text-sm font-semibold text-[var(--cream)] truncate">
                {seminar.title}
              </span>
            )}
          </div>

          {/* Description */}
          {seminar.description && (
            <p className="text-xs text-[var(--muted-text)] mb-2 line-clamp-2">
              {seminar.description}
            </p>
          )}

          {/* Info rows */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-[var(--muted-text)]">
              <Calendar className="h-3.5 w-3.5 text-[var(--muted-2)] flex-shrink-0" />
              <span>{formatTrialDateRange(seminar.start_date, seminar.end_date)}</span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-[var(--muted-text)]">
              <MapPin className="h-3.5 w-3.5 text-[var(--muted-2)] flex-shrink-0" />
              <span>
                {seminar.venue_name} — {seminar.city}, {seminar.state}
              </span>
              {seminar.distance_miles !== null && (
                <span className="ml-1 text-xs text-[var(--muted-2)]">
                  ({formatDistance(seminar.distance_miles, distanceUnit)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-[var(--muted-text)]">
                <User className="h-3.5 w-3.5 text-[var(--muted-2)] flex-shrink-0" />
                <span>{seminar.instructor}</span>
              </div>
              {seminar.price && (
                <div className="flex items-center gap-1 text-sm text-[var(--muted-text)]">
                  <DollarSign className="h-3.5 w-3.5 text-[var(--muted-2)] flex-shrink-0" />
                  <span>{seminar.price}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Link */}
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-[var(--muted-2)] hover:text-[#afa9ec] transition-colors"
            title="View details"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
