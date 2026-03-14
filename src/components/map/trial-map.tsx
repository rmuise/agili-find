"use client";

import { useEffect, useRef, useMemo } from "react";
import type L from "leaflet";
import type { TrialResult } from "@/types/search";
import type { SeminarResult } from "@/components/search/seminar-card";
import type { TrainingSpaceResult } from "@/components/search/training-space-card";

// Leaflet CSS is imported via a link tag in the component
// to avoid SSR issues with the CSS import

interface TrialMapProps {
  trials: TrialResult[];
  seminars?: SeminarResult[];
  trainingSpaces?: TrainingSpaceResult[];
  center?: { lat: number; lng: number };
  distanceUnit?: "mi" | "km";
}

import { ORG_HEX_COLORS } from "@/lib/constants";
import { formatDistance } from "@/lib/utils";

export function TrialMapInner({ trials, seminars = [], trainingSpaces = [], center, distanceUnit = "mi" }: TrialMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Group trials by venue to show counts
  const venueGroups = useMemo(() => {
    const groups = new Map<
      string,
      { lat: number; lng: number; trials: TrialResult[] }
    >();
    for (const trial of trials) {
      const key = `${trial.lat.toFixed(4)},${trial.lng.toFixed(4)}`;
      if (!groups.has(key)) {
        groups.set(key, { lat: trial.lat, lng: trial.lng, trials: [] });
      }
      groups.get(key)!.trials.push(trial);
    }
    return groups;
  }, [trials]);

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR
    import("leaflet").then((L) => {
      // Add Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!mapRef.current) return;

      // Create map if it doesn't exist
      if (!mapInstanceRef.current) {
        const defaultCenter: L.LatLngExpression = center
          ? [center.lat, center.lng]
          : [39.8283, -98.5795]; // Center of US
        const defaultZoom = center ? 8 : 4;

        mapInstanceRef.current = L.map(mapRef.current).setView(
          defaultCenter,
          defaultZoom
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      if (markersRef.current) {
        markersRef.current.clearLayers();
      } else {
        markersRef.current = L.layerGroup().addTo(map);
      }

      // Add markers for each venue group
      venueGroups.forEach(({ lat, lng, trials: vTrials }) => {
        const orgId = vTrials[0].organization_id;
        const color = ORG_HEX_COLORS[orgId] || "#6b7280";

        // Create circle marker
        const marker = L.circleMarker([lat, lng], {
          radius: Math.min(6 + vTrials.length * 2, 16),
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        // Build popup content
        const popupHtml = vTrials
          .slice(0, 5)
          .map(
            (t) =>
              `<div style="margin-bottom:4px;">
                <strong>${t.title}</strong><br/>
                <span style="color:#666;font-size:12px;">${t.start_date}${t.distance_miles ? ` · ${formatDistance(t.distance_miles, distanceUnit)}` : ""}</span>
              </div>`
          )
          .join("");

        const more =
          vTrials.length > 5
            ? `<div style="color:#666;font-size:12px;">+${vTrials.length - 5} more</div>`
            : "";

        marker.bindPopup(
          `<div style="max-width:250px;">${popupHtml}${more}</div>`
        );

        markersRef.current!.addLayer(marker);
      });

      // Fit bounds to markers if we have any
      if (venueGroups.size > 0) {
        const allCoords: L.LatLngExpression[] = [];
        venueGroups.forEach(({ lat, lng }) => {
          allCoords.push([lat, lng]);
        });
        if (allCoords.length > 1) {
          map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
        } else if (allCoords.length === 1) {
          map.setView(allCoords[0], 10);
        }
      }
    });

    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when data changes (without recreating the map)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current!;
      markersRef.current!.clearLayers();
      const allCoords: L.LatLngExpression[] = [];

      // Trial markers
      venueGroups.forEach(({ lat, lng, trials: vTrials }) => {
        const orgId = vTrials[0].organization_id;
        const color = ORG_HEX_COLORS[orgId] || "#6b7280";

        const marker = L.circleMarker([lat, lng], {
          radius: Math.min(6 + vTrials.length * 2, 16),
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        const popupHtml = vTrials
          .slice(0, 5)
          .map(
            (t) =>
              `<div style="margin-bottom:4px;">
                <strong>${t.title}</strong><br/>
                <span style="color:#666;font-size:12px;">${t.start_date}${t.distance_miles ? ` · ${formatDistance(t.distance_miles, distanceUnit)}` : ""}</span>
              </div>`
          )
          .join("");

        const more =
          vTrials.length > 5
            ? `<div style="color:#666;font-size:12px;">+${vTrials.length - 5} more</div>`
            : "";

        marker.bindPopup(
          `<div style="max-width:250px;">${popupHtml}${more}</div>`
        );

        markersRef.current!.addLayer(marker);
        allCoords.push([lat, lng]);
      });

      // Seminar markers (purple diamonds)
      for (const sem of seminars) {
        if (!sem.distance_miles && sem.distance_miles !== 0) continue;
        // Seminars from the API include lat/lng in the response if they have location
        const semData = sem as SeminarResult & { lat?: number; lng?: number };
        if (!semData.lat || !semData.lng) continue;

        const marker = L.circleMarker([semData.lat, semData.lng], {
          radius: 8,
          fillColor: "#8b5cf6",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        marker.bindPopup(
          `<div style="max-width:250px;">
            <div style="color:#8b5cf6;font-weight:600;font-size:11px;margin-bottom:2px;">SEMINAR</div>
            <strong>${sem.title}</strong><br/>
            <span style="color:#666;font-size:12px;">${sem.instructor} &middot; ${sem.start_date}</span>
          </div>`
        );

        markersRef.current!.addLayer(marker);
        allCoords.push([semData.lat, semData.lng]);
      }

      // Training space markers (green squares)
      for (const space of trainingSpaces) {
        const spaceData = space as TrainingSpaceResult & { lat?: number; lng?: number };
        if (!spaceData.lat || !spaceData.lng) continue;

        const marker = L.circleMarker([spaceData.lat, spaceData.lng], {
          radius: 7,
          fillColor: "#10b981",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        marker.bindPopup(
          `<div style="max-width:250px;">
            <div style="color:#10b981;font-weight:600;font-size:11px;margin-bottom:2px;">TRAINING SPACE</div>
            <strong>${space.name}</strong><br/>
            <span style="color:#666;font-size:12px;">${space.city}, ${space.state}${space.indoor ? " &middot; Indoor" : ""}</span>
          </div>`
        );

        markersRef.current!.addLayer(marker);
        allCoords.push([spaceData.lat, spaceData.lng]);
      }

      if (allCoords.length > 1) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
      }
    });
  }, [venueGroups, seminars, trainingSpaces]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[350px] sm:h-[450px] md:h-[500px] rounded-xl border border-[var(--border)] overflow-hidden"
      style={{ zIndex: 0 }}
    />
  );
}
