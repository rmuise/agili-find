"use client";

import dynamic from "next/dynamic";
import type { TrialResult } from "@/types/search";
import type { SeminarResult } from "@/components/search/seminar-card";
import type { TrainingSpaceResult } from "@/components/search/training-space-card";
import { usePreferences } from "@/lib/preferences-context";

const TrialMapInner = dynamic(
  () => import("./trial-map").then((mod) => mod.TrialMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] rounded-xl border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center">
        <div className="text-[var(--muted-text)]">Loading map...</div>
      </div>
    ),
  }
);

interface TrialMapProps {
  trials: TrialResult[];
  seminars?: SeminarResult[];
  trainingSpaces?: TrainingSpaceResult[];
  center?: { lat: number; lng: number };
}

export function TrialMap({ trials, seminars, trainingSpaces, center }: TrialMapProps) {
  const { distanceUnit } = usePreferences();
  return <TrialMapInner trials={trials} seminars={seminars} trainingSpaces={trainingSpaces} center={center} distanceUnit={distanceUnit} />;
}
