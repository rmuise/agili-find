"use client";

import { Stethoscope } from "lucide-react";
import { TrialServicesPanel } from "./trial-services-panel";

interface MyTrialsPlanningCardProps {
  trialId: string;
  trialTitle: string;
  trialLat: number;
  trialLng: number;
}

export function MyTrialsPlanningCard({
  trialId,
  trialTitle,
  trialLat,
  trialLng,
}: MyTrialsPlanningCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-2">
      <div className="flex items-center gap-2 mb-1">
        <Stethoscope className="h-4 w-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-900">
          Planning: Services &amp; Nearby
        </h4>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        Nearby vets, stores, and services for {trialTitle}
      </p>
      <TrialServicesPanel
        trialId={trialId}
        trialLat={trialLat}
        trialLng={trialLng}
      />
    </div>
  );
}
