import { Star, MapPin, Navigation } from "lucide-react";
import type { PlaceCacheRow } from "@/types/services";
import { haversineDistance, extractLatLngFromMapsUrl } from "@/lib/geo";

interface PlacesCardProps {
  place: PlaceCacheRow;
  trialLat: number;
  trialLng: number;
}

export function PlacesCard({ place, trialLat, trialLng }: PlacesCardProps) {
  const coords = extractLatLngFromMapsUrl(place.maps_url);
  const distance = coords
    ? haversineDistance(trialLat, trialLng, coords.lat, coords.lng)
    : null;

  return (
    <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200">
      {/* Map pin icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-blue-500" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {place.name || "Unknown"}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
            Nearby
          </span>
        </div>

        {/* Rating + distance */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
          {place.rating !== null && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              {place.rating.toFixed(1)}
            </span>
          )}
          {distance !== null && (
            <span className="flex items-center gap-0.5">
              <Navigation className="h-3 w-3 text-gray-400" />
              {distance < 1
                ? `${(distance * 5280).toFixed(0)} ft`
                : `${distance.toFixed(1)} mi`}
            </span>
          )}
        </div>

        {place.address && (
          <p className="text-xs text-gray-500 mb-1.5">{place.address}</p>
        )}

        {/* Google Maps link */}
        {place.maps_url && (
          <a
            href={place.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <MapPin className="h-3 w-3" />
            View on Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

