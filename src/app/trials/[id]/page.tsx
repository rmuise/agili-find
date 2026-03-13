"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  User,
  ExternalLink,
  ArrowLeft,
  Bookmark,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/lib/supabase/auth-context";
import { useSavedTrials } from "@/lib/hooks/saved-trials-context";
import { GatedActionPrompt } from "@/components/auth/gated-action-prompt";
import { TrialServicesPanel } from "@/components/services/trial-services-panel";
import { PageHeader } from "@/components/layout/page-header";
import { OrgBadge } from "@/components/ui/org-badge";
import { formatTrialDateRange } from "@/lib/utils";
import type { TrialResult } from "@/types/search";

export default function TrialDetailPage() {
  const params = useParams();
  const trialId = params.id as string;
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedTrials();

  const [trial, setTrial] = useState<TrialResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGatedPrompt, setShowGatedPrompt] = useState(false);

  useEffect(() => {
    if (!trialId) return;

    fetch(`/api/trials/${trialId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Trial not found");
        return res.json();
      })
      .then((data) => setTrial(data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [trialId]);

  const handleSaveClick = async () => {
    if (!user) {
      setShowGatedPrompt(true);
      return;
    }
    await toggleSave(trialId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !trial) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Trial not found
          </h1>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const saved = isSaved(trial.id);

  const closingDate = trial.entry_close_date
    ? format(parseISO(trial.entry_close_date), "MMM d, yyyy")
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Trial info card */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <OrgBadge orgId={trial.organization_id} />
                <h1 className="text-lg font-bold text-gray-900">
                  {trial.title}
                </h1>
              </div>
              {trial.hosting_club && trial.hosting_club !== trial.title && (
                <p className="text-sm text-gray-500">{trial.hosting_club}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleSaveClick}
                className={`p-2 rounded-md transition-colors ${
                  saved
                    ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    : "text-gray-400 hover:text-blue-600 hover:bg-gray-50"
                }`}
                title={saved ? "Unsave trial" : "Save trial"}
              >
                <Bookmark
                  className="h-5 w-5"
                  fill={saved ? "currentColor" : "none"}
                />
              </button>
              <a
                href={trial.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="View on source"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{formatTrialDateRange(trial.start_date, trial.end_date)}</span>
              {closingDate && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  Closes {closingDate}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>
                {trial.venue_name} — {trial.city}, {trial.state}
              </span>
            </div>

            {trial.judges.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{trial.judges.join(", ")}</span>
              </div>
            )}
          </div>

          {/* Services Panel — visible to ALL users */}
          <TrialServicesPanel
            trialId={trial.id}
            trialLat={trial.lat}
            trialLng={trial.lng}
          />
        </div>
      </div>

      {showGatedPrompt && (
        <GatedActionPrompt onDismiss={() => setShowGatedPrompt(false)} />
      )}
    </div>
  );
}
