"use client";

import { MapPin, Calendar, User, ExternalLink, BookOpen, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";

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
  const formatDateRange = () => {
    const start = parseISO(seminar.start_date);
    const end = parseISO(seminar.end_date);
    if (seminar.start_date === seminar.end_date) {
      return format(start, "EEE, MMM d, yyyy");
    }
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, "EEE, MMM d")} – ${format(end, "d, yyyy")}`;
    }
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  };

  const linkUrl = seminar.contact_url || (seminar.contact_email ? `mailto:${seminar.contact_email}` : null);

  return (
    <div className="bg-white rounded-lg border border-indigo-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-white bg-indigo-500">
              <BookOpen className="h-3 w-3" />
              SEMINAR
            </span>
            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-gray-900 truncate hover:text-indigo-600 hover:underline transition-colors"
              >
                {seminar.title}
              </a>
            ) : (
              <span className="text-sm font-semibold text-gray-900 truncate">
                {seminar.title}
              </span>
            )}
          </div>

          {/* Description */}
          {seminar.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
              {seminar.description}
            </p>
          )}

          {/* Info rows */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{formatDateRange()}</span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>
                {seminar.venue_name} — {seminar.city}, {seminar.state}
              </span>
              {seminar.distance_miles !== null && (
                <span className="ml-1 text-xs text-gray-500">
                  ({seminar.distance_miles} mi)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span>{seminar.instructor}</span>
              </div>
              {seminar.price && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <DollarSign className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
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
            className="flex-shrink-0 p-2 text-gray-400 hover:text-indigo-600 transition-colors"
            title="View details"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
