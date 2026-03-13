"use client";

import { useEffect, useState } from "react";
import { Stethoscope, ShoppingBag, Sparkles, AlertTriangle } from "lucide-react";
import type {
  TrialServicesResponse,
  ProviderWithAssociation,
} from "@/types/services";
import { ServicesAccordion } from "./services-accordion";

interface TrialServicesPanelProps {
  trialId: string;
  trialLat: number;
  trialLng: number;
}

interface CategoryConfig {
  key: string;
  title: string;
  icon: React.ReactNode;
  providerTypes: string[];
  nearbyKey: keyof TrialServicesResponse["nearby"];
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "vets",
    title: "Veterinarians",
    icon: <Stethoscope className="h-4 w-4 text-red-500" />,
    providerTypes: ["vet"],
    nearbyKey: "veterinarians",
  },
  {
    key: "pet_stores",
    title: "Pet Stores",
    icon: <ShoppingBag className="h-4 w-4 text-green-500" />,
    providerTypes: ["vendor"],
    nearbyKey: "pet_stores",
  },
  {
    key: "body_workers",
    title: "Body Workers",
    icon: <Sparkles className="h-4 w-4 text-orange-500" />,
    providerTypes: ["body_worker"],
    nearbyKey: "body_workers",
  },
  {
    key: "emergency_vets",
    title: "Emergency Vets",
    icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
    providerTypes: ["vet"],
    nearbyKey: "emergency_vets",
  },
];

function filterProvidersByType(
  providers: ProviderWithAssociation[],
  types: string[]
): ProviderWithAssociation[] {
  return providers.filter((p) => types.includes(p.provider_type));
}

export function TrialServicesPanel({
  trialId,
  trialLat,
  trialLng,
}: TrialServicesPanelProps) {
  const [data, setData] = useState<TrialServicesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetch(`/api/trials/${trialId}/services`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load services");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [trialId]);

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-12 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500 mt-4">
        Could not load services: {error}
      </p>
    );
  }

  if (!data) return null;

  const { providers, nearby } = data;

  // Check if there's any data at all
  const hasAnyData =
    providers.attending.length > 0 ||
    providers.associated.length > 0 ||
    nearby.veterinarians.length > 0 ||
    nearby.pet_stores.length > 0 ||
    nearby.body_workers.length > 0 ||
    nearby.emergency_vets.length > 0;

  if (!hasAnyData) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Services &amp; Nearby
      </h3>

      {CATEGORIES.map((cat) => {
        // For emergency_vets category, only use "vet" type providers that are explicitly in emergency context
        // For now, show all providers matching the type in each category
        const attendingForCat = filterProvidersByType(
          providers.attending,
          cat.providerTypes
        );
        const associatedForCat = filterProvidersByType(
          providers.associated,
          cat.providerTypes
        );

        return (
          <ServicesAccordion
            key={cat.key}
            title={cat.title}
            icon={cat.icon}
            attendingProviders={attendingForCat}
            associatedProviders={associatedForCat}
            places={nearby[cat.nearbyKey]}
            trialLat={trialLat}
            trialLng={trialLng}
            defaultOpen={cat.key === "vets"}
          />
        );
      })}
    </div>
  );
}
