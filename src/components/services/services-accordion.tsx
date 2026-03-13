"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ProviderWithAssociation, PlaceCacheRow } from "@/types/services";
import { ProviderCard } from "./provider-card";
import { PlacesCard } from "./places-card";
import { haversineDistance, extractLatLngFromMapsUrl } from "@/lib/geo";

interface ServicesAccordionProps {
  title: string;
  icon: React.ReactNode;
  attendingProviders: ProviderWithAssociation[];
  associatedProviders: ProviderWithAssociation[];
  places: PlaceCacheRow[];
  trialLat: number;
  trialLng: number;
  defaultOpen?: boolean;
}

export function ServicesAccordion({
  title,
  icon,
  attendingProviders,
  associatedProviders,
  places,
  trialLat,
  trialLng,
  defaultOpen = false,
}: ServicesAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Hide entirely if all lists are empty
  const totalItems =
    attendingProviders.length + associatedProviders.length + places.length;
  if (totalItems === 0) return null;

  // Sort providers A-Z by business_name
  const sortedAttending = [...attendingProviders].sort((a, b) =>
    a.business_name.localeCompare(b.business_name)
  );
  const sortedAssociated = [...associatedProviders].sort((a, b) =>
    a.business_name.localeCompare(b.business_name)
  );

  // Sort places by distance ascending
  const sortedPlaces = [...places].sort((a, b) => {
    const coordsA = extractLatLngFromMapsUrl(a.maps_url);
    const coordsB = extractLatLngFromMapsUrl(b.maps_url);
    const distA = coordsA
      ? haversineDistance(trialLat, trialLng, coordsA.lat, coordsA.lng)
      : Infinity;
    const distB = coordsB
      ? haversineDistance(trialLat, trialLng, coordsB.lat, coordsB.lng)
      : Infinity;
    return distA - distB;
  });

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
            {totalItems}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="p-3 space-y-2 bg-gray-50/50">
          {/* 1. Attending providers */}
          {sortedAttending.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}

          {/* 2. Associated providers */}
          {sortedAssociated.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}

          {/* 3. Nearby places */}
          {sortedPlaces.map((p) => (
            <PlacesCard
              key={p.id}
              place={p}
              trialLat={trialLat}
              trialLng={trialLng}
            />
          ))}
        </div>
      )}
    </div>
  );
}
