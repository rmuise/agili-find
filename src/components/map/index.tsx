"use client";

import dynamic from "next/dynamic";
import type { TrialResult } from "@/types/search";

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
  center?: { lat: number; lng: number };
}

export function TrialMap({ trials, center }: TrialMapProps) {
  return <TrialMapInner trials={trials} center={center} />;
}
