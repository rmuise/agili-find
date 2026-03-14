"use client";

import { useState, useRef, useCallback, Fragment } from "react";
import Link from "next/link";
import { MapPin, Calendar, User, ExternalLink, Bookmark, Eye } from "lucide-react";
import { slugify } from "@/lib/utils";
import type { TrialResult } from "@/types/search";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/lib/supabase/auth-context";
import { useSavedTrials } from "@/lib/hooks/saved-trials-context";
import { GatedActionPrompt } from "@/components/auth/gated-action-prompt";
import { OrgBadge } from "@/components/ui/org-badge";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { STATUS_LABELS } from "@/lib/constants";
import { formatTrialDateRange, formatDistance } from "@/lib/utils";
import { usePreferences } from "@/lib/preferences-context";

interface TrialCardProps {
  trial: TrialResult;
}

export function TrialCard({ trial }: TrialCardProps) {
  const { user } = useAuth();
  const { isSaved, getStatus, toggleSave, updateStatus } = useSavedTrials();
  const { distanceUnit } = usePreferences();
  const [showGatedPrompt, setShowGatedPrompt] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const saved = isSaved(trial.id);
  const status = getStatus(trial.id);

  useClickOutside(statusMenuRef, useCallback(() => setShowStatusMenu(false), []), showStatusMenu);

  const handleSaveClick = async () => {
    if (!user) {
      setShowGatedPrompt(true);
      return;
    }
    await toggleSave(trial.id);
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus(trial.id, newStatus);
    setShowStatusMenu(false);
  };

  const closingDate = trial.entry_close_date
    ? format(parseISO(trial.entry_close_date), "MMM d")
    : null;

  const isClosingSoon =
    trial.entry_close_date &&
    parseISO(trial.entry_close_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <>
      <div className="bg-[var(--surface-2)] rounded-[14px] border border-[var(--border)] p-4 hover:bg-[rgba(232,255,71,0.025)] hover:border-[rgba(232,255,71,0.25)] transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-1">
              <OrgBadge orgId={trial.organization_id} />
              <a
                href={trial.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[var(--cream)] truncate hover:text-[var(--agili-accent)] hover:underline transition-colors"
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
                className="text-xs text-[var(--muted-text)] hover:text-[var(--agili-accent)] hover:underline transition-colors mb-2 block"
              >
                {trial.hosting_club}
              </a>
            )}

            {/* Info rows */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-[var(--muted-text)]">
                <Calendar className="h-3.5 w-3.5 text-[var(--muted-2)] flex-shrink-0" />
                <span>{formatTrialDateRange(trial.start_date, trial.end_date)}</span>
                {closingDate && (
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                      isClosingSoon
                        ? "bg-[rgba(240,149,149,0.12)] text-[#f09595]"
                        : "bg-[var(--surface-3)] text-[var(--muted-text)]"
                    }`}
                  >
                    Closes {closingDate}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-sm text-[var(--muted-text)]">
                <MapPin className="h-3.5 w-3.5 text-[var(--muted-2)] flex-shrink-0" />
                <span>
                  {trial.venue_name} — {trial.city}, {trial.state}
                </span>
                {trial.distance_miles !== null && (
                  <span className="ml-1 text-xs text-[var(--muted-2)]">
                    ({formatDistance(trial.distance_miles, distanceUnit)})
                  </span>
                )}
              </div>

              {trial.judges.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--muted-text)]">
                  <User className="h-3.5 w-3.5 text-[var(--muted-2)] flex-shrink-0" />
                  <span className="truncate">
                    {trial.judges.map((name, i) => (
                      <Fragment key={name}>
                        {i > 0 && ", "}
                        <Link
                          href={`/judges/${slugify(name)}`}
                          className="hover:text-[var(--agili-accent)] hover:underline transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {name}
                        </Link>
                      </Fragment>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions column */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {/* Save/bookmark button */}
            <button
              onClick={handleSaveClick}
              className={`p-2 rounded-md transition-colors ${
                saved
                  ? "text-[var(--agili-accent)] hover:text-[var(--accent-dark)] hover:bg-[rgba(232,255,71,0.08)]"
                  : "text-[var(--muted-2)] hover:text-[var(--agili-accent)] hover:bg-[rgba(232,255,71,0.05)]"
              }`}
              title={saved ? "Unsave trial" : "Save trial"}
            >
              <Bookmark
                className="h-4 w-4"
                fill={saved ? "currentColor" : "none"}
              />
            </button>

            {/* Status badge (when saved) */}
            {saved && status && (
              <div className="relative" ref={statusMenuRef}>
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_LABELS[status]?.bg || "bg-[var(--surface-3)]"} ${STATUS_LABELS[status]?.color || "text-[var(--muted-text)]"}`}
                >
                  {STATUS_LABELS[status]?.label || status}
                </button>

                {/* Status dropdown */}
                {showStatusMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-[var(--surface)] border border-[var(--border-2)] rounded-md shadow-lg z-10 py-1 min-w-[120px]">
                    {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(key)}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[rgba(232,255,71,0.05)] transition-colors ${
                          key === status ? "font-semibold" : ""
                        } ${color}`}
                      >
                        {label}
                        {key === status && " \u2713"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View details */}
            <Link
              href={`/trials/${trial.id}`}
              className="p-2 text-[var(--muted-2)] hover:text-[var(--agili-accent)] transition-colors"
              title="View trial details &amp; services"
            >
              <Eye className="h-4 w-4" />
            </Link>

            {/* External link */}
            <a
              href={trial.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[var(--muted-2)] hover:text-[var(--agili-accent)] transition-colors"
              title={`View on ${trial.organization_id.toUpperCase()}`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Gated action prompt modal */}
      {showGatedPrompt && (
        <GatedActionPrompt onDismiss={() => setShowGatedPrompt(false)} />
      )}
    </>
  );
}
