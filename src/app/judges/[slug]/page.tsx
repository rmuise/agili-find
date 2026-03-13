"use client";

import { useState, useEffect, use, Fragment } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  User,
  Globe,
  Image as ImageIcon,
  Gavel,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { OrgBadge } from "@/components/ui/org-badge";
import { CourseMapGallery } from "@/components/judges/course-map-gallery";
import { CourseMapUpload } from "@/components/judges/course-map-upload";
import { formatTrialDateRange } from "@/lib/utils";
import type { Judge, JudgeCourseMap } from "@/types/judge";

interface JudgeTrial {
  id: string;
  title: string;
  hosting_club: string | null;
  organization_id: string;
  start_date: string;
  end_date: string;
  classes: string[];
  judges: string[];
  source_url: string;
  venue_name: string;
  city: string;
  state: string;
}

export default function JudgeProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [judge, setJudge] = useState<Judge | null>(null);
  const [trials, setTrials] = useState<JudgeTrial[]>([]);
  const [courseMaps, setCourseMaps] = useState<JudgeCourseMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = () => {
    fetch(`/api/judges/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setJudge(data.judge);
        setTrials(data.trials);
        setCourseMaps(data.courseMaps);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  if (isLoading) {
    return <LoadingState message="Loading judge profile..." />;
  }

  if (!judge) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <PageHeader backLabel="Back" />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Gavel className="h-10 w-10 text-[var(--muted-2)] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[var(--cream)] mb-2">
            Judge not found
          </h2>
          <Link
            href="/"
            className="text-sm text-[var(--agili-accent)] hover:underline"
          >
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  // Split trials into upcoming and past
  const now = new Date().toISOString().slice(0, 10);
  const upcomingTrials = trials.filter((t) => t.start_date >= now);
  const pastTrials = trials.filter((t) => t.start_date < now);

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <PageHeader backLabel="Back" />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Profile Header */}
        <div className="bg-[var(--surface-2)] rounded-[14px] border border-[var(--border)] p-6 mb-6">
          <div className="flex items-start gap-4">
            {judge.photo_url ? (
              <img
                src={judge.photo_url}
                alt={judge.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border)]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--surface-3)] border-2 border-[var(--border)] flex items-center justify-center">
                <span className="text-xl font-bold text-[var(--agili-accent)]">
                  {judge.name[0].toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[var(--cream)] font-[var(--font-bebas)] tracking-wide">
                {judge.name}
              </h1>

              {judge.bio && (
                <p className="text-sm text-[var(--muted-text)] mt-1">
                  {judge.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--muted-text)]">
                {judge.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[var(--muted-2)]" />
                    {judge.location}
                  </span>
                )}
                {judge.organizations.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    {judge.organizations.map((org) => (
                      <OrgBadge key={org} orgId={org} />
                    ))}
                  </span>
                )}
                {judge.website_url && (
                  <a
                    href={judge.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[var(--agili-accent)] transition-colors"
                  >
                    <Globe className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>

              <div className="flex gap-4 mt-3 text-sm text-[var(--muted-text)]">
                <span>
                  <strong className="text-[var(--cream)]">{trials.length}</strong>{" "}
                  trials
                </span>
                <span>
                  <strong className="text-[var(--cream)]">{courseMaps.length}</strong>{" "}
                  course maps
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Trials */}
        {upcomingTrials.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[var(--muted-text)] uppercase tracking-wide mb-3">
              Upcoming Trials ({upcomingTrials.length})
            </h2>
            <div className="space-y-2">
              {upcomingTrials.map((trial) => (
                <TrialRow key={trial.id} trial={trial} />
              ))}
            </div>
          </div>
        )}

        {/* Past Trials */}
        {pastTrials.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[var(--muted-text)] uppercase tracking-wide mb-3">
              Recent Trials ({pastTrials.length})
            </h2>
            <div className="space-y-2">
              {pastTrials.map((trial) => (
                <TrialRow key={trial.id} trial={trial} />
              ))}
            </div>
          </div>
        )}

        {trials.length === 0 && (
          <div className="text-center py-10 bg-[var(--surface-2)] rounded-[14px] border border-[var(--border)] mb-6">
            <Calendar className="h-8 w-8 text-[var(--muted-2)] mx-auto mb-2" />
            <p className="text-sm text-[var(--muted-text)]">
              No trials found for this judge
            </p>
          </div>
        )}

        {/* Course Maps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--muted-text)] uppercase tracking-wide">
              Course Maps ({courseMaps.length})
            </h2>
            <CourseMapUpload judgeSlug={slug} onUploaded={fetchData} />
          </div>

          {courseMaps.length > 0 ? (
            <CourseMapGallery maps={courseMaps} />
          ) : (
            <div className="text-center py-10 bg-[var(--surface-2)] rounded-[14px] border border-[var(--border)]">
              <ImageIcon className="h-8 w-8 text-[var(--muted-2)] mx-auto mb-2" />
              <p className="text-sm text-[var(--muted-text)]">
                No course maps yet — be the first to upload one!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrialRow({ trial }: { trial: JudgeTrial }) {
  return (
    <Link
      href={`/trials/${trial.id}`}
      className="block bg-[var(--surface-2)] rounded-lg border border-[var(--border)] p-3 hover:bg-[rgba(232,255,71,0.025)] hover:border-[rgba(232,255,71,0.25)] transition-all"
    >
      <div className="flex items-center gap-2 mb-1">
        <OrgBadge orgId={trial.organization_id} />
        <span className="text-sm font-semibold text-[var(--cream)] truncate">
          {trial.title}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-text)]">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3 text-[var(--muted-2)]" />
          {formatTrialDateRange(trial.start_date, trial.end_date)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 text-[var(--muted-2)]" />
          {trial.venue_name} — {trial.city}, {trial.state}
        </span>
      </div>
    </Link>
  );
}
