"use client";

import {
  MapPin,
  ExternalLink,
  Mail,
  Phone,
  Home,
  Trees,
  Dumbbell,
} from "lucide-react";

export interface TrainingSpaceResult {
  id: string;
  name: string;
  description: string | null;
  surface_type: string | null;
  indoor: boolean;
  has_equipment: boolean;
  equipment_details: string | null;
  address: string | null;
  city: string;
  state: string;
  country: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  rental_info: string | null;
  photo_url: string | null;
  distance_miles: number | null;
}

const surfaceLabels: Record<string, string> = {
  grass: "Grass",
  dirt: "Dirt",
  rubber: "Rubber",
  turf: "Turf",
  sand: "Sand",
  concrete: "Concrete",
  other: "Other",
};

export function TrainingSpaceCard({ space }: { space: TrainingSpaceResult }) {
  const location = [space.city, space.state].filter(Boolean).join(", ");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
              TRAINING SPACE
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {space.indoor ? (
                <>
                  <Home className="h-3 w-3" />
                  Indoor
                </>
              ) : (
                <>
                  <Trees className="h-3 w-3" />
                  Outdoor
                </>
              )}
            </span>
            {space.surface_type && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {surfaceLabels[space.surface_type] || space.surface_type}
              </span>
            )}
            {space.has_equipment && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                <Dumbbell className="h-3 w-3" />
                Equipment
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {space.website ? (
              <a
                href={space.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors inline-flex items-center gap-1"
              >
                {space.name}
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </a>
            ) : (
              space.name
            )}
          </h3>

          {/* Description */}
          {space.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {space.description}
            </p>
          )}

          {/* Equipment details */}
          {space.has_equipment && space.equipment_details && (
            <p className="text-xs text-gray-500 mb-2">
              <span className="font-medium">Equipment:</span>{" "}
              {space.equipment_details}
            </p>
          )}

          {/* Rental info */}
          {space.rental_info && (
            <p className="text-xs text-gray-500 mb-2">
              <span className="font-medium">Rental:</span> {space.rental_info}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {space.address ? `${space.address}, ${location}` : location}
            </span>

            {space.distance_miles !== null && (
              <span className="text-blue-600 font-medium">
                {space.distance_miles} mi away
              </span>
            )}

            {space.contact_email && (
              <a
                href={`mailto:${space.contact_email}`}
                className="inline-flex items-center gap-1 hover:text-blue-600"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
            )}

            {space.contact_phone && (
              <a
                href={`tel:${space.contact_phone}`}
                className="inline-flex items-center gap-1 hover:text-blue-600"
              >
                <Phone className="h-3.5 w-3.5" />
                {space.contact_phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
