"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  MapPin,
  Car,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Share2,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { STATUS_LABELS } from "@/lib/constants";
import { useAuth } from "@/lib/supabase/auth-context";
import { useToast } from "@/components/ui/toast";
import { usePreferences } from "@/lib/preferences-context";
import { formatDistance } from "@/lib/utils";
import {
  exportFunSchedule,
  exportPlainSchedule,
} from "@/lib/services/pdfExport";

interface SavedTrial {
  id: string;
  title: string;
  hosting_club: string | null;
  organization_name: string;
  start_date: string;
  end_date: string;
  venue_name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  source_url: string;
  saved_status: string;
  classes: string[];
}

interface Conflict {
  trialA: SavedTrial;
  trialB: SavedTrial;
  overlapDays: number;
}

interface TravelSegment {
  from: SavedTrial;
  to: SavedTrial;
  distanceMiles: number;
  gapDays: number;
}

import { haversineDistance as _haversine } from "@/lib/geo";

function haversineDistanceRounded(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return Math.round(_haversine(lat1, lng1, lat2, lng2));
}

function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): number {
  const a0 = new Date(aStart).getTime();
  const a1 = new Date(aEnd).getTime();
  const b0 = new Date(bStart).getTime();
  const b1 = new Date(bEnd).getTime();
  const overlapStart = Math.max(a0, b0);
  const overlapEnd = Math.min(a1, b1);
  if (overlapStart > overlapEnd) return 0;
  return Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(start: string, end: string) {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}


export default function ScheduleBuilderPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { distanceUnit } = usePreferences();
  const [trials, setTrials] = useState<SavedTrial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // PDF export state
  const [dogPhoto, setDogPhoto] = useState<string | null>(null);
  const [exportingFun, setExportingFun] = useState(false);
  const [exportingPlain, setExportingPlain] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDogPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleExportFun() {
    if (upcomingTrials.length === 0) return;
    setExportingFun(true);
    try {
      await exportFunSchedule(upcomingTrials, dogPhoto, user?.email ?? null);
      toast("Your schedule PDF is ready!", "success");
    } catch {
      toast("PDF export failed. Please try again.", "error");
    } finally {
      setExportingFun(false);
    }
  }

  function handleExportPlain() {
    if (upcomingTrials.length === 0) return;
    setExportingPlain(true);
    try {
      exportPlainSchedule(upcomingTrials, user?.email ?? null);
      toast("Your schedule PDF is ready!", "success");
    } catch {
      toast("PDF export failed. Please try again.", "error");
    } finally {
      setExportingPlain(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetch("/api/saved-trials/full")
        .then((r) => r.json())
        .then((data) => {
          setTrials(data.savedTrials || []);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [user, authLoading, router]);

  // Only upcoming trials
  const upcomingTrials = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return trials
      .filter((t) => t.end_date >= today)
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
  }, [trials]);

  // Detect conflicts
  const conflicts = useMemo(() => {
    const result: Conflict[] = [];
    for (let i = 0; i < upcomingTrials.length; i++) {
      for (let j = i + 1; j < upcomingTrials.length; j++) {
        const a = upcomingTrials[i];
        const b = upcomingTrials[j];
        const overlap = datesOverlap(
          a.start_date,
          a.end_date,
          b.start_date,
          b.end_date
        );
        if (overlap > 0) {
          result.push({ trialA: a, trialB: b, overlapDays: overlap });
        }
      }
    }
    return result;
  }, [upcomingTrials]);

  // Travel segments between consecutive trials
  const travelSegments = useMemo(() => {
    const segments: TravelSegment[] = [];
    for (let i = 0; i < upcomingTrials.length - 1; i++) {
      const from = upcomingTrials[i];
      const to = upcomingTrials[i + 1];
      if (!from.lat || !from.lng || !to.lat || !to.lng) continue;

      const gapMs =
        new Date(to.start_date).getTime() -
        new Date(from.end_date).getTime();
      const gapDays = Math.floor(gapMs / (1000 * 60 * 60 * 24));

      const dist = haversineDistanceRounded(from.lat, from.lng, to.lat, to.lng);
      if (dist > 0) {
        segments.push({
          from,
          to,
          distanceMiles: dist,
          gapDays,
        });
      }
    }
    return segments;
  }, [upcomingTrials]);

  // Group by month
  const monthGroups = useMemo(() => {
    const groups: Record<string, SavedTrial[]> = {};
    for (const trial of upcomingTrials) {
      const d = new Date(trial.start_date + "T00:00:00");
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(trial);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [upcomingTrials]);

  // Auto-expand all months on load
  useEffect(() => {
    if (monthGroups.length > 0 && expandedMonths.size === 0) {
      setExpandedMonths(new Set(monthGroups.map(([key]) => key)));
    }
  }, [monthGroups, expandedMonths.size]);

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const conflictSet = useMemo(() => {
    const ids = new Set<string>();
    for (const c of conflicts) {
      ids.add(c.trialA.id);
      ids.add(c.trialB.id);
    }
    return ids;
  }, [conflicts]);

  // Travel map: from trial id -> segment
  const travelMap = useMemo(() => {
    const map = new Map<string, TravelSegment>();
    for (const seg of travelSegments) {
      map.set(seg.from.id, seg);
    }
    return map;
  }, [travelSegments]);

  const totalMiles = travelSegments.reduce((sum, s) => sum + s.distanceMiles, 0);

  if (authLoading || (!user && !authLoading)) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader maxWidth="4xl" backHref="/schedule" backLabel="My Schedule" />

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--cream)] flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[var(--accent)]" />
            Schedule Builder
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Plan your season with conflict detection and travel estimates.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)] mx-auto mb-4" />
            <p className="text-[var(--muted)]">Loading your schedule...</p>
          </div>
        ) : upcomingTrials.length === 0 ? (
          <div className="text-center py-16 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <Calendar className="h-12 w-12 text-[var(--muted-2)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--cream)] mb-2">
              No upcoming trials saved
            </h3>
            <p className="text-[var(--muted)] mb-4">
              Save some trials to start planning your season.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--black)] bg-[var(--accent)] rounded-md hover:bg-[var(--accent-dark)]"
            >
              Search for trials
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--cream)]">{upcomingTrials.length}</p>
                <p className="text-xs text-[var(--muted)]">Upcoming Trials</p>
              </div>
              <div className={`rounded-lg border p-4 text-center ${conflicts.length > 0 ? "bg-[var(--error-bg)] border-[var(--error-border)]" : "bg-[var(--surface)] border-[var(--border)]"}`}>
                <p className={`text-2xl font-bold ${conflicts.length > 0 ? "text-[var(--error-text)]" : "text-[var(--cream)]"}`}>
                  {conflicts.length}
                </p>
                <p className="text-xs text-[var(--muted)]">Conflicts</p>
              </div>
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--cream)]">
                  {distanceUnit === "km"
                    ? Math.round(totalMiles * 1.60934).toLocaleString()
                    : totalMiles.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--muted)]">Total {distanceUnit === "km" ? "km" : "Miles"}</p>
              </div>
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--cream)]">
                  {monthGroups.length}
                </p>
                <p className="text-xs text-[var(--muted)]">Active Months</p>
              </div>
            </div>

            {/* Conflicts Alert */}
            {conflicts.length > 0 && (
              <div className="mb-6 p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-[var(--error-text)]" />
                  <h3 className="font-semibold text-[var(--error-text-strong)]">
                    {conflicts.length} Date Conflict{conflicts.length !== 1 ? "s" : ""}
                  </h3>
                </div>
                <div className="space-y-2">
                  {conflicts.map((c, i) => (
                    <div key={i} className="text-sm text-[var(--error-text)]">
                      <span className="font-medium">{c.trialA.title}</span>
                      {" overlaps with "}
                      <span className="font-medium">{c.trialB.title}</span>
                      {" by "}
                      {c.overlapDays} day{c.overlapDays !== 1 ? "s" : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-4">
              {monthGroups.map(([monthKey, monthTrials]) => {
                const d = new Date(monthKey + "-01T00:00:00");
                const monthLabel = d.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });
                const isExpanded = expandedMonths.has(monthKey);

                return (
                  <div key={monthKey} className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden">
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                        )}
                        <span className="font-semibold text-[var(--cream)]">
                          {monthLabel}
                        </span>
                        <span className="text-xs text-[var(--muted-2)]">
                          {monthTrials.length} trial{monthTrials.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--border)]">
                        {monthTrials.map((trial, idx) => {
                          const hasConflict = conflictSet.has(trial.id);
                          const segment = travelMap.get(trial.id);

                          return (
                            <div key={trial.id}>
                              <div
                                className={`px-4 py-3 flex items-start gap-3 ${
                                  hasConflict ? "bg-[var(--error-bg)]" : idx % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"
                                }`}
                              >
                                {/* Date column */}
                                <div className="w-24 flex-shrink-0 text-right">
                                  <p className="text-sm font-medium text-[var(--cream)]">
                                    {formatDateRange(trial.start_date, trial.end_date)}
                                  </p>
                                </div>

                                {/* Timeline dot */}
                                <div className="flex flex-col items-center flex-shrink-0 pt-1.5">
                                  <div
                                    className={`w-3 h-3 rounded-full border-2 ${
                                      hasConflict
                                        ? "border-[var(--error-text)] bg-[var(--error-border)]"
                                        : "border-[var(--accent)] bg-[var(--surface-2)]"
                                    }`}
                                  />
                                </div>

                                {/* Trial info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted)]">
                                      {trial.organization_name}
                                    </span>
                                    <span
                                      className={`text-xs font-medium px-1.5 py-0.5 rounded capitalize ${
                                        STATUS_LABELS[trial.saved_status]
                                          ? `${STATUS_LABELS[trial.saved_status].bg} ${STATUS_LABELS[trial.saved_status].color}`
                                          : "bg-[var(--surface-2)] text-[var(--muted)]"
                                      }`}
                                    >
                                      {STATUS_LABELS[trial.saved_status]?.label || trial.saved_status}
                                    </span>
                                    {hasConflict && (
                                      <span className="inline-flex items-center gap-0.5 text-xs text-[var(--error-text)] font-medium">
                                        <AlertTriangle className="h-3 w-3" />
                                        Conflict
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-medium text-[var(--cream)] mt-1">
                                    {trial.source_url ? (
                                      <a
                                        href={trial.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-[var(--accent)] inline-flex items-center gap-1"
                                      >
                                        {trial.title}
                                        <ExternalLink className="h-3 w-3 text-[var(--muted)]" />
                                      </a>
                                    ) : (
                                      trial.title
                                    )}
                                  </h4>
                                  {trial.hosting_club && (
                                    <p className="text-xs text-[var(--muted)]">
                                      {trial.hosting_club}
                                    </p>
                                  )}
                                  <p className="text-xs text-[var(--muted)] flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {trial.venue_name}, {trial.city}, {trial.state}
                                  </p>
                                </div>
                              </div>

                              {/* Travel segment */}
                              {segment && (
                                <div className="px-4 py-2 flex items-center gap-3 bg-[var(--info-bg)] border-t border-b border-[var(--info-border)]">
                                  <div className="w-24 flex-shrink-0" />
                                  <div className="flex items-center flex-shrink-0">
                                    <div className="w-[1px] h-4 bg-[var(--info-text-muted)] ml-[5px]" />
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-[var(--info-text)]">
                                    <Car className="h-3.5 w-3.5" />
                                    <span className="font-medium">
                                      ~{formatDistance(segment.distanceMiles, distanceUnit)} drive
                                    </span>
                                    <span className="opacity-70">
                                      {segment.gapDays <= 0
                                        ? "(same day / overlapping)"
                                        : segment.gapDays === 1
                                        ? "(1 day gap)"
                                        : `(${segment.gapDays} day gap)`}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Export Controls — always visible after load */}
        {!isLoading && (
          <div className="mt-6 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4">
            <h2 className="text-sm font-semibold text-[var(--cream)] mb-3 flex items-center gap-2">
              <Download className="h-4 w-4 text-[var(--accent)]" />
              Export Schedule
            </h2>

            {/* Dog photo upload */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="relative w-12 h-12 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--accent)] transition-colors overflow-hidden flex-shrink-0"
                onClick={() => photoInputRef.current?.click()}
                title="Upload a dog photo for the fun PDF"
              >
                {dogPhoto ? (
                  <img
                    src={dogPhoto}
                    alt="Dog"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlus className="h-5 w-5 text-[var(--muted)]" />
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <div className="text-xs text-[var(--muted)]">
                {dogPhoto ? (
                  <div className="flex items-center gap-2">
                    <span>Dog photo added</span>
                    <button
                      onClick={() => setDogPhoto(null)}
                      className="text-[var(--muted-2)] hover:text-[var(--cream)] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="hover:text-[var(--cream)] transition-colors"
                  >
                    Add dog photo for fun PDF (optional)
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Share My Schedule button */}
              <button
                onClick={handleExportFun}
                disabled={exportingFun || upcomingTrials.length === 0}
                title={upcomingTrials.length === 0 ? "Add at least one trial to export" : undefined}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md text-white bg-[#FF6B35] hover:bg-[#e55a28] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {exportingFun ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share My Schedule!
                  </>
                )}
              </button>

              {/* Plain schedule button */}
              <button
                onClick={handleExportPlain}
                disabled={exportingPlain || upcomingTrials.length === 0}
                title={upcomingTrials.length === 0 ? "Add at least one trial to export" : undefined}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-[var(--cream)] bg-transparent border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {exportingPlain ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Plain Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
