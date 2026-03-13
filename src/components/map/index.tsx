"use client";

import dynamic from "next/dynamic";
import type { TrialResult } from "@/types/search";
import type { SeminarResult } from "@/components/search/seminar-card";
import type { TrainingSpaceResult } from "@/components/search/training-space-card";

const TrialMapInner = dynamic(
  () => import("./trial-map").then((mod) => mod.TrialMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
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
  return <TrialMapInner trials={trials} seminars={seminars} trainingSpaces={trainingSpaces} center={center} />;
}
